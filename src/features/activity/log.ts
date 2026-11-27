import "server-only";

import { after } from "next/server";
import { db } from "@/db/client";
import { requestInfo } from "./request-info";
import { purgeExpiredActivity, recordActivity, type ActivityEntry } from "./service";

/**
 * Entries past the retention window are purged while the app is in use, at
 * most once an hour per server instance, so no scheduled job or extra secret
 * is needed (ADR-0012). The purge uses the occurred_at index.
 */
const PURGE_INTERVAL_MS = 60 * 60 * 1000;
let nextPurgeAt = 0;

async function purgeIfDue(): Promise<void> {
  const now = Date.now();
  if (now < nextPurgeAt) return;
  nextPurgeAt = now + PURGE_INTERVAL_MS;
  await purgeExpiredActivity(db, new Date(now));
}

const errorName = (error: unknown) => (error instanceof Error ? error.name : "unknown error");

/**
 * Writes the entry after the response is sent, so logging never slows the
 * user down and a logging failure never breaks the action itself (ADR-0012).
 */
export function logActivity(entry: Omit<ActivityEntry, "ipAddress" | "userAgent">, headers: Headers): void {
  const info = requestInfo(headers);
  after(async () => {
    try {
      await recordActivity(db, { ...entry, ...info });
    } catch (error) {
      console.error("[activity] not recorded:", errorName(error));
    }
    try {
      await purgeIfDue();
    } catch (error) {
      console.error("[activity] old entries not purged:", errorName(error));
    }
  });
}
