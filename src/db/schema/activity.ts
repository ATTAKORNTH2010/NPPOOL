/**
 * Activity log (ADR-0012): who used which function and when — sign-in/out,
 * page views and every change made through a Server Action.
 */
import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    // Null only for a failed sign-in with an unknown username.
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    /** Function, e.g. "workOrders" (src/features/activity/catalog.ts). */
    module: text("module").notNull(),
    /** What happened, e.g. "view", "create", "login". */
    action: text("action").notNull(),
    entityId: text("entity_id"),
    /** Short Thai description shown to the admin. */
    detail: text("detail"),
    path: text("path"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (t) => [
    index("activity_logs_occurred_at_idx").on(t.occurredAt),
    index("activity_logs_user_id_occurred_at_idx").on(t.userId, t.occurredAt),
    index("activity_logs_module_occurred_at_idx").on(t.module, t.occurredAt),
  ],
);
