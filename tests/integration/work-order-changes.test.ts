import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { customers, drivers, users, vehicles, vehicleTypes, workOrders } from "@/db/schema";
import { seedReferenceData } from "@/db/seed";
import { EMPTY_WORK_ORDER_FILTERS, type WorkOrderFilters } from "@/features/work-orders/filters";
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

// User requests of 2026-11-27: edit (WO-14), delete (ADR-0010 addendum), search + export (WO-16).
let db: TestDb;
let close: () => Promise<void>;
const actor = "maker-1";
const editor = "admin-2";
const ids = { customer: 0, type: 0, vehicle: 0, driver: 0 };
const NOV = new Date("2026-11-27T03:00:00Z");

beforeAll(async () => {
  const testDb = await createTestDb();
  db = testDb.db;
  close = () => testDb.client.close();
  await seedReferenceData(db);
  await db.insert(users).values([
    { id: actor, name: "สมหญิง ผู้ทำใบงาน", email: "maker@users.nppool.invalid" },
    { id: editor, name: "สมศักดิ์ ผู้ดูแล", email: "admin2@users.nppool.invalid" },
  ]);
  const audit = { createdBy: actor, updatedBy: actor };
  [{ id: ids.customer }] = await db
    .insert(customers)
    .values({ name: "บริษัท ทดสอบ จำกัด", address: "1 ถนนทดสอบ", phone: "02-000-0000", taxId: "0105512345678", ...audit })
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

describe("editing (WO-14)", () => {
  it("reads the work order back as form values, in Thai time", async () => {
    const created = await create(form());
    const opened = await service.getWorkOrderForEdit(db, created.id);
    expect(opened?.workOrderNo).toBe(created.workOrderNo);
    expect(opened?.values).toMatchObject({
      customerId: String(ids.customer),
      transportFee: "3500.00",
      receiveAt: { date: "2026-11-26", time: "08:30" },
      deliveryAt: { date: "2026-11-26", time: "15:00" },
      overnightNights: "0",
    });
    expect(opened?.values.vehicles).toEqual(form().vehicles);
    // The form sent back unchanged must pass the same schema.
    expect(() => workOrderSchema.parse(opened!.values)).not.toThrow();
  });

  it("changes fields and lines, keeps the number and records who edited", async () => {
    const created = await create(form());
    const opened = await service.getWorkOrderForEdit(db, created.id);
    const at = new Date("2026-11-27T06:00:00Z");
    const values = form({
      orderedBy: "คุณ ง.",
      transportFee: "4,200.50",
      statusCode: "4",
      vehicles: [
        { ...form().vehicles[0]!, quantity: "12" },
        { ...EMPTY_VEHICLE_LINE, dimensions: "1x1x1 ม." },
      ],
    });
    await expect(
      service.updateWorkOrder(db, editor, created.id, opened!.version, workOrderSchema.parse(values), at),
    ).resolves.toEqual(created);

    const detail = await service.getWorkOrder(db, created.id);
    expect(detail).toMatchObject({
      workOrderNo: created.workOrderNo,
      orderedBy: "คุณ ง.",
      transportFee: "4200.50",
      statusCode: 4,
      createdByName: "สมหญิง ผู้ทำใบงาน",
      updatedByName: "สมศักดิ์ ผู้ดูแล",
    });
    expect(detail?.updatedAt.toISOString()).toBe(at.toISOString());
    expect(detail?.vehicles.map((line) => [line.lineNo, line.quantity, line.dimensions])).toEqual([
      [1, "12.00", null],
      [2, null, "1x1x1 ม."],
    ]);
  });

  it("refuses a form opened before someone else saved", async () => {
    const created = await create(form());
    const opened = await service.getWorkOrderForEdit(db, created.id);
    const first = workOrderSchema.parse(form({ orderedBy: "คนแรก" }));
    await service.updateWorkOrder(db, actor, created.id, opened!.version, first, new Date("2026-11-27T07:00:00Z"));
    const second = workOrderSchema.parse(form({ orderedBy: "คนที่สอง" }));
    await expect(service.updateWorkOrder(db, editor, created.id, opened!.version, second)).rejects.toThrow(
      new RuleError(service.STALE_EDIT_MESSAGE),
    );
    expect((await service.getWorkOrder(db, created.id))?.orderedBy).toBe("คนแรก");
  });

  it("keeps master data already on the work order after it was deactivated, but not for new picks", async () => {
    const created = await create(form());
    await db.update(drivers).set({ isActive: false }).where(eq(drivers.id, ids.driver));
    try {
      const opened = await service.getWorkOrderForEdit(db, created.id);
      const options = await service.getWorkOrderFormOptions(db, opened!.refs);
      expect(options.drivers.map((driver) => driver.name)).toEqual(["สมชาย ขับดี (ปิดใช้งาน)"]);
      await expect(
        service.updateWorkOrder(db, actor, created.id, opened!.version, workOrderSchema.parse(opened!.values)),
      ).resolves.toMatchObject({ id: created.id });
      await expect(create(form())).rejects.toThrow(RuleError);
      expect((await service.getWorkOrderFormOptions(db)).drivers).toEqual([]);
    } finally {
      await db.update(drivers).set({ isActive: true }).where(eq(drivers.id, ids.driver));
    }
  });

  it("does not edit a cancelled work order", async () => {
    const created = await create(form());
    const opened = await service.getWorkOrderForEdit(db, created.id);
    await expect(service.cancelWorkOrder(db, actor, created.id)).resolves.toEqual({ workOrderNo: created.workOrderNo });
    expect(await service.getWorkOrderForEdit(db, created.id)).toBeNull();
    await expect(
      service.updateWorkOrder(db, actor, created.id, opened!.version, workOrderSchema.parse(form())),
    ).rejects.toThrow(new RuleError("ใบงานที่ยกเลิกแล้วแก้ไขไม่ได้"));
  });
});

describe("deleting (ADR-0010 addendum)", () => {
  it("hides work orders everywhere, keeps the rows and never reuses the numbers", async () => {
    const a = await create(form({ orderedBy: "ลบ A" }));
    const b = await create(form({ orderedBy: "ลบ B" }));
    const at = new Date("2026-11-27T08:00:00Z");
    await expect(service.deleteWorkOrders(db, actor, [b.id, a.id], at)).resolves.toEqual({
      workOrderNos: [a.workOrderNo, b.workOrderNo],
    });

    expect(await service.getWorkOrder(db, a.id)).toBeNull();
    expect(await service.getWorkOrderForEdit(db, a.id)).toBeNull();
    expect(await service.wasWorkOrderDeleted(db, a.id)).toBe(true);
    expect(await service.wasWorkOrderDeleted(db, 999_999)).toBe(false);
    const filters = { ...EMPTY_WORK_ORDER_FILTERS, orderedBy: "ลบ" };
    expect((await service.listWorkOrders(db, filters, 1)).rows).toEqual([]);
    expect((await service.exportWorkOrders(db, filters)).orders).toEqual([]);

    const [row] = await db.select().from(workOrders).where(eq(workOrders.id, a.id));
    expect(row).toMatchObject({ deletedBy: actor, orderedBy: "ลบ A" });
    expect(row?.deletedAt?.toISOString()).toBe(at.toISOString());

    await expect(service.cancelWorkOrder(db, actor, a.id)).rejects.toThrow(new RuleError("ไม่พบใบงาน"));
    await expect(service.deleteWorkOrders(db, actor, [a.id])).rejects.toThrow(
      new RuleError("ไม่พบใบงาน อาจถูกลบไปแล้ว"),
    );
    const next = await create(form());
    expect(next.workOrderNo > b.workOrderNo).toBe(true);
  });
});

describe("searching and exporting (WO-16)", () => {
  const search = async (filters: Partial<WorkOrderFilters>) =>
    (await service.listWorkOrders(db, { ...EMPTY_WORK_ORDER_FILTERS, ...filters }, 1)).rows.map((row) => row.orderedBy);

  beforeAll(async () => {
    const audit = { createdBy: actor, updatedBy: actor };
    const [type] = await db
      .insert(vehicleTypes)
      .values({ code: "10ล้อ", name: "สิบล้อ", ...audit })
      .returning({ id: vehicleTypes.id });
    const [truck] = await db
      .insert(vehicles)
      .values({ plateNo: "81-5555", vehicleTypeId: type!.id, ...audit })
      .returning({ id: vehicles.id });
    const [customer] = await db
      .insert(customers)
      .values({ name: "ห้างหุ้นส่วน ค้นหา 100%", address: "2 ถนนทดสอบ", phone: "02-111-1111", taxId: "0105512345679", ...audit })
      .returning({ id: customers.id });
    await create(
      form({
        customerId: String(customer!.id),
        orderedBy: "ค้นหา-1",
        pickupLocation: "ท่าเรือแหลมฉบัง",
        dropoffLocation: "นิคมอุตสาหกรรมตัวอย่าง",
        transportFee: "1500",
        receiveAt: { date: "2026-11-01", time: "00:10" },
        deliveryAt: { date: "2026-11-02", time: "09:00" },
        vehicles: [{ ...EMPTY_VEHICLE_LINE, vehicleTypeId: String(type!.id), vehicleId: String(truck!.id) }],
      }),
    );
    await create(
      form({
        customerId: String(customer!.id),
        orderedBy: "ค้นหา-2",
        pickupLocation: "ลาดกระบัง",
        dropoffLocation: "สุวรรณภูมิ",
        transportFee: "5000",
        receiveAt: { date: "2026-11-30", time: "23:50" },
        deliveryAt: { date: "2026-12-01", time: "01:00" },
      }),
    );
  });

  it("matches text anywhere and literally (% and _ are not wildcards)", async () => {
    expect(await search({ customer: "ค้นหา" })).toEqual(["ค้นหา-2", "ค้นหา-1"]);
    expect(await search({ customer: "100%" })).toHaveLength(2);
    expect(await search({ customer: "1%0" })).toEqual([]);
    expect(await search({ no: "_" })).toEqual([]);
    expect(await search({ orderedBy: "ค้นหา-1" })).toEqual(["ค้นหา-1"]);
    expect(await search({ pickup: "แหลมฉบัง" })).toEqual(["ค้นหา-1"]);
    expect(await search({ customer: "ค้นหา", dropoff: "สุวรรณ" })).toEqual(["ค้นหา-2"]);
  });

  it("finds a vehicle by plate, type name or type code", async () => {
    expect(await search({ vehicle: "81-55" })).toEqual(["ค้นหา-1"]);
    expect(await search({ vehicle: "สิบล้อ" })).toEqual(["ค้นหา-1"]);
    expect(await search({ vehicle: "10ล้อ" })).toEqual(["ค้นหา-1"]);
  });

  it("filters dates by whole days in Thai time, both ends included", async () => {
    const mine = { customer: "ค้นหา" };
    expect(await search({ ...mine, receiveFrom: "2026-11-01", receiveTo: "2026-11-01" })).toEqual(["ค้นหา-1"]);
    expect(await search({ ...mine, receiveFrom: "2026-11-30" })).toEqual(["ค้นหา-2"]);
    expect(await search({ ...mine, receiveTo: "2026-11-29" })).toEqual(["ค้นหา-1"]);
    expect(await search({ ...mine, deliveryFrom: "2026-12-01", deliveryTo: "2026-12-31" })).toEqual(["ค้นหา-2"]);
  });

  it("filters the transport fee by range, and the status", async () => {
    const mine = { customer: "ค้นหา" };
    expect(await search({ ...mine, feeMin: "1000", feeMax: "2000" })).toEqual(["ค้นหา-1"]);
    expect(await search({ ...mine, feeMin: "5000" })).toEqual(["ค้นหา-2"]);
    expect(await search({ ...mine, status: WORK_STATUS.OPEN })).toHaveLength(2);
    expect(await search({ ...mine, status: WORK_STATUS.CANCELLED })).toEqual([]);
  });

  it("exports every field and vehicle of the matching work orders", async () => {
    const mine = { ...EMPTY_WORK_ORDER_FILTERS, customer: "ค้นหา" };
    const { orders, truncated } = await service.exportWorkOrders(db, mine);
    expect(truncated).toBe(false);
    expect(orders.map((order) => order.orderedBy)).toEqual(["ค้นหา-2", "ค้นหา-1"]);
    expect(orders[1]?.vehicles.map((line) => [line.vehicleTypeName, line.plateNo])).toEqual([["สิบล้อ", "81-5555"]]);
    expect(orders[0]).toMatchObject({ customerName: "ห้างหุ้นส่วน ค้นหา 100%", transportFee: "5000.00" });

    const limited = await service.exportWorkOrders(db, mine, 1);
    expect(limited.truncated).toBe(true);
    expect(limited.orders.map((order) => order.orderedBy)).toEqual(["ค้นหา-2"]);
  });
});
