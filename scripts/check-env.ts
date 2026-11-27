/**
 * First step of vercel-build: stop the deploy when a required variable is
 * missing. Without it, `next build` still passes and sign-in only fails at
 * runtime (Better Auth refuses its default secret in production).
 * Prints variable names only, never values.
 *
 *   npm run env:check
 */
import "./load-env";

const REQUIRED = ["DATABASE_URL", "DATABASE_URL_UNPOOLED", "BETTER_AUTH_SECRET"] as const;
const MIN_SECRET_LENGTH = 32;

const problems = REQUIRED.filter((name) => !process.env[name]?.trim()).map((name) => `${name} is not set`);

const secret = process.env.BETTER_AUTH_SECRET?.trim();
if (secret && secret.length < MIN_SECRET_LENGTH) {
  problems.push(`BETTER_AUTH_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
}

if (problems.length > 0) {
  console.error(`env check failed:\n- ${problems.join("\n- ")}\nSee docs/runbook/01-vercel-neon-setup.md`);
  process.exit(1);
}
console.log("env check: required variables are set");
