import { z } from "zod";
import { idSchema, requiredText } from "@/lib/validation";

/** MD-01 · BR-MD-01: all four fields required, same messages as the legacy form. */
export const customerSchema = z.object({
  name: requiredText("กรุณากรอกชื่อบริษัท", 200),
  address: requiredText("กรุณากรอกที่อยู่", 500),
  phone: requiredText("กรุณากรอกเบอร์โทรศัพท์", 50),
  // Stored as 13 digits; dashes and spaces are accepted when typing (design 02 §3.6, Should).
  taxId: z
    .string()
    .trim()
    .min(1, "กรุณากรอกเลขประจำตัวผู้เสียภาษี")
    .transform((value) => value.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^\d{13}$/, "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก")),
});
export const updateCustomerSchema = customerSchema.extend({ id: idSchema });

export type CustomerFormValues = z.input<typeof customerSchema>;
export type CustomerInput = z.output<typeof customerSchema>;
export type UpdateCustomerInput = z.output<typeof updateCustomerSchema>;
