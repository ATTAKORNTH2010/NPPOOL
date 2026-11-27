/**
 * Access control for the Better Auth admin plugin (ADR-0004).
 * Only the "admin" role may use the admin endpoints (create users, set roles,
 * set passwords, ban users). Application permissions such as creating work
 * orders live in src/lib/permissions.ts.
 */
import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

export const statement = { ...defaultStatements } as const;

export const ac = createAccessControl(statement);

export const roles = {
  admin: ac.newRole({ ...adminAc.statements }),
  maker: ac.newRole({ user: [], session: [] }),
  accounting: ac.newRole({ user: [], session: [] }),
};
