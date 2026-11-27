import { describe, expect, it } from "vitest";
import { hasPermission, isRole, PERMISSIONS, ROLES, type Permission } from "@/lib/permissions";

// Role matrix from docs/rea/02-domain-model.md section 6.2 (confirmed 2026-11-26).
const expected: Record<Permission, Record<(typeof ROLES)[number], boolean>> = {
  "workOrder.view": { admin: true, maker: true, accounting: true },
  "workOrder.create": { admin: true, maker: true, accounting: false },
  "workOrder.cancel": { admin: true, maker: true, accounting: false },
  "workOrder.print": { admin: true, maker: true, accounting: true },
  "masterData.manage": { admin: true, maker: false, accounting: false },
  "user.manage": { admin: true, maker: false, accounting: false },
};

describe("permissions", () => {
  it("covers every permission in the confirmed role matrix", () => {
    expect(Object.keys(PERMISSIONS).sort()).toEqual(Object.keys(expected).sort());
  });

  for (const [permission, byRole] of Object.entries(expected) as [Permission, Record<string, boolean>][]) {
    for (const role of ROLES) {
      it(`${role} ${byRole[role] ? "can" : "cannot"} ${permission}`, () => {
        expect(hasPermission(role, permission)).toBe(byRole[role]);
      });
    }
  }

  it("denies unknown roles, missing roles and legacy role names", () => {
    for (const role of [undefined, null, "", "user", "GL", "Admin", "superadmin"]) {
      expect(hasPermission(role, "workOrder.view")).toBe(false);
    }
    expect(isRole("maker")).toBe(true);
    expect(isRole("Maker")).toBe(false);
  });
});
