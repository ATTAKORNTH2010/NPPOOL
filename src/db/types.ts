import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT, PgTransaction } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

export type AppSchema = typeof schema;

/** Any Drizzle Postgres database with the app schema (node-postgres in the app, PGlite in tests). */
export type AppDatabase = PgDatabase<PgQueryResultHKT, AppSchema>;

export type AppTransaction = PgTransaction<PgQueryResultHKT, AppSchema, ExtractTablesWithRelations<AppSchema>>;

export type DbOrTx = AppDatabase | AppTransaction;
