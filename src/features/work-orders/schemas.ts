import { z } from "zod";
import { WORK_STATUS } from "./statuses";

/**
 * Create-work-order form (design 02 §3.3, BR-WO-03..10). The same schema runs
 * in the browser and in the Server Action. Form values are strings; the
 * output has numbers, nulls for empty optional fields and Bangkok wall-clock
 * date-times ("YYYY-MM-DDTHH:mm").
 */

const MONEY = /^\d{1,12}(\.\d{1,2})?$/;
const AMOUNT = /^\d{1,10}(\.\d{1,2})?$/;

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `ยาวได้ไม่เกิน ${max} ตัวอักษร`)
    .transform((value) => (value === "" ? null : value));
}

/** Empty → null · commas allowed · ≥ 0 with at most 2 decimals (BR-WO-04). */
function optionalAmount(label: string, pattern = MONEY) {
  return z
    .string()
    .trim()
    .transform((value) => value.replace(/,/g, ""))
    .refine((value) => value === "" || pattern.test(value), `${label}ต้องเป็นตัวเลขไม่ติดลบ ทศนิยมไม่เกิน 2 ตำแหน่ง`)
    .transform((value) => (value === "" ? null : value));
}

const optionalId = z
  .string()
  .refine((value) => value === "" || /^\d+$/.test(value), "รายการที่เลือกไม่ถูกต้อง")
  .transform((value) => (value === "" ? null : Number(value)));

/** Nights / extra workers: whole numbers 0–15 (BR-WO-04). */
function smallCount(label: string) {
  return z
    .string()
    .regex(/^\d{1,2}$/, `${label}ต้องเป็นจำนวนเต็ม 0–15`)
    .transform(Number)
    .refine((value) => value <= 15, `${label}ต้องเป็นจำนวนเต็ม 0–15`);
}

/** Date + time, both or neither; stored with the time (BR-WO-10, F3). */
export const dateTimeSchema = z
  .object({ date: z.string(), time: z.string() })
  .superRefine((value, ctx) => {
    if (!value.date && !value.time) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date)) {
      ctx.addIssue({ code: "custom", message: "กรุณาเลือกวันที่" });
    } else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.time)) {
      ctx.addIssue({ code: "custom", message: "กรุณาระบุเวลาแบบ 24 ชม. เช่น 08:30" });
    }
  })
  .transform((value) => (value.date && value.time ? `${value.date}T${value.time}` : null));

export const vehicleLineSchema = z.object({
  vehicleTypeId: optionalId,
  driverId: optionalId,
  vehicleId: optionalId,
  quantity: optionalAmount("จำนวน", AMOUNT),
  quantityUnit: optionalText(30),
  weight: optionalAmount("น้ำหนัก", AMOUNT),
  weightUnit: optionalText(30),
  dimensions: optionalText(100),
});
export type VehicleLineInput = z.output<typeof vehicleLineSchema>;

/** A line counts when anything but its units is filled (units alone mean nothing). */
export function lineHasData(line: VehicleLineInput): boolean {
  return (
    line.vehicleTypeId !== null ||
    line.driverId !== null ||
    line.vehicleId !== null ||
    line.quantity !== null ||
    line.weight !== null ||
    line.dimensions !== null
  );
}

/** Status at creation: any except “cancelled”, which only the cancel button sets (BR-WO-02). */
export const CREATABLE_STATUS_CODES: readonly number[] = Object.values(WORK_STATUS).filter(
  (code) => code !== WORK_STATUS.CANCELLED,
);

export const workOrderSchema = z
  .object({
    customerId: z.string().regex(/^\d+$/, "กรุณาเลือกผู้ว่าจ้าง").transform(Number),
    statusCode: z
      .string()
      .regex(/^\d+$/, "กรุณาเลือกสถานะงาน")
      .transform(Number)
      .refine((code) => CREATABLE_STATUS_CODES.includes(code), "สถานะงานไม่ถูกต้อง"),
    orderedBy: optionalText(100),
    pickupLocation: optionalText(200),
    pickupContactName: optionalText(100),
    pickupContactPhone: optionalText(50),
    dropoffLocation: optionalText(200),
    dropoffContactName: optionalText(100),
    dropoffContactPhone: optionalText(50),
    transportFee: optionalAmount("ค่าขนส่ง"),
    // Empty lines are dropped; at least one line with data is required (BR-WO-07).
    vehicles: z
      .array(vehicleLineSchema)
      .transform((lines) => lines.filter(lineHasData))
      .refine((lines) => lines.length > 0, "ต้องมีข้อมูลรถอย่างน้อย 1 คัน"),
    receiveAt: dateTimeSchema,
    deliveryAt: dateTimeSchema,
    customerJobNo: optionalText(100),
    remark: optionalText(1000),
    portFee: optionalAmount("ค่าผ่านท่า"),
    demurrageFee: optionalAmount("ค่าเสียเวลา"),
    overnightNights: smallCount("จำนวนคืน"),
    overnightLaborFee: optionalAmount("ค่าแรงค้างคืน"),
    extraWorkers: smallCount("จำนวนคน"),
    extraWorkerFee: optionalAmount("ค่าแรงคน"),
  })
  .superRefine((value, ctx) => {
    // Same format and time zone, so string order is time order.
    if (value.receiveAt && value.deliveryAt && value.deliveryAt < value.receiveAt) {
      ctx.addIssue({ code: "custom", path: ["deliveryAt"], message: "วันเวลาส่งงานต้องไม่ก่อนวันเวลารับงาน" });
    }
  });

export type WorkOrderFormValues = z.input<typeof workOrderSchema>;
export type WorkOrderInput = z.output<typeof workOrderSchema>;
export type VehicleLineFormValues = z.input<typeof vehicleLineSchema>;

export const EMPTY_VEHICLE_LINE: VehicleLineFormValues = {
  vehicleTypeId: "",
  driverId: "",
  vehicleId: "",
  quantity: "",
  quantityUnit: "",
  weight: "",
  weightUnit: "",
  dimensions: "",
};

export const EMPTY_WORK_ORDER: WorkOrderFormValues = {
  customerId: "",
  statusCode: String(WORK_STATUS.OPEN),
  orderedBy: "",
  pickupLocation: "",
  pickupContactName: "",
  pickupContactPhone: "",
  dropoffLocation: "",
  dropoffContactName: "",
  dropoffContactPhone: "",
  transportFee: "",
  vehicles: [EMPTY_VEHICLE_LINE],
  receiveAt: { date: "", time: "" },
  deliveryAt: { date: "", time: "" },
  customerJobNo: "",
  remark: "",
  portFee: "",
  demurrageFee: "",
  overnightNights: "0",
  overnightLaborFee: "",
  extraWorkers: "0",
  extraWorkerFee: "",
};

/** Bangkok wall-clock "YYYY-MM-DDTHH:mm" → instant (ADR-0008: stored as timestamptz). */
export function bangkokDateTime(value: string): Date {
  return new Date(`${value}:00+07:00`);
}
