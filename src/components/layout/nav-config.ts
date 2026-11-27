import type { Permission } from "@/lib/permissions";

/** Sidebar menu (docs/design/02-screens-and-routes.md section 2). */
export type NavIcon = "filePlus" | "clipboardList" | "building" | "truck" | "contact" | "mapPinned" | "users" | "tags" | "activity";

export type NavItem = { title: string; href: string; icon: NavIcon; permission: Permission };
export type NavGroup = { title: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "จัดการงาน",
    items: [
      { title: "สร้างใบงาน", href: "/work-orders/new", icon: "filePlus", permission: "workOrder.create" },
      { title: "รายการใบงาน", href: "/work-orders", icon: "clipboardList", permission: "workOrder.view" },
    ],
  },
  {
    title: "ข้อมูลพื้นฐาน",
    items: [
      { title: "ผู้ว่าจ้าง", href: "/master/customers", icon: "building", permission: "masterData.manage" },
      { title: "รถ", href: "/master/vehicles", icon: "truck", permission: "masterData.manage" },
      { title: "ประเภทรถ", href: "/master/vehicle-types", icon: "tags", permission: "masterData.manage" },
      { title: "พนักงานขับรถ", href: "/master/drivers", icon: "contact", permission: "masterData.manage" },
      { title: "สถานที่รับ-ส่ง", href: "/master/routes", icon: "mapPinned", permission: "masterData.manage" },
    ],
  },
  {
    title: "ผู้ดูแลระบบ",
    items: [
      { title: "ผู้ใช้", href: "/admin/users", icon: "users", permission: "user.manage" },
      { title: "Activity Logs", href: "/admin/activity", icon: "activity", permission: "activity.view" },
    ],
  },
];
