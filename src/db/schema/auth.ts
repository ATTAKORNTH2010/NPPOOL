/**
 * Better Auth tables (ADR-0004). Generated with `npx auth@1.7.28 generate
 * --adapter drizzle --dialect pg` and adapted to the project conventions
 * (docs/design/03-database.md): plural table names (`user` is a reserved
 * word in Postgres) and timestamptz columns. Property names must stay as
 * Better Auth field names; only SQL names may change.
 */
import { relations } from "drizzle-orm";
import { bigint, boolean, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const tz = (name: string) => timestamp(name, { withTimezone: true });

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // Synthetic for username-only accounts: <username>@users.nppool.invalid
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: tz("created_at").defaultNow().notNull(),
  updatedAt: tz("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  // username plugin (stored lower-case)
  username: text("username").unique(),
  displayUsername: text("display_username"),
  // admin plugin
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: tz("ban_expires"),
  // additional field
  phone: text("phone"),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: tz("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: tz("created_at").defaultNow().notNull(),
    updatedAt: tz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: tz("access_token_expires_at"),
    refreshTokenExpiresAt: tz("refresh_token_expires_at"),
    scope: text("scope"),
    // password hash for providerId = "credential"
    password: text("password"),
    createdAt: tz("created_at").defaultNow().notNull(),
    updatedAt: tz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("accounts_user_id_idx").on(table.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: tz("expires_at").notNull(),
    createdAt: tz("created_at").defaultNow().notNull(),
    updatedAt: tz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

export const rateLimits = pgTable("rate_limits", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));
