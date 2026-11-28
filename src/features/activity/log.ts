import "server-only";

import { after } from "next/server";
import { db } from "@/db/client";
import { requestInfo } from "./request-info";
import { purgeExpiredActivity, recordActivity, recordPageView, type ActivityEntry, type PageView } from "./service";

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
 * Runs the write after the response is sent, so logging never slows the user
 * down and a logging failure never breaks the action itself (ADR-0012).
 */
function writeLater(write: () => Promise<unknown>): void {
  after(async () => {
    try {
      await write();
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

export function logActivity(entry: Omit<ActivityEntry, "ipAddress" | "userAgent">, headers: Headers): void {
  const info = requestInfo(headers);
  writeLater(() => recordActivity(db, { ...entry, ...info }));
}

/** A page view: skipped when the same user opened the same page a few minutes ago (service.ts). */
export function logPageView(view: Omit<PageView, "ipAddress" | "userAgent">, headers: Headers): void {
  const info = requestInfo(headers);
  writeLater(() => recordPageView(db, { ...view, ...info }));
}
