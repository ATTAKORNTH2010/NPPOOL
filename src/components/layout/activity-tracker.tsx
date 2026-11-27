"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** The same page within this many minutes counts once (ADR-0012). */
const REPEAT_AFTER_MS = 5 * 60 * 1000;
const lastSent = new Map<string, number>();

/**
 * Tells the server which page the user opened, for the admin's activity log
 * (ADR-0012). Sent with sendBeacon, so it never delays navigation; the
 * server decides which paths count and who the user is.
 */
export function ActivityTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const now = Date.now();
    const previous = lastSent.get(pathname);
    if (previous !== undefined && now - previous < REPEAT_AFTER_MS) return;
    lastSent.set(pathname, now);

    const body = JSON.stringify({ path: pathname });
    const sent = navigator.sendBeacon?.("/api/activity", new Blob([body], { type: "application/json" }));
    if (!sent) {
      void fetch("/api/activity", {
        method: "POST",
        body,
        headers: { "content-type": "application/json" },
        keepalive: true,
      }).catch(() => undefined);
    }
  }, [pathname]);

  return null;
}
