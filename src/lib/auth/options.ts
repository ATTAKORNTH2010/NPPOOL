/**
 * Better Auth options shared by the app, scripts, tests and the schema
 * generator (ADR-0004). The database adapter is added in ./config.ts.
 */
import type { BetterAuthOptions } from "better-auth";
import { admin, username } from "better-auth/plugins";
import { ac, roles } from "./roles";
import { authHooks, type AuthEventSink } from "./hooks";
import { SESSION_EXPIRES_IN, SESSION_UPDATE_AGE, sessionDatabaseHooks } from "./session-policy";

/** Admins create every account; Better Auth still needs a unique email. */
export const SYNTHETIC_EMAIL_DOMAIN = "users.nppool.invalid";

export function syntheticEmail(normalizedUsername: string): string {
  return `${normalizedUsername}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

/** Origins allowed to call the auth API: the configured URL plus this Vercel deployment. */
export function trustedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const origins = new Set<string>();
  if (env.BETTER_AUTH_URL) origins.add(new URL(env.BETTER_AUTH_URL).origin);
  for (const host of [env.VERCEL_URL, env.VERCEL_BRANCH_URL, env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (host) origins.add(`https://${host}`);
  }
  if (env.NODE_ENV !== "production") origins.add("http://localhost:3000");
  return [...origins];
}

/** BETTER_AUTH_URL, else the Vercel URL people actually open for this environment. */
export function baseURL(env: NodeJS.ProcessEnv = process.env): string {
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL;
  const host =
    env.VERCEL_ENV === "production"
      ? (env.VERCEL_PROJECT_PRODUCTION_URL ?? env.VERCEL_URL)
      : (env.VERCEL_BRANCH_URL ?? env.VERCEL_URL);
  return host ? `https://${host}` : "http://localhost:3000";
}

/** onAuthEvent receives sign-in / sign-out events for the activity log (ADR-0012). */
export function buildAuthOptions(env: NodeJS.ProcessEnv = process.env, onAuthEvent?: AuthEventSink) {
  return {
    appName: "NP Pool",
    baseURL: baseURL(env),
    trustedOrigins: trustedOrigins(env),
    emailAndPassword: {
      enabled: true,
      // No self sign-up: only admins create accounts (S1, AUTH-06).
      disableSignUp: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    session: {
      // 30 minutes, extended while the user keeps working (legacy parity, BR-AU-03).
      expiresIn: SESSION_EXPIRES_IN,
      updateAge: SESSION_UPDATE_AGE,
    },
    // Same 30-minute rule when "remember me" is unticked (see ./session-policy.ts).
    databaseHooks: sessionDatabaseHooks,
    hooks: authHooks(onAuthEvent),
    rateLimit: {
      enabled: true,
      // In-memory limits do not work across serverless instances.
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/username": { window: 60, max: 5 },
      },
    },
    user: {
      additionalFields: {
        phone: { type: "string", required: false, input: false },
      },
    },
    plugins: [
      username(),
      admin({
        ac,
        roles,
        adminRoles: ["admin"],
        // Least privilege if a role is ever omitted.
        defaultRole: "accounting",
        bannedUserMessage: "บัญชีนี้ถูกระงับการใช้งาน",
      }),
    ],
  } satisfies BetterAuthOptions;
}
