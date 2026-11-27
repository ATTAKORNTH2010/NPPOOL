"use server";

import { APIError } from "better-auth/api";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import type { z } from "zod";
import { db } from "@/db/client";
import { GENERIC_ERROR, INVALID_INPUT, RuleError, type ActionResult } from "@/lib/action-result";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/dal";
import {
  changeRoleSchema,
  createUserSchema,
  resetPasswordSchema,
  userIdInputSchema,
  type ChangeRoleInput,
  type CreateUserInput,
  type ResetPasswordInput,
  type UserIdInput,
} from "./schemas";
import * as service from "./service";

/** Better Auth error codes that can come back from the admin endpoints. */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "ชื่อผู้ใช้นี้มีอยู่แล้ว",
  USERNAME_IS_ALREADY_TAKEN: "ชื่อผู้ใช้นี้มีอยู่แล้ว",
  YOU_CANNOT_BAN_YOURSELF: "ระงับบัญชีของตัวเองไม่ได้",
  USER_NOT_FOUND: "ไม่พบผู้ใช้",
  PASSWORD_TOO_SHORT: "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร",
  PASSWORD_TOO_LONG: "รหัสผ่านยาวได้ไม่เกิน 128 ตัวอักษร",
};

function messageFor(error: unknown): string {
  if (error instanceof RuleError) return error.message;
  if (error instanceof APIError) {
    const code = (error.body as { code?: string } | undefined)?.code;
    if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
  }
  // Server log only: no names or phone numbers in it (PDPA).
  console.error("[users] action failed:", error instanceof Error ? `${error.name}: ${error.message}` : error);
  return GENERIC_ERROR;
}

/** Permission first (it may redirect), then validation, then the rule-checked change. */
async function run<T>(
  schema: z.ZodType<T>,
  input: unknown,
  change: (ctx: service.UsersContext, data: T) => Promise<void>,
  success: string,
): Promise<ActionResult> {
  const actor = await requirePermission("user.manage");
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { ok: false, message: INVALID_INPUT, fieldErrors };
  }
  try {
    await change({ auth, db, headers: await headers(), actorId: actor.id }, parsed.data);
  } catch (error) {
    return { ok: false, message: messageFor(error) };
  }
  refresh();
  return { ok: true, message: success };
}

export async function createUserAction(input: CreateUserInput) {
  return run(createUserSchema, input, service.createUser, "เพิ่มผู้ใช้แล้ว");
}

export async function changeRoleAction(input: ChangeRoleInput) {
  return run(changeRoleSchema, input, service.changeRole, "เปลี่ยนบทบาทแล้ว");
}

export async function resetPasswordAction(input: ResetPasswordInput) {
  return run(resetPasswordSchema, input, service.resetPassword, "ตั้งรหัสผ่านใหม่แล้ว");
}

export async function banUserAction(input: UserIdInput) {
  return run(userIdInputSchema, input, service.banUser, "ระงับบัญชีแล้ว");
}

export async function unbanUserAction(input: UserIdInput) {
  return run(userIdInputSchema, input, service.unbanUser, "เลิกระงับบัญชีแล้ว");
}
