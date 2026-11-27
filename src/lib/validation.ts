import { z } from "zod";

/** Shared Zod building blocks. Every message is Thai and shown under the field. */
export function requiredText(message: string, max: number) {
  return z.string().trim().min(1, message).max(max, `ยาวได้ไม่เกิน ${max} ตัวอักษร`);
}

/** Optional phone number: digits, + - ( ) and spaces. */
export const phoneSchema = z
  .string()
  .trim()
  .max(20, "เบอร์โทรยาวได้ไม่เกิน 20 ตัวอักษร")
  .regex(/^[0-9+\-\s()]*$/, "เบอร์โทรใช้ได้เฉพาะตัวเลข + - ( ) และช่องว่าง");

/** Database identity column value. */
export const idSchema = z.number().int().positive();
