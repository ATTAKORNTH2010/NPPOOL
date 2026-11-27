/**
 * Better Auth hooks: the 30-minute sliding session (./session-policy.ts) and
 * sign-in / sign-out events for the activity log (ADR-0012). The event sink is
 * optional so scripts and the schema generator need no database for it.
 */
import { createAuthMiddleware, getSessionFromCtx, isAPIError } from "better-auth/api";
import { slideUnrememberedSession, type AuthHookContext } from "./session-policy";

export type AuthEvent = {
  kind: "login" | "loginFailed" | "logout";
  userId: string | null;
  /** Only for loginFailed: what was typed as the username. */
  username: string | null;
  headers: Headers | null;
};

export type AuthEventSink = (event: AuthEvent) => Promise<void>;

async function notify(sink: AuthEventSink, event: AuthEvent) {
  try {
    await sink(event);
  } catch (error) {
    // Never block a sign-in or sign-out because the log could not be written.
    console.error("[auth] activity not recorded:", error instanceof Error ? error.name : "unknown error");
  }
}

function typedUsername(ctx: AuthHookContext): string | null {
  const body: unknown = ctx.body;
  return body && typeof body === "object" && "username" in body && typeof body.username === "string"
    ? body.username
    : null;
}

export function authHooks(onEvent?: AuthEventSink) {
  return {
    before: createAuthMiddleware(async (ctx) => {
      if (!onEvent || ctx.path !== "/sign-out") return;
      const session = await getSessionFromCtx(ctx).catch(() => null);
      if (session) {
        await notify(onEvent, { kind: "logout", userId: session.user.id, username: null, headers: ctx.headers ?? null });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      await slideUnrememberedSession(ctx);
      if (!onEvent || ctx.path !== "/sign-in/username") return;
      const created = ctx.context.newSession;
      if (created) {
        await notify(onEvent, { kind: "login", userId: created.user.id, username: null, headers: ctx.headers ?? null });
      } else if (isAPIError(ctx.context.returned)) {
        await notify(onEvent, { kind: "loginFailed", userId: null, username: typedUsername(ctx), headers: ctx.headers ?? null });
      }
    }),
  };
}
