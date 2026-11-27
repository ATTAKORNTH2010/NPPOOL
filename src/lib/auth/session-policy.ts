/**
 * Session rule BR-AU-03: a session lasts 30 minutes and is renewed while the
 * user keeps working, whether or not "จดจำการเข้าสู่ระบบ" is ticked. The tick
 * only decides whether the cookie outlives the browser.
 *
 * Better Auth handles the ticked case itself. For an unticked sign-in it sets a
 * browser-session cookie but a fixed 24-hour session row that it never renews.
 * The two hooks below fix that:
 *  1. every new session is capped at SESSION_EXPIRES_IN, and
 *  2. on each session check, an unticked session slides forward once
 *     SESSION_UPDATE_AGE has passed, as Better Auth does for ticked ones.
 *     Its cookie has no Max-Age, so only the row has to move. This also works
 *     from Server Components, which cannot set cookies.
 *
 * Ticked sessions carry a Max-Age that only a Route Handler or Server Action
 * can renew, so the app layout pings /api/auth/get-session while the user is
 * active (components/layout/session-keep-alive.tsx).
 */
import type { BetterAuthOptions } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";

export const SESSION_EXPIRES_IN = 60 * 30;
export const SESSION_UPDATE_AGE = 60 * 5;

export const sessionDatabaseHooks: NonNullable<BetterAuthOptions["databaseHooks"]> = {
  session: {
    create: {
      async before(session) {
        const latest = Date.now() + SESSION_EXPIRES_IN * 1000;
        if (session.expiresAt.getTime() <= latest) return;
        return { data: { ...session, expiresAt: new Date(latest) } };
      },
    },
  },
};

type SessionRef = { token: string; expiresAt: Date };

function toSessionRef(value: unknown): SessionRef | null {
  if (!value || typeof value !== "object" || !("session" in value)) return null;
  const session = value.session;
  if (!session || typeof session !== "object") return null;
  const { token, expiresAt } = session as { token?: unknown; expiresAt?: unknown };
  if (typeof token !== "string") return null;
  const at = expiresAt instanceof Date ? expiresAt : typeof expiresAt === "string" ? new Date(expiresAt) : null;
  return at && !Number.isNaN(at.getTime()) ? { token, expiresAt: at } : null;
}

export const slideUnrememberedSession = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== "/get-session") return;
  const session = toSessionRef(ctx.context.session) ?? toSessionRef(ctx.context.returned);
  if (!session) return;

  const unremembered = await ctx.getSignedCookie(ctx.context.authCookies.dontRememberToken.name, ctx.context.secret);
  if (!unremembered) return;

  const now = Date.now();
  const renewedAt = session.expiresAt.getTime() - SESSION_EXPIRES_IN * 1000;
  if (now - renewedAt < SESSION_UPDATE_AGE * 1000) return;

  await ctx.context.internalAdapter.updateSession(session.token, {
    expiresAt: new Date(now + SESSION_EXPIRES_IN * 1000),
    updatedAt: new Date(now),
  });
});
