"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";

/** Better Auth renews only after `updateAge` (5 min), so once a minute is plenty. */
const PING_EVERY_MS = 60_000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "focus"] as const;

/**
 * Renews the 30-minute session while the user is active (BR-AU-03). Server
 * Components cannot set cookies, so the renewal goes through the auth Route
 * Handler. When the session has already expired, it sends the user to /login.
 */
export function SessionKeepAlive() {
  const pathname = usePathname();
  const router = useRouter();
  const lastPing = useRef(0);

  useEffect(() => {
    async function ping() {
      const now = Date.now();
      if (now - lastPing.current < PING_EVERY_MS) return;
      lastPing.current = now;
      const { data, error } = await authClient.getSession();
      if (!error && !data) {
        toast.info("หมดเวลาการใช้งาน กรุณาเข้าสู่ระบบอีกครั้ง");
        router.replace("/login");
      }
    }

    void ping();
    for (const name of ACTIVITY_EVENTS) window.addEventListener(name, ping, { passive: true });
    return () => {
      for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, ping);
    };
  }, [pathname, router]);

  return null;
}
