import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import type { AppDatabase } from "@/db/types";
import { requestInfo } from "@/features/activity/request-info";
import { recordActivity } from "@/features/activity/service";
import type { AuthEventSink } from "./hooks";

/**
 * Sign-in, failed sign-in and sign-out → activity log (ADR-0012). A failed
 * attempt is tied to the account only when the typed username exists; an
 * unknown username is not stored (people sometimes type a password there).
 */
export function recordAuthEvents(db: AppDatabase): AuthEventSink {
  return async (event) => {
    const info = requestInfo(event.headers);
    if (event.kind !== "loginFailed") {
      await recordActivity(db, { userId: event.userId, module: "auth", action: event.kind, ...info });
      return;
    }
    const username = event.username?.trim().toLowerCase() ?? "";
    const [user] = username
      ? await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1)
      : [];
    await recordActivity(db, {
      userId: user?.id ?? null,
      module: "auth",
      action: "loginFailed",
      detail: user ? "รหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับ" : "ไม่พบชื่อผู้ใช้ที่กรอก",
      ...info,
    });
  };
}
