import { describe, expect, it } from "vitest";
import { customerSchema } from "@/features/customers/schemas";
import { driverSchema } from "@/features/drivers/schemas";
import { FUEL_PRICES, routeDialogSchema, routeRateSchema, routeSchema } from "@/features/routes/schemas";
import { vehicleTypeSchema } from "@/features/vehicle-types/schemas";
import { vehicleSchema } from "@/features/vehicles/schemas";
import { formatTaxId } from "@/lib/format";
import { sortByThai } from "@/lib/thai-sort";

function messages(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? [] : (result.error?.issues.map((issue) => issue.message) ?? []);
}

describe("customer form (BR-MD-01)", () => {
  const valid = { name: "บริษัท ตัวอย่าง จำกัด", address: "99 ถนนตัวอย่าง", phone: "02-000-0000", taxId: "0-1055-12345-67-8" };

  it("stores the tax ID as 13 digits", () => {
    expect(customerSchema.parse(valid).taxId).toBe("0105512345678");
  });

  it("uses the legacy messages for the four required fields", () => {
    const result = customerSchema.safeParse({ name: "", address: " ", phone: "", taxId: "" });
    expect(messages(result)).toEqual([
      "กรุณากรอกชื่อบริษัท",
      "กรุณากรอกที่อยู่",
      "กรุณากรอกเบอร์โทรศัพท์",
      "กรุณากรอกเลขประจำตัวผู้เสียภาษี",
    ]);
  });

  it("rejects a tax ID that is not 13 digits", () => {
    expect(messages(customerSchema.safeParse({ ...valid, taxId: "010551234567" }))).toEqual([
      "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก",
    ]);
  });

  it("formats a stored tax ID for display", () => {
    expect(formatTaxId("0105512345678")).toBe("0-1055-12345-67-8");
    expect(formatTaxId("12345")).toBe("12345");
  });
});

describe("driver form (BR-MD-03)", () => {
  it("requires first and last name, phone is optional", () => {
    expect(driverSchema.safeParse({ firstName: "สมชาย", lastName: "ตัวอย่าง", phone: "" }).success).toBe(true);
    expect(messages(driverSchema.safeParse({ firstName: "", lastName: "", phone: "" }))).toEqual([
      "กรุณากรอกชื่อ",
      "กรุณากรอกนามสกุล",
    ]);
  });
});

describe("vehicle forms (BR-MD-02, MD-05)", () => {
  it("tidies spaces in the plate and requires a type", () => {
    expect(vehicleSchema.parse({ plateNo: "  70-1234   กรุงเทพมหานคร ", vehicleTypeId: "3" })).toEqual({
      plateNo: "70-1234 กรุงเทพมหานคร",
      vehicleTypeId: 3,
    });
    expect(messages(vehicleSchema.safeParse({ plateNo: "  ", vehicleTypeId: "" }))).toEqual([
      "กรุณากรอกเลขทะเบียนรถ",
      "กรุณาเลือกประเภทรถ",
    ]);
  });

  it("upper-cases the type code and checks the display order", () => {
    expect(vehicleTypeSchema.parse({ code: "6w", name: "รถบรรทุก 6 ล้อ", sortOrder: "2" })).toEqual({
      code: "6W",
      name: "รถบรรทุก 6 ล้อ",
      sortOrder: 2,
    });
    expect(messages(vehicleTypeSchema.safeParse({ code: "6@W", name: "x", sortOrder: "-1" }))).toEqual([
      "รหัสใช้ได้เฉพาะตัวอักษรไทยหรืออังกฤษ ตัวเลข ช่องว่าง และ - _ . /",
      "ลำดับต้องเป็นตัวเลข 0–999",
    ]);
  });

  it("accepts Thai type codes (user request 2026-11-27)", () => {
    expect(vehicleTypeSchema.parse({ code: " 6  ล้อ ", name: "รถบรรทุก 6 ล้อ", sortOrder: "1" }).code).toBe("6 ล้อ");
    expect(vehicleTypeSchema.parse({ code: "10ล้อ-พ่วง", name: "รถพ่วง", sortOrder: "3" }).code).toBe("10ล้อ-พ่วง");
  });
});

describe("route form (BR-MD-04, prices by fuel price since 2026-11-28)", () => {
  const valid = {
    pickupLocation: "ลาดกระบัง",
    dropoffLocation: "แหลมฉบัง",
    vehicleTypeId: "3",
    rates: [
      { fuelPrice: "26", price: "3,600" },
      { fuelPrice: "25", price: "3,500.50" },
    ],
  };

  it("offers fuel prices 25 to 50 baht, one baht apart", () => {
    expect(FUEL_PRICES).toHaveLength(26);
    expect([FUEL_PRICES[0], FUEL_PRICES[FUEL_PRICES.length - 1]]).toEqual([25, 50]);
  });

  it("needs a vehicle type and turns the picked values into numbers", () => {
    const parsed = routeSchema.parse(valid);
    expect(parsed.vehicleTypeId).toBe(3);
    expect(parsed.rates).toEqual([
      { fuelPrice: 26, price: "3600" },
      { fuelPrice: 25, price: "3500.50" },
    ]);
    expect(messages(routeSchema.safeParse({ ...valid, vehicleTypeId: "" }))).toEqual(["กรุณาเลือกประเภทรถ"]);
  });

  it("needs at least one price, and each fuel price only once", () => {
    expect(messages(routeSchema.safeParse({ ...valid, rates: [] }))).toEqual(["กรุณาเพิ่มราคาขนส่งอย่างน้อย 1 ราคา"]);
    const twice = [
      { fuelPrice: "25", price: "1" },
      { fuelPrice: "25", price: "2" },
    ];
    expect(messages(routeSchema.safeParse({ ...valid, rates: twice }))).toEqual(["ราคาน้ำมัน 25 บาท มีมากกว่า 1 ราคา"]);
  });

  it("checks each price as before: commas allowed, no negatives, at most two decimals", () => {
    const rate = (price: string) => messages(routeRateSchema.safeParse({ fuelPrice: "30", price }));
    const message = "ราคาต้องเป็นตัวเลขไม่ติดลบ ทศนิยมไม่เกิน 2 ตำแหน่ง";
    expect(routeRateSchema.parse({ fuelPrice: "30", price: "0" }).price).toBe("0");
    expect(rate("-1")).toEqual([message]);
    expect(rate("1.234")).toEqual([message]);
    expect(rate("")).toEqual(["กรุณากรอกราคา"]);
  });

  it("keeps the fuel price within 25–50 baht", () => {
    const fuel = (fuelPrice: string) => messages(routeRateSchema.safeParse({ fuelPrice, price: "1" }));
    expect(fuel("24")).toEqual(["ราคาน้ำมันต้องอยู่ระหว่าง 25–50 บาท"]);
    expect(fuel("51")).toEqual(["ราคาน้ำมันต้องอยู่ระหว่าง 25–50 บาท"]);
    expect(fuel("")).toEqual(["กรุณาเลือกราคาน้ำมัน"]);
  });

  it("does not save while a typed price still waits for +", () => {
    expect(messages(routeDialogSchema.safeParse({ ...valid, draftPrice: "3700" }))).toEqual([
      "กด + เพื่อเพิ่มราคาที่กรอกไว้ หรือลบออกก่อนบันทึก",
    ]);
    expect(routeDialogSchema.safeParse({ ...valid, draftPrice: " " }).success).toBe(true);
  });
});

describe("Thai ordering (BR-MD-06)", () => {
  it("orders by consonant, including words that start with a leading vowel", () => {
    expect(sortByThai(["ค", "ข", "เก", "ก"], (value) => value)).toEqual(["ก", "เก", "ข", "ค"]);
  });
});
