import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import * as schema from "@/db/schema";
import type { AppDatabase } from "@/db/types";
import { recordAuthEvents } from "./activity";
import { buildAuthOptions } from "./options";

/**
 * Creates a Better Auth instance on the given database. The app uses the
 * node-postgres database (./index.ts); scripts and tests pass their own.
 * `nextCookies()` must stay last and is a no-op outside a Next.js request.
 */
export function createAuth(db: AppDatabase) {
  const options = buildAuthOptions(process.env, recordAuthEvents(db));
  return betterAuth({
    ...options,
    database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
    plugins: [...options.plugins, nextCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
