/**
 * User management (AUTH-06) on top of Better Auth's admin plugin. The plugin
 * checks the caller's session and role; this module adds the rules from
 * design 02, section 3.7:
 *  - the last active admin cannot be banned or lose the admin role
 *  - an admin cannot ban themselves
 *  - a new password revokes the user's sessions (except the caller's own)
 *
 * Kept free of Next.js imports so integration tests can run it on PGlite.
 */
import { and, asc, count, eq, isNull, ne, or } from "drizzle-orm";
import { users } from "@/db/schema";
import type { AppDatabase } from "@/db/types";
import { RuleError } from "@/lib/action-result";
import type { Auth } from "@/lib/auth/config";
import { syntheticEmail } from "@/lib/auth/options";
import type { ChangeRoleInput, CreateUserInput, ResetPasswordInput, UserIdInput } from "./schemas";

export type UsersContext = {
  auth: Auth;
  db: AppDatabase;
  /** Request headers of the signed-in admin (their session cookie). */
  headers: Headers;
  actorId: string;
};

export type UserListItem = {
  id: string;
  username: string;
  name: string;
  phone: string | null;
  role: string;
  banned: boolean;
};

const notBanned = or(eq(users.banned, false), isNull(users.banned));

export async function listUsers(db: AppDatabase): Promise<UserListItem[]> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayUsername: users.displayUsername,
      name: users.name,
      phone: users.phone,
      role: users.role,
      banned: users.banned,
    })
    .from(users)
    .orderBy(asc(users.username));
  return rows.map((row) => ({
    id: row.id,
    username: row.displayUsername || row.username || "",
    name: row.name,
    phone: row.phone || null,
    role: row.role ?? "",
    banned: row.banned === true,
  }));
}

async function findUser(db: AppDatabase, userId: string) {
  const [user] = await db
    .select({ id: users.id, role: users.role, banned: users.banned })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) throw new RuleError("ไม่พบผู้ใช้");
  return { ...user, banned: user.banned === true };
}

async function assertAnotherActiveAdmin(db: AppDatabase, userId: string) {
  const [row] = await db
    .select({ total: count() })
    .from(users)
    .where(and(eq(users.role, "admin"), notBanned, ne(users.id, userId)));
  if (!row || row.total === 0) {
    throw new RuleError("ต้องมีผู้ดูแลระบบที่ใช้งานได้อย่างน้อย 1 คน");
  }
}

export async function createUser(ctx: UsersContext, input: CreateUserInput) {
  const username = input.username.toLowerCase();
  const [existing] = await ctx.db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  if (existing) throw new RuleError("ชื่อผู้ใช้นี้มีอยู่แล้ว");

  await ctx.auth.api.createUser({
    headers: ctx.headers,
    body: {
      email: syntheticEmail(username),
      password: input.password,
      name: input.name,
      role: input.role,
      data: { username, displayUsername: input.username, phone: input.phone || null },
    },
  });
}

export async function changeRole(ctx: UsersContext, input: ChangeRoleInput) {
  const target = await findUser(ctx.db, input.userId);
  if (target.role === input.role) return;
  if (target.role === "admin" && !target.banned) await assertAnotherActiveAdmin(ctx.db, target.id);
  await ctx.auth.api.setRole({ headers: ctx.headers, body: { userId: target.id, role: input.role } });
}

export async function resetPassword(ctx: UsersContext, input: ResetPasswordInput) {
  const target = await findUser(ctx.db, input.userId);
  await ctx.auth.api.setUserPassword({
    headers: ctx.headers,
    body: { userId: target.id, newPassword: input.password },
  });
  // Anyone still signed in with the old password is signed out.
  if (target.id !== ctx.actorId) {
    await ctx.auth.api.revokeUserSessions({ headers: ctx.headers, body: { userId: target.id } });
  }
}

export async function banUser(ctx: UsersContext, input: UserIdInput) {
  if (input.userId === ctx.actorId) throw new RuleError("ระงับบัญชีของตัวเองไม่ได้");
  const target = await findUser(ctx.db, input.userId);
  if (target.banned) return;
  if (target.role === "admin") await assertAnotherActiveAdmin(ctx.db, target.id);
  // Better Auth also revokes all of the user's sessions.
  await ctx.auth.api.banUser({ headers: ctx.headers, body: { userId: target.id } });
}

export async function unbanUser(ctx: UsersContext, input: UserIdInput) {
  const target = await findUser(ctx.db, input.userId);
  if (!target.banned) return;
  await ctx.auth.api.unbanUser({ headers: ctx.headers, body: { userId: target.id } });
}
