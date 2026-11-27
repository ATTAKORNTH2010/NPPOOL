import { z } from "zod";

/**
 * Password policy (AUTH-05): at least 8 characters with upper case, lower
 * case, a digit and a symbol — not weaker than the legacy ASP.NET Identity
 * defaults. Used wherever an admin sets or a user changes a password.
 */
export const passwordSchema = z
  .string()
  .min(8, "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร")
  .max(128, "รหัสผ่านยาวได้ไม่เกิน 128 ตัวอักษร")
  .regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว")
  .regex(/[a-z]/, "ต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว")
  .regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว")
  .regex(/[^A-Za-z0-9]/, "ต้องมีสัญลักษณ์อย่างน้อย 1 ตัว");

/** Same rules as the Better Auth username plugin defaults (a–z 0–9 _ . , 3–30 chars). */
export const usernameSchema = z
  .string()
  .trim()
  .min(3, "ชื่อผู้ใช้ต้องยาว 3–30 ตัวอักษร")
  .max(30, "ชื่อผู้ใช้ต้องยาว 3–30 ตัวอักษร")
  .regex(/^[A-Za-z0-9_.]+$/, "ใช้ได้เฉพาะ a–z, 0–9, _ และ .");
