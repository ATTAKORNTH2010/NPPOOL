import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { customers, drivers, routes, users, vehicles, vehicleTypes, workOrders, workOrderVehicles } from "@/db/schema";
import { seedReferenceData } from "@/db/seed";
import {
  EMPTY_VEHICLE_LINE,
  EMPTY_WORK_ORDER,
  workOrderSchema,
  type WorkOrderFormValues,
} from "@/features/work-orders/schemas";
import * as service from "@/features/work-orders/service";
import { WORK_STATUS } from "@/features/work-orders/statuses";
import { RuleError } from "@/lib/action-result";
import { createTestDb, type TestDb } from "./test-db";

// Module 3 · design 02 §3.2–3.4 · WO-01..13.
let db: TestDb;
let close: () => Promise<void>;
const actor = "maker-1";
const ids = { customer: 0, inactiveCustomer: 0, type: 0, vehicle: 0, driver: 0 };
const NOV = new Date("2026-11-27T03:00:00Z");

beforeAll(async () => {
  const testDb = await createTestDb();
  db = testDb.db;
  close = () => testDb.client.close();
  await seedReferenceData(db);
  await db.insert(users).values({ id: actor, name: "สมหญิง ผู้ทำใบงาน", email: "maker@users.nppool.invalid" });
  const audit = { createdBy: actor, updatedBy: actor };
  const base = { address: "1 ถนนทดสอบ", phone: "02-000-0000", taxId: "0105512345678", ...audit };
  [{ id: ids.customer }] = await db.insert(customers).values({ name: "บริษัท ทดสอบ จำกัด", ...base }).returning({ id: customers.id });
  [{ id: ids.inactiveCustomer }] = await db
    .insert(customers)
    .values({ name: "บริษัท ปิดแล้ว จำกัด", isActive: false, ...base })
    .returning({ id: customers.id });
  [{ id: ids.type }] = await db
    .insert(vehicleTypes)
    .values({ code: "6W", name: "6 ล้อ", ...audit })
    .returning({ id: vehicleTypes.id });
  [{ id: ids.vehicle }] = await db
    .insert(vehicles)
    .values({ plateNo: "70-1234", vehicleTypeId: ids.type, ...audit })
    .returning({ id: vehicles.id });
  [{ id: ids.driver }] = await db
    .insert(drivers)
    .values({ firstName: "สมชาย", lastName: "ขับดี", phone: "089-111-2222", ...audit })
    .returning({ id: drivers.id });
  await db.insert(routes).values({ pickupLocation: "คลัง A", dropoffLocation: "โรงงาน B", price: "3500.00", ...audit });
});

afterAll(async () => {
  await close();
});

function form(overrides: Partial<WorkOrderFormValues> = {}): WorkOrderFormValues {
  return {
    ...EMPTY_WORK_ORDER,
    customerId: String(ids.customer),
    orderedBy: "คุณ ข.",
    pickupLocation: "คลัง A",
    dropoffLocation: "โรงงาน B",
    transportFee: "3500",
    receiveAt: { date: "2026-11-26", time: "08:30" },
    deliveryAt: { date: "2026-11-26", time: "15:00" },
    vehicles: [
      {
        ...EMPTY_VEHICLE_LINE,
        vehicleTypeId: String(ids.type),
        vehicleId: String(ids.vehicle),
        driverId: String(ids.driver),
        quantity: "10",
        quantityUnit: "พาเลท",
      },
    ],
    ...overrides,
  };
}

const create = (values: WorkOrderFormValues, now = NOV) =>
  service.createWorkOrder(db, actor, workOrderSchema.parse(values), now);

describe("form options", () => {
  it("offers only active master data and no 'cancelled' status", async () => {
    const options = await service.getWorkOrderFormOptions(db);
    expect(options.customers.map((c) => c.name)).toEqual(["บริษัท ทดสอบ จำกัด"]);
    expect(options.statuses.some((s) => s.code === WORK_STATUS.CANCELLED)).toBe(false);
    expect(options.drivers).toEqual([{ id: ids.driver, name: "สมชาย ขับดี", phone: "089-111-2222" }]);
    expect(options.routePairs).toEqual([{ pickup: "คลัง A", dropoff: "โรงงาน B" }]);
  });
});

describe("creating work orders (WO-01..09)", () => {
  it("numbers the work order and saves header, time and lines together", async () => {
    const created = await create(form({ vehicles: [EMPTY_VEHICLE_LINE, ...form().vehicles] }));
    expect(created.workOrderNo).toBe("NP2569110001");

    const [header] = await db.select().from(workOrders).where(eq(workOrders.id, created.id));
    expect(header).toMatchObject({
      statusCode: WORK_STATUS.OPEN,
      orderedBy: "คุณ ข.",
      transportFee: "3500.00",
      createdBy: actor,
      updatedBy: actor,
      cancelledAt: null,
    });
    expect(header?.receiveAt?.toISOString()).toBe("2026-11-26T01:30:00.000Z");

    const lines = await db.select().from(workOrderVehicles).where(eq(workOrderVehicles.workOrderId, created.id));
    expect(lines).toHaveLength(1); // the empty line was not saved
    expect(lines[0]).toMatchObject({ lineNo: 1, driverPhone: "089-111-2222", quantity: "10.00", quantityUnit: "พาเลท" });
  });

  it("keeps the driver's phone as it was when the work order was saved (BR-WO-08)", async () => {
    const created = await create(form());
    await db.update(drivers).set({ phone: "081-999-9999" }).where(eq(drivers.id, ids.driver));
    const detail = await service.getWorkOrder(db, created.id);
    expect(detail?.vehicles[0]?.driverPhone).toBe("089-111-2222");
    await db.update(drivers).set({ phone: "089-111-2222" }).where(eq(drivers.id, ids.driver));
  });

  it("refuses master data that was deactivated while the form was open", async () => {
    await expect(create(form({ customerId: String(ids.inactiveCustomer) }))).rejects.toThrow(RuleError);
    await db.update(drivers).set({ isActive: false }).where(eq(drivers.id, ids.driver));
    await expect(create(form())).rejects.toThrow(
      new RuleError("มีประเภทรถ พนักงานขับรถ หรือรถที่ถูกปิดใช้งานแล้ว กรุณาเลือกใหม่"),
    );
    await db.update(drivers).set({ isActive: true }).where(eq(drivers.id, ids.driver));
  });

  it("starts a new running number in a new month (Asia/Bangkok)", async () => {
    const created = await create(form(), new Date("2026-11-30T17:30:00Z")); // 1 Dec 00:30 in Bangkok
    expect(created.workOrderNo).toBe("NP2569120001");
  });
});

describe("listing, viewing and cancelling (WO-10, 11, 13)", () => {
  it("lists one row per work order, newest first, with the first vehicle and the count of others", async () => {
    const twoVehicles = await create(
      form({ vehicles: [...form().vehicles, { ...EMPTY_VEHICLE_LINE, dimensions: "2x2x2 ม." }] }),
    );
    const { rows, page, pageCount, total } = await service.listWorkOrders(db, 99);
    expect({ page, pageCount }).toEqual({ page: 1, pageCount: 1 });
    expect(rows).toHaveLength(total);
    expect(rows[0]).toMatchObject({
      id: twoVehicles.id,
      customerName: "บริษัท ทดสอบ จำกัด",
      statusName: "เปิดใบงาน",
      firstVehicle: "6 ล้อ · 70-1234",
      moreVehicles: 1,
    });
  });

  it("shows a work order with names instead of ids", async () => {
    const [latest] = (await service.listWorkOrders(db, 1)).rows;
    const detail = await service.getWorkOrder(db, latest!.id);
    expect(detail).toMatchObject({ createdByName: "สมหญิง ผู้ทำใบงาน", pickupLocation: "คลัง A" });
    expect(detail?.vehicles.map((line) => [line.lineNo, line.driverName, line.plateNo])).toEqual([
      [1, "สมชาย ขับดี", "70-1234"],
      [2, null, null],
    ]);
    expect(await service.getWorkOrder(db, 999_999)).toBeNull();
  });

  it("cancels once, records who and when, and keeps the work order", async () => {
    const [latest] = (await service.listWorkOrders(db, 1)).rows;
    const at = new Date("2026-11-27T05:00:00Z");
    await service.cancelWorkOrder(db, actor, latest!.id, at);

    const detail = await service.getWorkOrder(db, latest!.id);
    expect(detail).toMatchObject({ statusCode: WORK_STATUS.CANCELLED, cancelledByName: "สมหญิง ผู้ทำใบงาน" });
    expect(detail?.cancelledAt?.toISOString()).toBe(at.toISOString());
    await expect(service.cancelWorkOrder(db, actor, latest!.id)).rejects.toThrow(new RuleError("ใบงานนี้ถูกยกเลิกไปแล้ว"));
    await expect(service.cancelWorkOrder(db, actor, 999_999)).rejects.toThrow(new RuleError("ไม่พบใบงาน"));
  });
});
