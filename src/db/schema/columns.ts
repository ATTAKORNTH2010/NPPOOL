import { boolean, integer, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";

/** Fresh builders per table — Drizzle column builders must not be shared. */
export function idColumn() {
  return integer("id").primaryKey().generatedAlwaysAsIdentity();
}

export function isActiveColumn() {
  return boolean("is_active").notNull().default(true);
}

/** created_at / updated_at (timestamptz) + created_by / updated_by → users.id */
export function auditColumns() {
  return {
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdBy: text("created_by").references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
  };
}
