import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { routeRates, routes, users, workOrders } from "@/db/schema";
import { seedReferenceData } from "@/db/seed";
import { customerSchema } from "@/features/customers/schemas";
import * as customersService from "@/features/customers/service";
import { driverSchema } from "@/features/drivers/schemas";
import * as driversService from "@/features/drivers/service";
import { routeSchema, type RouteFormValues } from "@/features/routes/schemas";
import * as routesService from "@/features/routes/service";
import { vehicleTypeSchema } from "@/features/vehicle-types/schemas";
import * as vehicleTypesService from "@/features/vehicle-types/service";
import { vehicleSchema } from "@/features/vehicles/schemas";
import * as vehiclesService from "@/features/vehicles/service";
import { RuleError } from "@/lib/action-result";
import { createTestDb, type TestDb } from "./test-db";

// Module 2 · design 02 section 3.6 · MD-01..05, MD-08 (deactivate instead of delete).
let db: TestDb;
let close: () => Promise<void>;
const actor = "admin-1";

beforeAll(async () => {
  const testDb = await createTestDb();
  db = testDb.db;
  close = () => testDb.client.close();
  await seedReferenceData(db);
  await db.insert(users).values({ id: actor, name: "ผู้ดูแล", email: "admin@users.nppool.invalid" });
});

afterAll(async () => {
  await close();
});

const IN_USE = new RuleError("ลบไม่ได้ เพราะมีข้อมูลอื่นใช้รายการนี้อยู่ ให้ปิดใช้งานแทน");

describe("customers", () => {
  it("lists in Thai order, edits without losing fields, and records who changed it", async () => {
    for (const name of ["บริษัท ขนส่ง จำกัด", "บริษัท กขค จำกัด"]) {
      await customersService.createCustomer(
        db,
        actor,
        customerSchema.parse({ name, address: "1 ถนนทดสอบ", phone: "02-111-1111", taxId: "0105512345678" }),
      );
    }
    const list = await customersService.listCustomers(db);
    expect(list.map((row) => row.name)).toEqual(["บริษัท กขค จำกัด", "บริษัท ขนส่ง จำกัด"]);

    const target = list[0]!;
    await customersService.updateCustomer(db, actor, {
      ...customerSchema.parse({ ...target, phone: "02-222-2222" }),
      id: target.id,
    });
    const [updated] = (await customersService.listCustomers(db)).filter((row) => row.id === target.id);
    expect(updated).toMatchObject({ phone: "02-222-2222", address: "1 ถนนทดสอบ", taxId: "0105512345678" });
  });

  it("deactivates a customer used by a work order instead of deleting it", async () => {
    const customer = (await customersService.listCustomers(db))[0]!;
    await db.insert(workOrders).values({
      workOrderNo: "TEST-MD-1",
      customerId: customer.id,
      createdBy: actor,
      updatedBy: actor,
    });

    await expect(customersService.deleteCustomer(db, { id: customer.id })).rejects.toThrow(IN_USE);
    await customersService.setCustomerActive(db, actor, { id: customer.id, active: false });
    const [row] = (await customersService.listCustomers(db)).filter((r) => r.id === customer.id);
    expect(row?.isActive).toBe(false);
  });

  it("deletes a customer nothing refers to", async () => {
    const unused = (await customersService.listCustomers(db))[1]!;
    await customersService.deleteCustomer(db, { id: unused.id });
    expect((await customersService.listCustomers(db)).some((row) => row.id === unused.id)).toBe(false);
    await expect(customersService.deleteCustomer(db, { id: unused.id })).rejects.toThrow(RuleError);
  });
});

describe("vehicle types and vehicles", () => {
  it("keeps type codes unique and lists by display order", async () => {
    await vehicleTypesService.createVehicleType(db, actor, vehicleTypeSchema.parse({ code: "10w", name: "รถ 10 ล้อ", sortOrder: "3" }));
    await vehicleTypesService.createVehicleType(db, actor, vehicleTypeSchema.parse({ code: "4w", name: "รถกระบะ 4 ล้อ", sortOrder: "1" }));
    await expect(
      vehicleTypesService.createVehicleType(db, actor, vehicleTypeSchema.parse({ code: "4W", name: "ซ้ำ", sortOrder: "0" })),
    ).rejects.toThrow(new RuleError("รหัสประเภทรถนี้มีอยู่แล้ว"));
    expect((await vehicleTypesService.listVehicleTypes(db)).map((row) => row.code)).toEqual(["4W", "10W"]);
  });

  it("keeps plates unique after tidying spaces", async () => {
    const [pickup] = await vehicleTypesService.listVehicleTypes(db);
    await vehiclesService.createVehicle(db, actor, vehicleSchema.parse({ plateNo: "70-1234 ชลบุรี", vehicleTypeId: String(pickup!.id) }));
    await expect(
      vehiclesService.createVehicle(db, actor, vehicleSchema.parse({ plateNo: " 70-1234   ชลบุรี ", vehicleTypeId: String(pickup!.id) })),
    ).rejects.toThrow(new RuleError("ทะเบียนนี้มีอยู่แล้ว"));
    const [vehicle] = await vehiclesService.listVehicles(db);
    expect(vehicle).toMatchObject({ plateNo: "70-1234 ชลบุรี", vehicleTypeName: "รถกระบะ 4 ล้อ" });
  });

  it("only offers active types, but a vehicle may keep a type deactivated later", async () => {
    const [pickup, tenWheel] = await vehicleTypesService.listVehicleTypes(db);
    const [vehicle] = await vehiclesService.listVehicles(db);
    await vehicleTypesService.setVehicleTypeActive(db, actor, { id: pickup!.id, active: false });

    await expect(
      vehiclesService.createVehicle(db, actor, vehicleSchema.parse({ plateNo: "80-0001", vehicleTypeId: String(pickup!.id) })),
    ).rejects.toThrow(new RuleError("กรุณาเลือกประเภทรถที่ใช้งานอยู่"));
    await vehiclesService.updateVehicle(db, actor, {
      ...vehicleSchema.parse({ plateNo: "70-1234 ชลบุรี", vehicleTypeId: String(pickup!.id) }),
      id: vehicle!.id,
    });
    await vehiclesService.updateVehicle(db, actor, {
      ...vehicleSchema.parse({ plateNo: "70-1234 ชลบุรี", vehicleTypeId: String(tenWheel!.id) }),
      id: vehicle!.id,
    });
    await expect(
      vehiclesService.updateVehicle(db, actor, {
        ...vehicleSchema.parse({ plateNo: "70-1234 ชลบุรี", vehicleTypeId: String(pickup!.id) }),
        id: vehicle!.id,
      }),
    ).rejects.toThrow(RuleError);
  });

  it("does not delete a type that a vehicle uses", async () => {
    const tenWheel = (await vehicleTypesService.listVehicleTypes(db)).find((row) => row.code === "10W")!;
    await expect(vehicleTypesService.deleteVehicleType(db, { id: tenWheel.id })).rejects.toThrow(IN_USE);
  });
});

describe("drivers", () => {
  it("stores an empty phone as null and lists by first then last name", async () => {
    await driversService.createDriver(db, actor, driverSchema.parse({ firstName: "สมศักดิ์", lastName: "ขยัน", phone: "" }));
    await driversService.createDriver(db, actor, driverSchema.parse({ firstName: "สมชาย", lastName: "ตั้งใจ", phone: "089-000-0000" }));
    const list = await driversService.listDrivers(db);
    expect(list.map((row) => `${row.firstName} ${row.lastName}`)).toEqual(["สมชาย ตั้งใจ", "สมศักดิ์ ขยัน"]);
    expect(list[1]?.phone).toBeNull();
  });
});

describe("routes (vehicle type and prices by fuel price, 2026-11-28)", () => {
  const typeId = async (code: string) =>
    String((await vehicleTypesService.listVehicleTypes(db)).find((row) => row.code === code)!.id);
  const route = (values: Partial<RouteFormValues>) =>
    routeSchema.parse({
      pickupLocation: "ลาดกระบัง",
      dropoffLocation: "แหลมฉบัง",
      vehicleTypeId: "",
      rates: [
        { fuelPrice: "26", price: "3,600" },
        { fuelPrice: "25", price: "3,500.50" },
      ],
      ...values,
    });

  it("saves the vehicle type with the prices: newest route first, lowest fuel price first", async () => {
    const tenWheel = await typeId("10W");
    const saved = await routesService.createRoute(db, actor, route({ vehicleTypeId: tenWheel }));
    expect(saved.vehicleTypeName).toBe("รถ 10 ล้อ");
    await routesService.createRoute(
      db,
      actor,
      route({ pickupLocation: "บางนา", dropoffLocation: "ระยอง", vehicleTypeId: tenWheel, rates: [{ fuelPrice: "30", price: "4200" }] }),
    );
    const list = await routesService.listRoutes(db);
    expect(list.map((row) => [row.pickupLocation, row.vehicleTypeName, row.legacyPrice, row.rates])).toEqual([
      ["บางนา", "รถ 10 ล้อ", null, [{ fuelPrice: 30, price: "4200.00" }]],
      [
        "ลาดกระบัง",
        "รถ 10 ล้อ",
        null,
        [
          { fuelPrice: 25, price: "3500.50" },
          { fuelPrice: 26, price: "3600.00" },
        ],
      ],
    ]);
  });

  it("refuses a deactivated vehicle type for a new route", async () => {
    await expect(routesService.createRoute(db, actor, route({ vehicleTypeId: await typeId("4W") }))).rejects.toThrow(
      new RuleError("กรุณาเลือกประเภทรถที่ใช้งานอยู่"),
    );
  });

  it("turns an old single-price route into the new kind and replaces the whole price list on save", async () => {
    // Saved before 2026-11-28: one price, no vehicle type, no prices by fuel price.
    const [old] = await db
      .insert(routes)
      .values({ pickupLocation: "คลัง A", dropoffLocation: "โรงงาน B", price: "3000.00", createdBy: actor, updatedBy: actor })
      .returning({ id: routes.id });
    const find = async () => (await routesService.listRoutes(db)).find((row) => row.id === old!.id);
    expect(await find()).toMatchObject({ vehicleTypeId: null, vehicleTypeName: null, legacyPrice: "3000.00", rates: [] });

    const tenWheel = await typeId("10W");
    const edit = (rates: { fuelPrice: string; price: string }[]) =>
      routesService.updateRoute(db, actor, {
        ...route({ pickupLocation: "คลัง A", dropoffLocation: "โรงงาน B", vehicleTypeId: tenWheel, rates }),
        id: old!.id,
      });
    await edit([
      { fuelPrice: "40", price: "3000" },
      { fuelPrice: "41", price: "3100" },
    ]);
    expect(await find()).toMatchObject({ vehicleTypeName: "รถ 10 ล้อ", legacyPrice: null, rates: [{ fuelPrice: 40 }, { fuelPrice: 41 }] });

    await edit([{ fuelPrice: "41", price: "3150" }]);
    expect((await find())?.rates).toEqual([{ fuelPrice: 41, price: "3150.00" }]);
    expect((await db.select().from(routeRates).where(eq(routeRates.routeId, old!.id))).length).toBe(1);
  });

  it("lets a route keep a vehicle type deactivated later, and that type cannot be deleted", async () => {
    await vehicleTypesService.createVehicleType(db, actor, vehicleTypeSchema.parse({ code: "6w", name: "รถ 6 ล้อ", sortOrder: "2" }));
    const sixWheel = await typeId("6W");
    const saved = await routesService.createRoute(db, actor, route({ pickupLocation: "สระบุรี", vehicleTypeId: sixWheel }));
    await vehicleTypesService.setVehicleTypeActive(db, actor, { id: Number(sixWheel), active: false });

    await routesService.updateRoute(db, actor, { ...route({ pickupLocation: "สระบุรี", vehicleTypeId: sixWheel }), id: saved.id });
    await expect(
      routesService.updateRoute(db, actor, { ...route({ pickupLocation: "สระบุรี", vehicleTypeId: await typeId("4W") }), id: saved.id }),
    ).rejects.toThrow(RuleError);
    await expect(vehicleTypesService.deleteVehicleType(db, { id: Number(sixWheel) })).rejects.toThrow(IN_USE);
  });

  it("deletes a route together with its prices", async () => {
    const [newest] = await routesService.listRoutes(db);
    await routesService.deleteRoute(db, { id: newest!.id });
    expect((await routesService.listRoutes(db)).some((row) => row.id === newest!.id)).toBe(false);
    expect(await db.select().from(routeRates).where(eq(routeRates.routeId, newest!.id))).toEqual([]);
  });

  it("records the editor on every change", async () => {
    const [route] = await routesService.listRoutes(db);
    await routesService.setRouteActive(db, actor, { id: route!.id, active: false });
    const [row] = await db.select().from(routes).where(eq(routes.id, route!.id));
    expect(row).toMatchObject({ isActive: false, updatedBy: actor, createdBy: actor });
  });
});
