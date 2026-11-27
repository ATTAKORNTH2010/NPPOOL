import type { ActivityModule } from "@/features/activity/catalog";
import type { ActionActivity } from "@/lib/server-action";
import type { DeleteInput, SetActiveInput } from "./schemas";

/** Activity-log entries for the four master-data actions (ADR-0012). */
export function masterDataActivity(module: ActivityModule, noun: string) {
  return {
    create<T>(name: (data: T) => string): ActionActivity<T, unknown> {
      return { module, action: "create", detail: (data) => `เพิ่ม${noun} ${name(data)}` };
    },
    update<T extends { id: number }>(name: (data: T) => string): ActionActivity<T, unknown> {
      return { module, action: "update", entityId: (data) => data.id, detail: (data) => `แก้ไข${noun} ${name(data)}` };
    },
    setActive: {
      module,
      action: (data) => (data.active ? "activate" : "deactivate"),
      entityId: (data) => data.id,
      detail: (data) => `${data.active ? "เปิด" : "ปิด"}ใช้งาน${noun} (รหัส ${data.id})`,
    } satisfies ActionActivity<SetActiveInput, unknown>,
    delete: {
      module,
      action: "delete",
      entityId: (data) => data.id,
      detail: (data) => `ลบ${noun} (รหัส ${data.id})`,
    } satisfies ActionActivity<DeleteInput, unknown>,
  };
}
