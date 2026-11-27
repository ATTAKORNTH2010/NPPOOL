/**
 * Database client for the app (ADR-0003): node-postgres Pool on Neon's pooled
 * connection string, attached to Vercel Fluid compute so idle connections are
 * closed before an instance is suspended. The pool connects lazily, so
 * importing this module during `next build` does not open a connection.
 */
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 5_000,
});

attachDatabasePool(pool);

export const db = drizzle({ client: pool, schema });
