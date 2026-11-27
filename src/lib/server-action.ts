import "server-only";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import type { z } from "zod";
import { db } from "@/db/client";
import type { AppDatabase } from "@/db/types";
import type { ActivityAction, ActivityModule } from "@/features/activity/catalog";
import { logActivity } from "@/features/activity/log";
import { GENERIC_ERROR, INVALID_INPUT, RuleError, type ActionResult } from "@/lib/action-result";
import { requirePermission } from "@/lib/dal";
import type { Permission } from "@/lib/permissions";

export type ActionContext = { db: AppDatabase; actorId: string; headers: Headers };

/** How a successful action appears in the activity log (ADR-0012). */
export type ActionActivity<T, R> = {
  module: ActivityModule;
  action: ActivityAction | ((data: T, result: R) => ActivityAction);
  /** Shown to the admin; defaults to the success message. */
  detail?: (data: T, result: R) => string;
  entityId?: (data: T, result: R) => string | number | null;
};

/**
 * The one way Server Actions change data (ADR-0009, design 02 section 4):
 * permission first (it may redirect), then Zod validation, then the change,
 * then refresh() so the page shows the new data, and an activity-log entry.
 * Only RuleError messages and messages from `mapError` reach the user;
 * anything else is logged.
 */
export async function runAction<T, R = void>(
  options: {
    permission: Permission;
    schema: z.ZodType<T>;
    input: unknown;
    success: string | ((result: R) => string);
    // NoInfer: T comes from the schema and R from `change`, never from here.
    activity: ActionActivity<NoInfer<T>, NoInfer<R>>;
    mapError?: (error: unknown) => string | undefined;
  },
  change: (ctx: ActionContext, data: T) => Promise<R>,
): Promise<ActionResult<R>> {
  const actor = await requirePermission(options.permission);
  const parsed = options.schema.safeParse(options.input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      // Dotted path, e.g. "vehicles.0.quantity", which react-hook-form understands.
      const key = issue.path.length > 0 ? issue.path.map(String).join(".") : "form";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { ok: false, message: INVALID_INPUT, fieldErrors };
  }
  const requestHeaders = await headers();
  let result: R;
  try {
    result = await change({ db, actorId: actor.id, headers: requestHeaders }, parsed.data);
  } catch (error) {
    if (error instanceof RuleError) return { ok: false, message: error.message };
    const mapped = options.mapError?.(error);
    if (mapped) return { ok: false, message: mapped };
    // Server log only: never names or phone numbers (PDPA).
    console.error("[action] failed:", error instanceof Error ? `${error.name}: ${error.message}` : error);
    return { ok: false, message: GENERIC_ERROR };
  }
  refresh();
  const message = typeof options.success === "function" ? options.success(result) : options.success;
  const { activity } = options;
  logActivity(
    {
      userId: actor.id,
      module: activity.module,
      action: typeof activity.action === "function" ? activity.action(parsed.data, result) : activity.action,
      entityId: activity.entityId?.(parsed.data, result) ?? null,
      detail: activity.detail?.(parsed.data, result) ?? message,
    },
    requestHeaders,
  );
  return { ok: true, message, data: result };
}
