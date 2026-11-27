import { describe, expect, it } from "vitest";
import { customerSchema } from "@/features/customers/schemas";
import { driverSchema } from "@/features/drivers/schemas";
import { routeSchema } from "@/features/routes/schemas";
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
    expect(messages(vehicleTypeSchema.safeParse({ code: "6 ล้อ", name: "x", sortOrder: "-1" }))).toEqual([
      "รหัสใช้ได้เฉพาะ A–Z, 0–9, - และ _",
      "ลำดับต้องเป็นตัวเลข 0–999",
    ]);
  });
});

describe("route form (BR-MD-04)", () => {
  const valid = { pickupLocation: "ลาดกระบัง", dropoffLocation: "แหลมฉบัง", price: "3,500.50" };

  it("accepts commas and keeps two decimals", () => {
    expect(routeSchema.parse(valid).price).toBe("3500.50");
    expect(routeSchema.parse({ ...valid, price: "0" }).price).toBe("0");
  });

  it("rejects negative prices and more than two decimals", () => {
    const message = "ราคาต้องเป็นตัวเลขไม่ติดลบ ทศนิยมไม่เกิน 2 ตำแหน่ง";
    expect(messages(routeSchema.safeParse({ ...valid, price: "-1" }))).toEqual([message]);
    expect(messages(routeSchema.safeParse({ ...valid, price: "1.234" }))).toEqual([message]);
    expect(messages(routeSchema.safeParse({ ...valid, price: "" }))).toEqual(["กรุณากรอกราคา"]);
  });
});

describe("Thai ordering (BR-MD-06)", () => {
  it("orders by consonant, including words that start with a leading vowel", () => {
    expect(sortByThai(["ค", "ข", "เก", "ก"], (value) => value)).toEqual(["ก", "เก", "ข", "ค"]);
  });
});
