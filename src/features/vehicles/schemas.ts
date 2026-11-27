import { z } from "zod";
import { idSchema } from "@/lib/validation";

/** MD-02 · BR-MD-02: plate and type required; plate unique, spaces trimmed and collapsed. */
export const vehicleSchema = z.object({
  plateNo: z
    .string()
    .transform((value) => value.trim().replace(/\s+/g, " "))
    .pipe(z.string().min(1, "กรุณากรอกเลขทะเบียนรถ").max(30, "เลขทะเบียนยาวได้ไม่เกิน 30 ตัวอักษร")),
  vehicleTypeId: z
    .string()
    .regex(/^\d+$/, "กรุณาเลือกประเภทรถ")
    .transform(Number),
});
export const updateVehicleSchema = vehicleSchema.extend({ id: idSchema });

export type VehicleFormValues = z.input<typeof vehicleSchema>;
export type VehicleInput = z.output<typeof vehicleSchema>;
export type UpdateVehicleInput = z.output<typeof updateVehicleSchema>;
