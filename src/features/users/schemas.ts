import { z } from "zod";
import { passwordSchema, usernameSchema } from "@/lib/auth/password-policy";
import { ROLES } from "@/lib/permissions";
import { phoneSchema } from "@/lib/validation";

/** Shared by the forms and the Server Actions (design 02, section 3.7). */
export const roleSchema = z.enum(ROLES, { error: "กรุณาเลือกบทบาท" });

export const fullNameSchema = z
  .string()
  .trim()
  .min(1, "กรุณากรอกชื่อ-นามสกุล")
  .max(100, "ชื่อ-นามสกุลยาวได้ไม่เกิน 100 ตัวอักษร");

const userIdSchema = z.string().min(1);

export const createUserSchema = z.object({
  username: usernameSchema,
  name: fullNameSchema,
  phone: phoneSchema,
  role: roleSchema,
  password: passwordSchema,
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const changeRoleSchema = z.object({ userId: userIdSchema, role: roleSchema });
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;

export const resetPasswordSchema = z.object({ userId: userIdSchema, password: passwordSchema });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Form-only: asks for the new password twice. */
export const resetPasswordFormSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((value) => value.password === value.confirm, {
    message: "รหัสผ่านทั้งสองช่องไม่ตรงกัน",
    path: ["confirm"],
  });

export const userIdInputSchema = z.object({ userId: userIdSchema });
export type UserIdInput = z.infer<typeof userIdInputSchema>;
