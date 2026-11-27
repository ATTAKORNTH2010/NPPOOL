/**
 * Names used in the activity log (ADR-0012). Keys are stored in the database;
 * labels are what the admin sees. Pure: safe in the browser.
 */

/**
 * Retention (owner's decision of 2026-11-27): entries are kept for three
 * calendar months, then purged (service.ts, purgeExpiredActivity).
 */
export const ACTIVITY_RETENTION_MONTHS = 3;

export const ACTIVITY_MODULES = {
  auth: "เข้าสู่ระบบ",
  home: "หน้าแรก",
  workOrders: "ใบงาน",
  customers: "ผู้ว่าจ้าง",
  vehicles: "รถ",
  vehicleTypes: "ประเภทรถ",
  drivers: "พนักงานขับรถ",
  routes: "สถานที่รับ-ส่ง",
  users: "ผู้ใช้",
  activity: "Activity Logs",
} as const;

export type ActivityModule = keyof typeof ACTIVITY_MODULES;

export const ACTIVITY_ACTIONS = {
  login: "เข้าสู่ระบบ",
  loginFailed: "เข้าสู่ระบบไม่สำเร็จ",
  logout: "ออกจากระบบ",
  view: "เปิดหน้า",
  create: "เพิ่ม/สร้าง",
  update: "แก้ไข",
  cancel: "ยกเลิก",
  delete: "ลบ",
  activate: "เปิดใช้งาน",
  deactivate: "ปิดใช้งาน",
  print: "พิมพ์",
  export: "ส่งออก Excel",
  changeRole: "เปลี่ยนบทบาท",
  resetPassword: "ตั้งรหัสผ่านใหม่",
  ban: "ระงับบัญชี",
  unban: "เลิกระงับบัญชี",
} as const;

export type ActivityAction = keyof typeof ACTIVITY_ACTIONS;

export function isActivityModule(value: unknown): value is ActivityModule {
  return typeof value === "string" && Object.hasOwn(ACTIVITY_MODULES, value);
}

export function isActivityAction(value: unknown): value is ActivityAction {
  return typeof value === "string" && Object.hasOwn(ACTIVITY_ACTIONS, value);
}

export function moduleLabel(value: string): string {
  return isActivityModule(value) ? ACTIVITY_MODULES[value] : value;
}

export function actionLabel(value: string): string {
  return isActivityAction(value) ? ACTIVITY_ACTIONS[value] : value;
}

type PageRule = { pattern: RegExp; module: ActivityModule; name: string; action?: ActivityAction };

/** Pages whose opening is logged. Anything else is ignored. */
const PAGES: PageRule[] = [
  { pattern: /^\/$/, module: "home", name: "หน้าแรก" },
  { pattern: /^\/work-orders$/, module: "workOrders", name: "รายการใบงาน" },
  { pattern: /^\/work-orders\/new$/, module: "workOrders", name: "สร้างใบงาน" },
  { pattern: /^\/work-orders\/(\d+)$/, module: "workOrders", name: "ดูใบงาน" },
  { pattern: /^\/work-orders\/(\d+)\/edit$/, module: "workOrders", name: "แก้ไขใบงาน" },
  { pattern: /^\/work-orders\/(\d+)\/print$/, module: "workOrders", name: "พิมพ์ใบสั่งปฏิบัติงาน", action: "print" },
  { pattern: /^\/master\/customers$/, module: "customers", name: "ผู้ว่าจ้าง" },
  { pattern: /^\/master\/vehicles$/, module: "vehicles", name: "รถ" },
  { pattern: /^\/master\/vehicle-types$/, module: "vehicleTypes", name: "ประเภทรถ" },
  { pattern: /^\/master\/drivers$/, module: "drivers", name: "พนักงานขับรถ" },
  { pattern: /^\/master\/routes$/, module: "routes", name: "สถานที่รับ-ส่ง" },
  { pattern: /^\/admin\/users$/, module: "users", name: "จัดการผู้ใช้" },
  { pattern: /^\/admin\/activity$/, module: "activity", name: "Activity Logs" },
];

export type PageVisit = { module: ActivityModule; action: ActivityAction; name: string; entityId: string | null };

/** "/work-orders/12/edit" → work orders · view · "แก้ไขใบงาน" · 12; unknown paths → null. */
export function describePage(path: string): PageVisit | null {
  for (const rule of PAGES) {
    const match = rule.pattern.exec(path);
    if (match) return { module: rule.module, action: rule.action ?? "view", name: rule.name, entityId: match[1] ?? null };
  }
  return null;
}
