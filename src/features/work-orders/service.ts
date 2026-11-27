/**
 * Work orders (module 3): create, list, view and cancel. No Next.js imports,
 * so integration tests run it on PGlite.
 */
import { and, asc, count, desc, eq, inArray, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  customers,
  drivers,
  routes,
  users,
  vehicles,
  vehicleTypes,
  workOrders,
  workOrderVehicles,
  workStatuses,
} from "@/db/schema";
import type { AppDatabase, DbOrTx } from "@/db/types";
import { RuleError } from "@/lib/action-result";
import { sortByThai } from "@/lib/thai-sort";
import { allocateWorkOrderNo } from "./numbering";
import { bangkokDateTime, CREATABLE_STATUS_CODES, type WorkOrderInput } from "./schemas";
import { WORK_STATUS } from "./statuses";

export const WORK_ORDERS_PAGE_SIZE = 50;

// ---------------------------------------------------------------- form options

export type WorkOrderFormOptions = {
  customers: { id: number; name: string }[];
  statuses: { code: number; name: string }[];
  /** Active pickup → drop-off pairs, used to suggest and pair places (BR-WO-05). */
  routePairs: { pickup: string; dropoff: string }[];
  vehicleTypes: { id: number; name: string }[];
  drivers: { id: number; name: string; phone: string | null }[];
  vehicles: { id: number; plateNo: string; vehicleTypeId: number }[];
};

/** Only active master data can be picked for a new work order (MD-08, BR-MD-06). */
export async function getWorkOrderFormOptions(db: AppDatabase): Promise<WorkOrderFormOptions> {
  const [customerRows, statusRows, routeRows, typeRows, driverRows, vehicleRows] = await Promise.all([
    db.select({ id: customers.id, name: customers.name }).from(customers).where(eq(customers.isActive, true)),
    db
      .select({ code: workStatuses.code, name: workStatuses.name })
      .from(workStatuses)
      .where(ne(workStatuses.code, WORK_STATUS.CANCELLED))
      .orderBy(asc(workStatuses.sortOrder)),
    db
      .select({ pickup: routes.pickupLocation, dropoff: routes.dropoffLocation })
      .from(routes)
      .where(eq(routes.isActive, true)),
    db
      .select({ id: vehicleTypes.id, name: vehicleTypes.name, sortOrder: vehicleTypes.sortOrder })
      .from(vehicleTypes)
      .where(eq(vehicleTypes.isActive, true)),
    db
      .select({ id: drivers.id, firstName: drivers.firstName, lastName: drivers.lastName, phone: drivers.phone })
      .from(drivers)
      .where(eq(drivers.isActive, true)),
    db
      .select({ id: vehicles.id, plateNo: vehicles.plateNo, vehicleTypeId: vehicles.vehicleTypeId })
      .from(vehicles)
      .where(eq(vehicles.isActive, true)),
  ]);

  return {
    customers: sortByThai(customerRows, (row) => row.name),
    statuses: statusRows,
    routePairs: sortByThai(
      routeRows,
      (row) => row.pickup,
      (row) => row.dropoff,
    ),
    vehicleTypes: [...typeRows]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "th"))
      .map(({ id, name }) => ({ id, name })),
    drivers: sortByThai(
      driverRows.map((row) => ({ id: row.id, name: `${row.firstName} ${row.lastName}`, phone: row.phone })),
      (row) => row.name,
    ),
    vehicles: sortByThai(vehicleRows, (row) => row.plateNo),
  };
}

// ---------------------------------------------------------------------- create

async function activeIds(
  tx: DbOrTx,
  table: typeof customers | typeof vehicleTypes | typeof drivers | typeof vehicles,
  ids: number[],
): Promise<Set<number>> {
  if (ids.length === 0) return new Set();
  const rows = await tx
    .select({ id: table.id })
    .from(table)
    .where(and(inArray(table.id, ids), eq(table.isActive, true)));
  return new Set(rows.map((row) => row.id));
}

function distinct(values: (number | null)[]): number[] {
  return [...new Set(values.filter((value): value is number => value !== null))];
}

/**
 * Number + header + vehicle lines in one transaction (ADR-0007, BR-WO-09):
 * if anything fails, nothing is saved and the number is not used up.
 */
export async function createWorkOrder(
  db: AppDatabase,
  actorId: string,
  input: WorkOrderInput,
  now: Date = new Date(),
): Promise<{ id: number; workOrderNo: string }> {
  if (!CREATABLE_STATUS_CODES.includes(input.statusCode)) throw new RuleError("สถานะงานไม่ถูกต้อง");

  return db.transaction(async (tx) => {
    // Picked lists can go stale while the form is open: re-check against active data.
    if ((await activeIds(tx, customers, [input.customerId])).size === 0) {
      throw new RuleError("ผู้ว่าจ้างที่เลือกถูกปิดใช้งานหรือไม่มีอยู่แล้ว กรุณาเลือกใหม่");
    }
    const typeIds = distinct(input.vehicles.map((line) => line.vehicleTypeId));
    const driverIds = distinct(input.vehicles.map((line) => line.driverId));
    const vehicleIds = distinct(input.vehicles.map((line) => line.vehicleId));
    const [okTypes, okDrivers, okVehicles] = await Promise.all([
      activeIds(tx, vehicleTypes, typeIds),
      activeIds(tx, drivers, driverIds),
      activeIds(tx, vehicles, vehicleIds),
    ]);
    if (
      typeIds.some((id) => !okTypes.has(id)) ||
      driverIds.some((id) => !okDrivers.has(id)) ||
      vehicleIds.some((id) => !okVehicles.has(id))
    ) {
      throw new RuleError("มีประเภทรถ พนักงานขับรถ หรือรถที่ถูกปิดใช้งานแล้ว กรุณาเลือกใหม่");
    }

    // The driver's phone is copied from the driver record (BR-WO-08: a snapshot).
    const phones = new Map(
      driverIds.length === 0
        ? []
        : (
            await tx
              .select({ id: drivers.id, phone: drivers.phone })
              .from(drivers)
              .where(inArray(drivers.id, driverIds))
          ).map((row) => [row.id, row.phone]),
    );

    const workOrderNo = await allocateWorkOrderNo(tx, now);
    const [created] = await tx
      .insert(workOrders)
      .values({
        workOrderNo,
        customerId: input.customerId,
        statusCode: input.statusCode,
        orderedBy: input.orderedBy,
        pickupLocation: input.pickupLocation,
        pickupContactName: input.pickupContactName,
        pickupContactPhone: input.pickupContactPhone,
        dropoffLocation: input.dropoffLocation,
        dropoffContactName: input.dropoffContactName,
        dropoffContactPhone: input.dropoffContactPhone,
        receiveAt: input.receiveAt ? bangkokDateTime(input.receiveAt) : null,
        deliveryAt: input.deliveryAt ? bangkokDateTime(input.deliveryAt) : null,
        customerJobNo: input.customerJobNo,
        remark: input.remark,
        transportFee: input.transportFee,
        portFee: input.portFee,
        demurrageFee: input.demurrageFee,
        overnightNights: input.overnightNights,
        overnightLaborFee: input.overnightLaborFee,
        extraWorkers: input.extraWorkers,
        extraWorkerFee: input.extraWorkerFee,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning({ id: workOrders.id });
    if (!created) throw new Error("work order insert returned no row");

    await tx.insert(workOrderVehicles).values(
      input.vehicles.map((line, index) => ({
        workOrderId: created.id,
        lineNo: index + 1,
        vehicleTypeId: line.vehicleTypeId,
        driverId: line.driverId,
        vehicleId: line.vehicleId,
        driverPhone: line.driverId === null ? null : (phones.get(line.driverId) ?? null),
        quantity: line.quantity,
        quantityUnit: line.quantityUnit,
        weight: line.weight,
        weightUnit: line.weightUnit,
        dimensions: line.dimensions,
      })),
    );
    return { id: created.id, workOrderNo };
  });
}

// ------------------------------------------------------------------------ list

export type WorkOrderListItem = {
  id: number;
  workOrderNo: string;
  statusCode: number;
  statusName: string;
  customerName: string;
  orderedBy: string | null;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  receiveAt: Date | null;
  deliveryAt: Date | null;
  transportFee: string | null;
  /** First vehicle line, e.g. "6 ล้อ · 70-1234", and how many more lines there are (Q15). */
  firstVehicle: string | null;
  moreVehicles: number;
};

/** One row per work order, newest first, 50 per page (BR-WO-14, Q15). Out-of-range pages are clamped. */
export async function listWorkOrders(
  db: AppDatabase,
  requestedPage: number,
): Promise<{ rows: WorkOrderListItem[]; page: number; pageCount: number; total: number }> {
  const [totalRow] = await db.select({ total: count() }).from(workOrders);
  const total = totalRow?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / WORK_ORDERS_PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.trunc(requestedPage) || 1), pageCount);

  const headers = await db
    .select({
      id: workOrders.id,
      workOrderNo: workOrders.workOrderNo,
      statusCode: workOrders.statusCode,
      statusName: workStatuses.name,
      customerName: customers.name,
      orderedBy: workOrders.orderedBy,
      pickupLocation: workOrders.pickupLocation,
      dropoffLocation: workOrders.dropoffLocation,
      receiveAt: workOrders.receiveAt,
      deliveryAt: workOrders.deliveryAt,
      transportFee: workOrders.transportFee,
    })
    .from(workOrders)
    .innerJoin(customers, eq(workOrders.customerId, customers.id))
    .innerJoin(workStatuses, eq(workOrders.statusCode, workStatuses.code))
    .orderBy(desc(workOrders.id))
    .limit(WORK_ORDERS_PAGE_SIZE)
    .offset((page - 1) * WORK_ORDERS_PAGE_SIZE);

  const ids = headers.map((row) => row.id);
  const lines =
    ids.length === 0
      ? []
      : await db
          .select({
            workOrderId: workOrderVehicles.workOrderId,
            typeName: vehicleTypes.name,
            plateNo: vehicles.plateNo,
          })
          .from(workOrderVehicles)
          .leftJoin(vehicleTypes, eq(workOrderVehicles.vehicleTypeId, vehicleTypes.id))
          .leftJoin(vehicles, eq(workOrderVehicles.vehicleId, vehicles.id))
          .where(inArray(workOrderVehicles.workOrderId, ids))
          .orderBy(asc(workOrderVehicles.workOrderId), asc(workOrderVehicles.lineNo));

  const byOrder = new Map<number, { first: string | null; total: number }>();
  for (const line of lines) {
    const entry = byOrder.get(line.workOrderId);
    if (entry) {
      entry.total += 1;
      continue;
    }
    const label = [line.typeName, line.plateNo].filter(Boolean).join(" · ");
    byOrder.set(line.workOrderId, { first: label || null, total: 1 });
  }

  const rows = headers.map((row) => {
    const summary = byOrder.get(row.id);
    return {
      ...row,
      firstVehicle: summary?.first ?? null,
      moreVehicles: summary ? summary.total - 1 : 0,
    };
  });
  return { rows, page, pageCount, total };
}

// ------------------------------------------------------------------------ view

export type WorkOrderVehicleLine = {
  lineNo: number;
  vehicleTypeName: string | null;
  driverName: string | null;
  driverPhone: string | null;
  plateNo: string | null;
  quantity: string | null;
  quantityUnit: string | null;
  weight: string | null;
  weightUnit: string | null;
  dimensions: string | null;
};

export type WorkOrderDetail = {
  id: number;
  workOrderNo: string;
  statusCode: number;
  statusName: string;
  customerName: string;
  orderedBy: string | null;
  pickupLocation: string | null;
  pickupContactName: string | null;
  pickupContactPhone: string | null;
  dropoffLocation: string | null;
  dropoffContactName: string | null;
  dropoffContactPhone: string | null;
  receiveAt: Date | null;
  deliveryAt: Date | null;
  customerJobNo: string | null;
  remark: string | null;
  transportFee: string | null;
  portFee: string | null;
  demurrageFee: string | null;
  overnightNights: number;
  overnightLaborFee: string | null;
  extraWorkers: number;
  extraWorkerFee: string | null;
  createdAt: Date;
  createdByName: string | null;
  cancelledAt: Date | null;
  cancelledByName: string | null;
  vehicles: WorkOrderVehicleLine[];
};

const creator = alias(users, "creator");
const canceller = alias(users, "canceller");

export async function getWorkOrder(db: AppDatabase, id: number): Promise<WorkOrderDetail | null> {
  const [header] = await db
    .select({
      id: workOrders.id,
      workOrderNo: workOrders.workOrderNo,
      statusCode: workOrders.statusCode,
      statusName: workStatuses.name,
      customerName: customers.name,
      orderedBy: workOrders.orderedBy,
      pickupLocation: workOrders.pickupLocation,
      pickupContactName: workOrders.pickupContactName,
      pickupContactPhone: workOrders.pickupContactPhone,
      dropoffLocation: workOrders.dropoffLocation,
      dropoffContactName: workOrders.dropoffContactName,
      dropoffContactPhone: workOrders.dropoffContactPhone,
      receiveAt: workOrders.receiveAt,
      deliveryAt: workOrders.deliveryAt,
      customerJobNo: workOrders.customerJobNo,
      remark: workOrders.remark,
      transportFee: workOrders.transportFee,
      portFee: workOrders.portFee,
      demurrageFee: workOrders.demurrageFee,
      overnightNights: workOrders.overnightNights,
      overnightLaborFee: workOrders.overnightLaborFee,
      extraWorkers: workOrders.extraWorkers,
      extraWorkerFee: workOrders.extraWorkerFee,
      createdAt: workOrders.createdAt,
      createdByName: creator.name,
      cancelledAt: workOrders.cancelledAt,
      cancelledByName: canceller.name,
    })
    .from(workOrders)
    .innerJoin(customers, eq(workOrders.customerId, customers.id))
    .innerJoin(workStatuses, eq(workOrders.statusCode, workStatuses.code))
    .leftJoin(creator, eq(workOrders.createdBy, creator.id))
    .leftJoin(canceller, eq(workOrders.cancelledBy, canceller.id))
    .where(eq(workOrders.id, id))
    .limit(1);
  if (!header) return null;

  const lines = await db
    .select({
      lineNo: workOrderVehicles.lineNo,
      vehicleTypeName: vehicleTypes.name,
      driverFirstName: drivers.firstName,
      driverLastName: drivers.lastName,
      driverPhone: workOrderVehicles.driverPhone,
      plateNo: vehicles.plateNo,
      quantity: workOrderVehicles.quantity,
      quantityUnit: workOrderVehicles.quantityUnit,
      weight: workOrderVehicles.weight,
      weightUnit: workOrderVehicles.weightUnit,
      dimensions: workOrderVehicles.dimensions,
    })
    .from(workOrderVehicles)
    .leftJoin(vehicleTypes, eq(workOrderVehicles.vehicleTypeId, vehicleTypes.id))
    .leftJoin(drivers, eq(workOrderVehicles.driverId, drivers.id))
    .leftJoin(vehicles, eq(workOrderVehicles.vehicleId, vehicles.id))
    .where(eq(workOrderVehicles.workOrderId, id))
    .orderBy(asc(workOrderVehicles.lineNo));

  return {
    ...header,
    vehicles: lines.map(({ driverFirstName, driverLastName, ...line }) => ({
      ...line,
      driverName: driverFirstName ? `${driverFirstName} ${driverLastName ?? ""}`.trim() : null,
    })),
  };
}

// ---------------------------------------------------------------------- cancel

/** Cancel = status 2 + who and when; nothing is deleted (ADR-0010, WO-13). */
export async function cancelWorkOrder(db: AppDatabase, actorId: string, id: number, now: Date = new Date()) {
  const cancelled = await db
    .update(workOrders)
    .set({ statusCode: WORK_STATUS.CANCELLED, cancelledAt: now, cancelledBy: actorId, updatedBy: actorId })
    .where(and(eq(workOrders.id, id), ne(workOrders.statusCode, WORK_STATUS.CANCELLED)))
    .returning({ id: workOrders.id });
  if (cancelled.length > 0) return;

  const [existing] = await db.select({ id: workOrders.id }).from(workOrders).where(eq(workOrders.id, id)).limit(1);
  throw new RuleError(existing ? "ใบงานนี้ถูกยกเลิกไปแล้ว" : "ไม่พบใบงาน");
}
