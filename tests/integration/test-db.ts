import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/db/schema";

/**
 * A fresh in-memory Postgres (PGlite) with the real migrations from ./drizzle
 * applied — the same SQL that runs on Neon.
 */
export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: "./drizzle" });
  return { client, db };
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>["db"];
