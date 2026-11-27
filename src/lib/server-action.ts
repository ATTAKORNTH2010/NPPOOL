import "server-only";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import type { z } from "zod";
import { db } from "@/db/client";
import type { AppDatabase } from "@/db/types";
import { GENERIC_ERROR, INVALID_INPUT, RuleError, type ActionResult } from "@/lib/action-result";
import { requirePermission } from "@/lib/dal";
import type { Permission } from "@/lib/permissions";

export type ActionContext = { db: AppDatabase; actorId: string; headers: Headers };

/**
 * The one way Server Actions change data (ADR-0009, design 02 section 4):
 * permission first (it may redirect), then Zod validation, then the change,
 * then refresh() so the page shows the new data. Only RuleError messages and
 * messages from `mapError` reach the user; anything else is logged.
 */
export async function runAction<T>(
  options: {
    permission: Permission;
    schema: z.ZodType<T>;
    input: unknown;
    success: string;
    mapError?: (error: unknown) => string | undefined;
  },
  change: (ctx: ActionContext, data: T) => Promise<void>,
): Promise<ActionResult> {
  const actor = await requirePermission(options.permission);
  const parsed = options.schema.safeParse(options.input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { ok: false, message: INVALID_INPUT, fieldErrors };
  }
  try {
    await change({ db, actorId: actor.id, headers: await headers() }, parsed.data);
  } catch (error) {
    if (error instanceof RuleError) return { ok: false, message: error.message };
    const mapped = options.mapError?.(error);
    if (mapped) return { ok: false, message: mapped };
    // Server log only: never names or phone numbers (PDPA).
    console.error("[action] failed:", error instanceof Error ? `${error.name}: ${error.message}` : error);
    return { ok: false, message: GENERIC_ERROR };
  }
  refresh();
  return { ok: true, message: options.success };
}
