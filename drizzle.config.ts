import { defineConfig } from "drizzle-kit";

// Local: read .env.local if present. On Vercel the variables come from the environment.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — fine on Vercel and in CI
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  // Migrations need a direct (unpooled) connection.
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
