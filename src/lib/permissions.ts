/**
 * Role → permission map (ADR-0009). Source: role matrix in
 * docs/rea/02-domain-model.md section 6.2, confirmed 2026-11-26.
 *
 * Pure module: safe to import from server code, client components and tests.
 * Every page and Server Action must still check permissions on the server
 * (see src/lib/dal.ts) — hiding a menu item is only a convenience.
 */

export const ROLES = ["admin", "maker", "accounting"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "ผู้ดูแลระบบ",
  maker: "ผู้ทำใบงาน",
  accounting: "บัญชี",
};

export const PERMISSIONS = {
  /** ดูรายการใบงาน, เปิดดูใบงาน */
  "workOrder.view": ["admin", "maker", "accounting"],
  /** สร้างใบงาน */
  "workOrder.create": ["admin", "maker"],
  /** แก้ไขใบงานที่ยังไม่ยกเลิก (WO-14 — ผู้ใช้ขอ 2026-11-27) */
  "workOrder.edit": ["admin", "maker"],
  /** ยกเลิกใบงาน — ยังแสดงในรายการพร้อมสถานะ “ยกเลิก” (ADR-0010) */
  "workOrder.cancel": ["admin", "maker"],
  /** ลบใบงาน = ซ่อนจากทุกหน้าจอ แต่ข้อมูลยังอยู่ (ADR-0010 ส่วนเพิ่มเติม 2026-11-27) */
  "workOrder.delete": ["admin", "maker"],
  /** พิมพ์ใบสั่งปฏิบัติงาน */
  "workOrder.print": ["admin", "maker", "accounting"],
  /** ส่งออกรายการใบงานที่ค้นหาเป็นไฟล์ Excel */
  "workOrder.export": ["admin", "maker", "accounting"],
  /** เพิ่ม / แก้ / ปิดใช้งาน ข้อมูลพื้นฐาน */
  "masterData.manage": ["admin"],
  /** จัดการผู้ใช้และบทบาท */
  "user.manage": ["admin"],
  /** ดู Activity Logs ของผู้ใช้ทุกคน (ADR-0012) */
  "activity.view": ["admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function hasPermission(role: unknown, permission: Permission): boolean {
  if (!isRole(role)) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
