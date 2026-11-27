"use server";

import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/permissions";
import { runAction, type ActionContext } from "@/lib/server-action";
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

function mapAuthError(error: unknown): string | undefined {
  if (!(error instanceof APIError)) return undefined;
  const code = (error.body as { code?: string } | undefined)?.code;
  return code ? AUTH_ERROR_MESSAGES[code] : undefined;
}

function usersContext(ctx: ActionContext): service.UsersContext {
  return { auth, db: ctx.db, headers: ctx.headers, actorId: ctx.actorId };
}

const common = { permission: "user.manage", mapError: mapAuthError } as const;

export async function createUserAction(input: CreateUserInput) {
  return runAction(
    {
      ...common,
      schema: createUserSchema,
      input,
      success: "เพิ่มผู้ใช้แล้ว",
      activity: {
        module: "users",
        action: "create",
        detail: (data) => `เพิ่มผู้ใช้ ${data.username} (${ROLE_LABELS[data.role]})`,
      },
    },
    (ctx, data) => service.createUser(usersContext(ctx), data),
  );
}

export async function changeRoleAction(input: ChangeRoleInput) {
  return runAction(
    {
      ...common,
      schema: changeRoleSchema,
      input,
      success: "เปลี่ยนบทบาทแล้ว",
      activity: {
        module: "users",
        action: "changeRole",
        entityId: (data) => data.userId,
        detail: (data) => `เปลี่ยนบทบาทเป็น ${ROLE_LABELS[data.role]}`,
      },
    },
    (ctx, data) => service.changeRole(usersContext(ctx), data),
  );
}

export async function resetPasswordAction(input: ResetPasswordInput) {
  return runAction(
    {
      ...common,
      schema: resetPasswordSchema,
      input,
      success: "ตั้งรหัสผ่านใหม่แล้ว",
      activity: { module: "users", action: "resetPassword", entityId: (data) => data.userId },
    },
    (ctx, data) => service.resetPassword(usersContext(ctx), data),
  );
}

export async function banUserAction(input: UserIdInput) {
  return runAction(
    {
      ...common,
      schema: userIdInputSchema,
      input,
      success: "ระงับบัญชีแล้ว",
      activity: { module: "users", action: "ban", entityId: (data) => data.userId },
    },
    (ctx, data) => service.banUser(usersContext(ctx), data),
  );
}

export async function unbanUserAction(input: UserIdInput) {
  return runAction(
    {
      ...common,
      schema: userIdInputSchema,
      input,
      success: "เลิกระงับบัญชีแล้ว",
      activity: { module: "users", action: "unban", entityId: (data) => data.userId },
    },
    (ctx, data) => service.unbanUser(usersContext(ctx), data),
  );
}
