import { z } from "zod";
import { idSchema, requiredText } from "@/lib/validation";

/** MD-05 (pulled into module 2, D24): code is unique and stored in upper case. */
export const vehicleTypeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "กรุณากรอกรหัสประเภทรถ")
    .max(20, "รหัสยาวได้ไม่เกิน 20 ตัวอักษร")
    .regex(/^[A-Za-z0-9_-]+$/, "รหัสใช้ได้เฉพาะ A–Z, 0–9, - และ _")
    .transform((value) => value.toUpperCase()),
  name: requiredText("กรุณากรอกชื่อประเภทรถ", 100),
  sortOrder: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, "ลำดับต้องเป็นตัวเลข 0–999")
    .transform(Number),
});
export const updateVehicleTypeSchema = vehicleTypeSchema.extend({ id: idSchema });

export type VehicleTypeFormValues = z.input<typeof vehicleTypeSchema>;
export type VehicleTypeInput = z.output<typeof vehicleTypeSchema>;
export type UpdateVehicleTypeInput = z.output<typeof updateVehicleTypeSchema>;
