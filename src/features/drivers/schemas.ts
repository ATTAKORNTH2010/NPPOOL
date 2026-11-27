import { z } from "zod";
import { idSchema, phoneSchema, requiredText } from "@/lib/validation";

/** MD-03 · BR-MD-03: first and last name required, phone optional (no ID card or address — MD-07 Drop). */
export const driverSchema = z.object({
  firstName: requiredText("กรุณากรอกชื่อ", 100),
  lastName: requiredText("กรุณากรอกนามสกุล", 100),
  phone: phoneSchema,
});
export const updateDriverSchema = driverSchema.extend({ id: idSchema });

export type DriverFormValues = z.input<typeof driverSchema>;
export type DriverInput = z.output<typeof driverSchema>;
export type UpdateDriverInput = z.output<typeof updateDriverSchema>;
