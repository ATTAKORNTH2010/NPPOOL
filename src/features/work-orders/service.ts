/**
 * Work orders: create, edit, search, view, cancel, delete (hidden) and the
 * rows for the Excel export. No Next.js imports, so integration tests run it
 * on PGlite.
 */
import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lt, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  customers,
  drivers,
  routeRates,
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
import { bangkokDayEnd, bangkokDayStart, toBangkokParts } from "@/lib/date-range";
import { sortByThai } from "@/lib/thai-sort";
import type { WorkOrderFilters } from "./filters";
import { allocateWorkOrderNo } from "./numbering";
import {
  bangkokDateTime,
  CREATABLE_STATUS_CODES,
  EMPTY_VEHICLE_LINE,
  type WorkOrderFormValues,
  type WorkOrderInput,
} from "./schemas";
import { WORK_STATUS } from "./statuses";

export const WORK_ORDERS_PAGE_SIZE = 50;
/** One export at most; past this the user narrows the search. */
export const WORK_ORDERS_EXPORT_LIMIT = 10_000;

/** Deleted work orders are hidden everywhere (ADR-0010 addendum). */
const notDeleted = isNull(workOrders.deletedAt);

// ---------------------------------------------------------------- form options

export type RoutePair = { pickup: string; dropoff: string; prices: string[] };

/** One pair per pickup → drop-off, whatever the vehicle type; prices come from the rates, else the old price. */
function toRoutePairs(
  rows: { pickup: string; dropoff: string; legacyPrice: string | null; ratePrice: string | null }[],
): RoutePair[] {
  const pairs = new Map<string, { pickup: string; dropoff: string; prices: Set<string> }>();
  for (const row of rows) {
    const key = JSON.stringify([row.pickup, row.dropoff]);
    const pair = pairs.get(key) ?? { pickup: row.pickup, dropoff: row.dropoff, prices: new Set<string>() };
    const price = row.ratePrice ?? row.legacyPrice;
    if (price !== null) pair.prices.add(price);
    pairs.set(key, pair);
  }
  // numeric(14,2) strings: compared as numbers for the order only.
  return [...pairs.values()].map(({ prices, ...pair }) => ({
    ...pair,
    prices: [...prices].sort((a, b) => Number(a) - Number(b)),
  }));
}

export type WorkOrderFormOptions = {
  customers: { id: number; name: string }[];
  statuses: { code: number; name: string }[];
  /**
   * Active pickup → drop-off pairs (BR-WO-05, WO-18) with every transport
   * price they can have: one per fuel price and vehicle type since
   * 2026-11-28, or a route's old single price. Lowest first, no repeats.
   */
  routePairs: RoutePair[];
  vehicleTypes: { id: number; name: string }[];
  drivers: { id: number; name: string; phone: string | null }[];
  vehicles: { id: number; plateNo: string; vehicleTypeId: number }[];
};

/** Master data already on a work order: still selectable when editing it, even if deactivated since. */
export type WorkOrderRefs = {
  customerIds: number[];
  vehicleTypeIds: number[];
  driverIds: number[];
  vehicleIds: number[];
};

const NO_REFS: WorkOrderRefs = { customerIds: [], vehicleTypeIds: [], driverIds: [], vehicleIds: [] };
const INACTIVE_SUFFIX = " (ปิดใช้งาน)";

type MasterTable = typeof customers | typeof vehicleTypes | typeof drivers | typeof vehicles;

function activeOrKept(table: MasterTable, keep: number[]): SQL | undefined {
  return keep.length > 0 ? or(eq(table.isActive, true), inArray(table.id, keep)) : eq(table.isActive, true);
}

const label = (name: string, isActive: boolean) => (isActive ? name : `${name}${INACTIVE_SUFFIX}`);

/** Active master data for a new work order (MD-08, BR-MD-06), plus `keep` when editing. */
export async function getWorkOrderFormOptions(
  db: AppDatabase,
  keep: WorkOrderRefs = NO_REFS,
): Promise<WorkOrderFormOptions> {
  const [customerRows, statusRows, routeRows, typeRows, driverRows, vehicleRows] = await Promise.all([
    db
      .select({ id: customers.id, name: customers.name, isActive: customers.isActive })
      .from(customers)
      .where(activeOrKept(customers, keep.customerIds)),
    db
      .select({ code: workStatuses.code, name: workStatuses.name })
      .from(workStatuses)
      .where(ne(workStatuses.code, WORK_STATUS.CANCELLED))
      .orderBy(asc(workStatuses.sortOrder)),
    db
      .select({
        pickup: routes.pickupLocation,
        dropoff: routes.dropoffLocation,
        legacyPrice: routes.price,
        ratePrice: routeRates.price,
      })
      .from(routes)
      .leftJoin(routeRates, eq(routeRates.routeId, routes.id))
      .where(eq(routes.isActive, true)),
    db
      .select({
        id: vehicleTypes.id,
        name: vehicleTypes.name,
        sortOrder: vehicleTypes.sortOrder,
        isActive: vehicleTypes.isActive,
      })
      .from(vehicleTypes)
      .where(activeOrKept(vehicleTypes, keep.vehicleTypeIds)),
    db
      .select({
        id: drivers.id,
        firstName: drivers.firstName,
        lastName: drivers.lastName,
        phone: drivers.phone,
        isActive: drivers.isActive,
      })
      .from(drivers)
      .where(activeOrKept(drivers, keep.driverIds)),
    db
      .select({
        id: vehicles.id,
        plateNo: vehicles.plateNo,
        vehicleTypeId: vehicles.vehicleTypeId,
        isActive: vehicles.isActive,
      })
      .from(vehicles)
      .where(activeOrKept(vehicles, keep.vehicleIds)),
  ]);

  return {
    customers: sortByThai(
      customerRows.map((row) => ({ id: row.id, name: label(row.name, row.isActive) })),
      (row) => row.name,
    ),
    statuses: statusRows,
    routePairs: sortByThai(
      toRoutePairs(routeRows),
      (row) => row.pickup,
      (row) => row.dropoff,
    ),
    vehicleTypes: [...typeRows]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "th"))
      .map((row) => ({ id: row.id, name: label(row.name, row.isActive) })),
    drivers: sortByThai(
      driverRows.map((row) => ({
        id: row.id,
        name: label(`${row.firstName} ${row.lastName}`, row.isActive),
        phone: row.phone,
      })),
      (row) => row.name,
    ),
    vehicles: sortByThai(
      vehicleRows.map((row) => ({ id: row.id, plateNo: label(row.plateNo, row.isActive), vehicleTypeId: row.vehicleTypeId })),
      (row) => row.plateNo,
    ),
  };
}

/** Every status, “ยกเลิก” included: for the search filter. */
export async function listWorkStatuses(db: AppDatabase): Promise<{ code: number; name: string }[]> {
  return db
    .select({ code: workStatuses.code, name: workStatuses.name })
    .from(workStatuses)
    .orderBy(asc(workStatuses.sortOrder), asc(workStatuses.code));
}

// --------------------------------------------------------------- create / edit

async function activeIds(tx: DbOrTx, table: MasterTable, ids: number[]): Promise<Set<number>> {
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
 * Picked lists can go stale while the form is open, so references are checked
 * again: each must be active, or (when editing) already on the work order.
 */
async function assertUsableReferences(tx: DbOrTx, input: WorkOrderInput, keep: WorkOrderRefs) {
  const fresh = (ids: number[], kept: number[]) => ids.filter((id) => !kept.includes(id));

  const customerIds = fresh([input.customerId], keep.customerIds);
  if (customerIds.length > 0 && (await activeIds(tx, customers, customerIds)).size === 0) {
    throw new RuleError("ผู้ว่าจ้างที่เลือกถูกปิดใช้งานหรือไม่มีอยู่แล้ว กรุณาเลือกใหม่");
  }
  const typeIds = fresh(distinct(input.vehicles.map((line) => line.vehicleTypeId)), keep.vehicleTypeIds);
  const driverIds = fresh(distinct(input.vehicles.map((line) => line.driverId)), keep.driverIds);
  const vehicleIds = fresh(distinct(input.vehicles.map((line) => line.vehicleId)), keep.vehicleIds);
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
}

/** The driver's phone is copied from the driver record when the work order is saved (BR-WO-08). */
async function driverPhones(tx: DbOrTx, input: WorkOrderInput): Promise<Map<number, string | null>> {
  const ids = distinct(input.vehicles.map((line) => line.driverId));
  if (ids.length === 0) return new Map();
  const rows = await tx.select({ id: drivers.id, phone: drivers.phone }).from(drivers).where(inArray(drivers.id, ids));
  return new Map(rows.map((row) => [row.id, row.phone]));
}

function headerValues(input: WorkOrderInput) {
  return {
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
  };
}

async function insertLines(tx: DbOrTx, workOrderId: number, input: WorkOrderInput) {
  const phones = await driverPhones(tx, input);
  await tx.insert(workOrderVehicles).values(
    input.vehicles.map((line, index) => ({
      workOrderId,
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
    await assertUsableReferences(tx, input, NO_REFS);
    const workOrderNo = await allocateWorkOrderNo(tx, now);
    const [created] = await tx
      .insert(workOrders)
      .values({ workOrderNo, ...headerValues(input), createdBy: actorId, updatedBy: actorId })
      .returning({ id: workOrders.id });
    if (!created) throw new Error("work order insert returned no row");
    await insertLines(tx, created.id, input);
    return { id: created.id, workOrderNo };
  });
}

export const STALE_EDIT_MESSAGE =
  "ใบงานนี้ถูกแก้ไขโดยผู้ใช้อื่นหลังจากที่คุณเปิดหน้านี้ กรุณาเปิดหน้าแก้ไขใหม่แล้วแก้อีกครั้ง";

/**
 * WO-14 (user request 2026-11-27): Maker/Admin edit any field of a work order
 * that is not cancelled; the number never changes. `version` is the
 * updated_at the form was opened with, so two people cannot overwrite each
 * other without noticing. Vehicle lines are replaced as a set and the
 * driver's phone is copied again from the driver record.
 */
export async function updateWorkOrder(
  db: AppDatabase,
  actorId: string,
  id: number,
  version: string,
  input: WorkOrderInput,
  now: Date = new Date(),
): Promise<{ id: number; workOrderNo: string }> {
  if (!CREATABLE_STATUS_CODES.includes(input.statusCode)) throw new RuleError("สถานะงานไม่ถูกต้อง");

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        workOrderNo: workOrders.workOrderNo,
        statusCode: workOrders.statusCode,
        customerId: workOrders.customerId,
        updatedAt: workOrders.updatedAt,
      })
      .from(workOrders)
      .where(and(eq(workOrders.id, id), notDeleted))
      .limit(1)
      .for("update");
    if (!current) throw new RuleError("ไม่พบใบงาน อาจถูกลบไปแล้ว");
    if (current.statusCode === WORK_STATUS.CANCELLED) throw new RuleError("ใบงานที่ยกเลิกแล้วแก้ไขไม่ได้");
    if (current.updatedAt.toISOString() !== version) throw new RuleError(STALE_EDIT_MESSAGE);

    const oldLines = await tx
      .select({
        vehicleTypeId: workOrderVehicles.vehicleTypeId,
        driverId: workOrderVehicles.driverId,
        vehicleId: workOrderVehicles.vehicleId,
      })
      .from(workOrderVehicles)
      .where(eq(workOrderVehicles.workOrderId, id));
    await assertUsableReferences(tx, input, {
      customerIds: [current.customerId],
      vehicleTypeIds: distinct(oldLines.map((line) => line.vehicleTypeId)),
      driverIds: distinct(oldLines.map((line) => line.driverId)),
      vehicleIds: distinct(oldLines.map((line) => line.vehicleId)),
    });

    await tx
      .update(workOrders)
      .set({ ...headerValues(input), updatedBy: actorId, updatedAt: now })
      .where(eq(workOrders.id, id));
    await tx.delete(workOrderVehicles).where(eq(workOrderVehicles.workOrderId, id));
    await insertLines(tx, id, input);
    return { id, workOrderNo: current.workOrderNo };
  });
}

// ------------------------------------------------------------------------ edit

export type WorkOrderEditData = {
  id: number;
  workOrderNo: string;
  /** updated_at as ISO text: the optimistic-lock version sent back on save. */
  version: string;
  values: WorkOrderFormValues;
  refs: WorkOrderRefs;
};

/** "8.00" → "8", "2.50" → "2.5": quantities read back the way people type them. */
function trimDecimal(value: string | null): string {
  if (value === null) return "";
  return value.includes(".") ? value.replace(/\.?0+$/, "") : value;
}

const dateTimeValue = (value: Date | null) => (value ? toBangkokParts(value) : { date: "", time: "" });

/** Form values of a work order that can still be edited; null when missing, deleted or cancelled. */
export async function getWorkOrderForEdit(db: AppDatabase, id: number): Promise<WorkOrderEditData | null> {
  const [row] = await db
    .select()
    .from(workOrders)
    .where(and(eq(workOrders.id, id), notDeleted, ne(workOrders.statusCode, WORK_STATUS.CANCELLED)))
    .limit(1);
  if (!row) return null;

  const lines = await db
    .select()
    .from(workOrderVehicles)
    .where(eq(workOrderVehicles.workOrderId, id))
    .orderBy(asc(workOrderVehicles.lineNo));
  const id2s = (value: number | null) => (value === null ? "" : String(value));

  return {
    id: row.id,
    workOrderNo: row.workOrderNo,
    version: row.updatedAt.toISOString(),
    refs: {
      customerIds: [row.customerId],
      vehicleTypeIds: distinct(lines.map((line) => line.vehicleTypeId)),
      driverIds: distinct(lines.map((line) => line.driverId)),
      vehicleIds: distinct(lines.map((line) => line.vehicleId)),
    },
    values: {
      customerId: String(row.customerId),
      statusCode: String(row.statusCode),
      orderedBy: row.orderedBy ?? "",
      pickupLocation: row.pickupLocation ?? "",
      pickupContactName: row.pickupContactName ?? "",
      pickupContactPhone: row.pickupContactPhone ?? "",
      dropoffLocation: row.dropoffLocation ?? "",
      dropoffContactName: row.dropoffContactName ?? "",
      dropoffContactPhone: row.dropoffContactPhone ?? "",
      transportFee: row.transportFee ?? "",
      vehicles:
        lines.length === 0
          ? [EMPTY_VEHICLE_LINE]
          : lines.map((line) => ({
              vehicleTypeId: id2s(line.vehicleTypeId),
              driverId: id2s(line.driverId),
              vehicleId: id2s(line.vehicleId),
              quantity: trimDecimal(line.quantity),
              quantityUnit: line.quantityUnit ?? "",
              weight: trimDecimal(line.weight),
              weightUnit: line.weightUnit ?? "",
              dimensions: line.dimensions ?? "",
            })),
      receiveAt: dateTimeValue(row.receiveAt),
      deliveryAt: dateTimeValue(row.deliveryAt),
      customerJobNo: row.customerJobNo ?? "",
      remark: row.remark ?? "",
      portFee: row.portFee ?? "",
      demurrageFee: row.demurrageFee ?? "",
      overnightNights: String(row.overnightNights),
      overnightLaborFee: row.overnightLaborFee ?? "",
      extraWorkers: String(row.extraWorkers),
      extraWorkerFee: row.extraWorkerFee ?? "",
    },
  };
}

// ---------------------------------------------------------------------- search

/** Text typed by the user, matched anywhere and literally (% and _ are not wildcards). */
function contains(value: string): string {
  return `%${value.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

function dayRange(
  column: typeof workOrders.receiveAt | typeof workOrders.deliveryAt,
  from: string | null,
  to: string | null,
): SQL[] {
  const conditions: SQL[] = [];
  if (from) conditions.push(gte(column, bangkokDayStart(from)));
  if (to) conditions.push(lt(column, bangkokDayEnd(to)));
  return conditions;
}

/** WHERE for the list and the export. Needs `customers` joined. */
function searchConditions(filters: WorkOrderFilters): SQL | undefined {
  const conditions: SQL[] = [notDeleted];
  if (filters.no) conditions.push(ilike(workOrders.workOrderNo, contains(filters.no)));
  if (filters.status !== null) conditions.push(eq(workOrders.statusCode, filters.status));
  if (filters.customer) conditions.push(ilike(customers.name, contains(filters.customer)));
  if (filters.orderedBy) conditions.push(ilike(workOrders.orderedBy, contains(filters.orderedBy)));
  if (filters.pickup) conditions.push(ilike(workOrders.pickupLocation, contains(filters.pickup)));
  if (filters.dropoff) conditions.push(ilike(workOrders.dropoffLocation, contains(filters.dropoff)));
  if (filters.vehicle) {
    const pattern = contains(filters.vehicle);
    conditions.push(sql`exists (
      select 1 from ${workOrderVehicles}
      left join ${vehicles} on ${vehicles.id} = ${workOrderVehicles.vehicleId}
      left join ${vehicleTypes} on ${vehicleTypes.id} = ${workOrderVehicles.vehicleTypeId}
      where ${workOrderVehicles.workOrderId} = ${workOrders.id}
        and (${vehicles.plateNo} ilike ${pattern} or ${vehicleTypes.name} ilike ${pattern} or ${vehicleTypes.code} ilike ${pattern})
    )`);
  }
  conditions.push(...dayRange(workOrders.receiveAt, filters.receiveFrom, filters.receiveTo));
  conditions.push(...dayRange(workOrders.deliveryAt, filters.deliveryFrom, filters.deliveryTo));
  if (filters.feeMin !== null) conditions.push(gte(workOrders.transportFee, filters.feeMin));
  if (filters.feeMax !== null) conditions.push(lte(workOrders.transportFee, filters.feeMax));
  return and(...conditions);
}

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
  filters: WorkOrderFilters,
  requestedPage: number,
): Promise<{ rows: WorkOrderListItem[]; page: number; pageCount: number; total: number }> {
  const where = searchConditions(filters);
  const [totalRow] = await db
    .select({ total: count() })
    .from(workOrders)
    .innerJoin(customers, eq(workOrders.customerId, customers.id))
    .where(where);
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
    .where(where)
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
    const text = [line.typeName, line.plateNo].filter(Boolean).join(" · ");
    byOrder.set(line.workOrderId, { first: text || null, total: 1 });
  }

  const rows = headers.map((row) => {
    const summary = byOrder.get(row.id);
    return { ...row, firstVehicle: summary?.first ?? null, moreVehicles: summary ? summary.total - 1 : 0 };
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
  updatedAt: Date;
  updatedByName: string | null;
  cancelledAt: Date | null;
  cancelledByName: string | null;
  vehicles: WorkOrderVehicleLine[];
};

const creator = alias(users, "creator");
const updater = alias(users, "updater");
const canceller = alias(users, "canceller");

const detailColumns = {
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
  updatedAt: workOrders.updatedAt,
  updatedByName: updater.name,
  cancelledAt: workOrders.cancelledAt,
  cancelledByName: canceller.name,
};

function detailQuery(db: AppDatabase) {
  return db
    .select(detailColumns)
    .from(workOrders)
    .innerJoin(customers, eq(workOrders.customerId, customers.id))
    .innerJoin(workStatuses, eq(workOrders.statusCode, workStatuses.code))
    .leftJoin(creator, eq(workOrders.createdBy, creator.id))
    .leftJoin(updater, eq(workOrders.updatedBy, updater.id))
    .leftJoin(canceller, eq(workOrders.cancelledBy, canceller.id));
}

/** Vehicle lines of many work orders, in line order, grouped by work order id. */
async function vehicleLines(db: AppDatabase, ids: number[]): Promise<Map<number, WorkOrderVehicleLine[]>> {
  const byOrder = new Map<number, WorkOrderVehicleLine[]>();
  // Chunked: Postgres allows at most 65,535 bind parameters per statement.
  for (let start = 0; start < ids.length; start += 5_000) {
    const chunk = ids.slice(start, start + 5_000);
    const rows = await db
      .select({
        workOrderId: workOrderVehicles.workOrderId,
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
      .where(inArray(workOrderVehicles.workOrderId, chunk))
      .orderBy(asc(workOrderVehicles.workOrderId), asc(workOrderVehicles.lineNo));
    for (const { workOrderId, driverFirstName, driverLastName, ...line } of rows) {
      const list = byOrder.get(workOrderId) ?? [];
      list.push({
        ...line,
        driverName: driverFirstName ? `${driverFirstName} ${driverLastName ?? ""}`.trim() : null,
      });
      byOrder.set(workOrderId, list);
    }
  }
  return byOrder;
}

/** The work order existed but was deleted: pages say so instead of “not found”. */
export async function wasWorkOrderDeleted(db: AppDatabase, id: number): Promise<boolean> {
  const [row] = await db
    .select({ deletedAt: workOrders.deletedAt })
    .from(workOrders)
    .where(eq(workOrders.id, id))
    .limit(1);
  return Boolean(row?.deletedAt);
}

/** Null when the work order does not exist or was deleted. */
export async function getWorkOrder(db: AppDatabase, id: number): Promise<WorkOrderDetail | null> {
  const [header] = await detailQuery(db)
    .where(and(eq(workOrders.id, id), notDeleted))
    .limit(1);
  if (!header) return null;
  const lines = await vehicleLines(db, [id]);
  return { ...header, vehicles: lines.get(id) ?? [] };
}

/**
 * Excel export (user request 2026-11-27): every field of every work order
 * matching the search, newest first, at most WORK_ORDERS_EXPORT_LIMIT.
 */
export async function exportWorkOrders(
  db: AppDatabase,
  filters: WorkOrderFilters,
  limit: number = WORK_ORDERS_EXPORT_LIMIT,
): Promise<{ orders: WorkOrderDetail[]; truncated: boolean }> {
  const headers = await detailQuery(db)
    .where(searchConditions(filters))
    .orderBy(desc(workOrders.id))
    .limit(limit + 1);
  const truncated = headers.length > limit;
  const kept = truncated ? headers.slice(0, limit) : headers;
  const lines = await vehicleLines(
    db,
    kept.map((row) => row.id),
  );
  return { orders: kept.map((row) => ({ ...row, vehicles: lines.get(row.id) ?? [] })), truncated };
}

// --------------------------------------------------------------- cancel/delete

/** Cancel = status 2 + who and when; nothing is deleted (ADR-0010, WO-13). */
export async function cancelWorkOrder(
  db: AppDatabase,
  actorId: string,
  id: number,
  now: Date = new Date(),
): Promise<{ workOrderNo: string }> {
  const [cancelled] = await db
    .update(workOrders)
    .set({ statusCode: WORK_STATUS.CANCELLED, cancelledAt: now, cancelledBy: actorId, updatedBy: actorId, updatedAt: now })
    .where(and(eq(workOrders.id, id), notDeleted, ne(workOrders.statusCode, WORK_STATUS.CANCELLED)))
    .returning({ workOrderNo: workOrders.workOrderNo });
  if (cancelled) return cancelled;

  const [existing] = await db
    .select({ id: workOrders.id })
    .from(workOrders)
    .where(and(eq(workOrders.id, id), notDeleted))
    .limit(1);
  throw new RuleError(existing ? "ใบงานนี้ถูกยกเลิกไปแล้ว" : "ไม่พบใบงาน");
}

/**
 * “ลบใบงาน” (user request 2026-11-27): hidden from every screen, the export
 * and printing, but kept in the database with who and when (ADR-0010
 * addendum). Numbers are never reused. Returns the numbers that were deleted.
 */
export async function deleteWorkOrders(
  db: AppDatabase,
  actorId: string,
  ids: number[],
  now: Date = new Date(),
): Promise<{ workOrderNos: string[] }> {
  const deleted = await db
    .update(workOrders)
    .set({ deletedAt: now, deletedBy: actorId, updatedBy: actorId, updatedAt: now })
    .where(and(inArray(workOrders.id, ids), notDeleted))
    .returning({ workOrderNo: workOrders.workOrderNo });
  if (deleted.length === 0) {
    throw new RuleError(ids.length === 1 ? "ไม่พบใบงาน อาจถูกลบไปแล้ว" : "ไม่พบใบงานที่เลือก อาจถูกลบไปแล้ว");
  }
  return { workOrderNos: deleted.map((row) => row.workOrderNo).sort() };
}
