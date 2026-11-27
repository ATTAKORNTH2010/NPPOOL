import "server-only";

import { after } from "next/server";
import { db } from "@/db/client";
import { requestInfo } from "./request-info";
import { recordActivity, type ActivityEntry } from "./service";

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
      console.error("[activity] not recorded:", error instanceof Error ? error.name : "unknown error");
    }
  });
}
