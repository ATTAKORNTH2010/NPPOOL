import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { hasPermission, isRole, type Permission, type Role } from "@/lib/permissions";

/**
 * Data Access Layer for the signed-in user (ADR-0009). Every page and Server
 * Action calls requireUser() / requirePermission() on the server; proxy.ts
 * only does an optimistic cookie check.
 *
 * With Cache Components these functions read request headers, so the
 * components that call them must sit inside a <Suspense> boundary.
 */
export type CurrentUser = {
  id: string;
  username: string;
  name: string;
  role: Role;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // disableRefresh: a Server Component cannot re-issue the cookie, so renewing a
  // "remember me" session here would move the row but not the cookie's Max-Age.
  // Renewal happens through /api/auth/get-session instead (session-policy.ts).
  const session = await auth.api.getSession({ headers: await headers(), query: { disableRefresh: true } });
  if (!session) return null;
  const { user } = session;
  if (user.banned || !isRole(user.role)) return null;
  return {
    id: user.id,
    username: user.displayUsername || user.username || "",
    name: user.name,
    role: user.role,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) redirect("/forbidden");
  return user;
}
