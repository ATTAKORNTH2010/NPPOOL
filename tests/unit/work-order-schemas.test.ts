import { describe, expect, it } from "vitest";
import {
  bangkokDateTime,
  EMPTY_VEHICLE_LINE,
  EMPTY_WORK_ORDER,
  workOrderSchema,
  type WorkOrderFormValues,
} from "@/features/work-orders/schemas";

const valid: WorkOrderFormValues = {
  ...EMPTY_WORK_ORDER,
  customerId: "1",
  vehicles: [{ ...EMPTY_VEHICLE_LINE, vehicleTypeId: "2", quantity: "1,200.5", quantityUnit: "พาเลท" }],
  receiveAt: { date: "2026-11-27", time: "08:30" },
  deliveryAt: { date: "2026-11-27", time: "15:00" },
  transportFee: "3,500",
};

function messages(values: WorkOrderFormValues) {
  const result = workOrderSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe("create work order form (BR-WO-03..10)", () => {
  it("turns form strings into numbers, nulls and Bangkok date-times", () => {
    const output = workOrderSchema.parse(valid);
    expect(output).toMatchObject({
      customerId: 1,
      statusCode: 1,
      orderedBy: null,
      transportFee: "3500",
      overnightNights: 0,
      receiveAt: "2026-11-27T08:30",
      deliveryAt: "2026-11-27T15:00",
    });
    expect(output.vehicles).toEqual([
      {
        vehicleTypeId: 2,
        driverId: null,
        vehicleId: null,
        quantity: "1200.5",
        quantityUnit: "พาเลท",
        weight: null,
        weightUnit: null,
        dimensions: null,
      },
    ]);
  });

  it("requires a customer and refuses the cancelled status", () => {
    expect(messages({ ...valid, customerId: "" })).toContain("กรุณาเลือกผู้ว่าจ้าง");
    expect(messages({ ...valid, statusCode: "2" })).toContain("สถานะงานไม่ถูกต้อง");
  });

  it("drops empty vehicle lines but needs at least one with data (BR-WO-07)", () => {
    const output = workOrderSchema.parse({ ...valid, vehicles: [EMPTY_VEHICLE_LINE, ...valid.vehicles] });
    expect(output.vehicles).toHaveLength(1);
    expect(messages({ ...valid, vehicles: [{ ...EMPTY_VEHICLE_LINE, quantityUnit: "พาเลท" }] })).toContain(
      "ต้องมีข้อมูลรถอย่างน้อย 1 คัน",
    );
  });

  it("keeps money and counts within the rules (BR-WO-04)", () => {
    expect(messages({ ...valid, portFee: "-100" })).toContain("ค่าผ่านท่าต้องเป็นตัวเลขไม่ติดลบ ทศนิยมไม่เกิน 2 ตำแหน่ง");
    expect(messages({ ...valid, transportFee: "10.555" })).toContain(
      "ค่าขนส่งต้องเป็นตัวเลขไม่ติดลบ ทศนิยมไม่เกิน 2 ตำแหน่ง",
    );
    expect(messages({ ...valid, overnightNights: "16" })).toContain("จำนวนคืนต้องเป็นจำนวนเต็ม 0–15");
  });

  it("needs both date and time, and delivery not before receive (BR-WO-10)", () => {
    expect(messages({ ...valid, receiveAt: { date: "2026-11-27", time: "" } })).toContain(
      "กรุณาระบุเวลาแบบ 24 ชม. เช่น 08:30",
    );
    expect(messages({ ...valid, receiveAt: { date: "", time: "08:30" } })).toContain("กรุณาเลือกวันที่");
    expect(messages({ ...valid, deliveryAt: { date: "2026-11-27", time: "08:00" } })).toContain(
      "วันเวลาส่งงานต้องไม่ก่อนวันเวลารับงาน",
    );
    expect(workOrderSchema.parse({ ...valid, receiveAt: { date: "", time: "" } }).receiveAt).toBeNull();
  });

  it("reads the form time as Bangkok time", () => {
    expect(bangkokDateTime("2026-11-27T08:30").toISOString()).toBe("2026-11-27T01:30:00.000Z");
  });
});
