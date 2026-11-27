import { z } from "zod";
import { idSchema, requiredText } from "@/lib/validation";

/** Thai or English letters, digits, spaces and - _ . / (Thai codes such as "6ล้อ": user request 2026-11-27). */
const CODE = /^[A-Za-z0-9ก-๛ ._/-]+$/;

/** MD-05 (pulled into module 2, D24): code is unique; English letters are stored in upper case. */
export const vehicleTypeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "กรุณากรอกรหัสประเภทรถ")
    .max(20, "รหัสยาวได้ไม่เกิน 20 ตัวอักษร")
    .regex(CODE, "รหัสใช้ได้เฉพาะตัวอักษรไทยหรืออังกฤษ ตัวเลข ช่องว่าง และ - _ . /")
    .transform((value) => value.replace(/\s+/g, " ").toUpperCase()),
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
