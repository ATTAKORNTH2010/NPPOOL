"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Tells the server which page the user opened, for the admin's activity log
 * (ADR-0012). Sent with sendBeacon, so it never delays navigation. The server
 * decides which paths count and who the user is, and skips a page the same
 * user opened a few minutes ago. That check must not live here: one tab can
 * be used by several people in turn, and with Cache Components the signed-in
 * shell (and this module's state) survives sign-out and the next sign-in.
 */
export function ActivityTracker() {
  const pathname = usePathname();

  useEffect(() => {
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
