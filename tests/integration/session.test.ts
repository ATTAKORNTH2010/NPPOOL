import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { sessions } from "@/db/schema";
import { createAuth, type Auth } from "@/lib/auth/config";
import { syntheticEmail } from "@/lib/auth/options";
import { createTestDb, type TestDb } from "./test-db";

// BR-AU-03: 30 minutes, renewed while in use, with or without "remember me".
const ORIGIN = "http://localhost:3000";
const MINUTE = 60_000;
const T0 = new Date("2026-11-27T02:00:00.000Z").getTime();
const password = "Np-Pool2026";

let db: TestDb;
let auth: Auth;
let close: () => Promise<void>;

beforeAll(async () => {
  const testDb = await createTestDb();
  db = testDb.db;
  close = () => testDb.client.close();
  auth = createAuth(db);
  await auth.api.createUser({
    body: {
      email: syntheticEmail("session01"),
      password,
      name: "ทดสอบ เซสชัน",
      role: "maker",
      data: { username: "session01" },
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(async () => {
  await close();
});

function at(offsetMs: number) {
  vi.setSystemTime(T0 + offsetMs);
}

function sessionCookie(setCookies: string[]) {
  return setCookies.find((cookie) => cookie.includes("session_token="));
}

async function signIn(rememberMe: boolean) {
  const response = await auth.handler(
    new Request(`${ORIGIN}/api/auth/sign-in/username`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN },
      body: JSON.stringify({ username: "session01", password, rememberMe }),
    }),
  );
  expect(response.status).toBe(200);
  const setCookies = response.headers.getSetCookie();
  const { token } = (await response.json()) as { token: string };
  return { setCookies, token, cookie: setCookies.map((c) => c.split(";")[0]).join("; ") };
}

/** What the keep-alive ping does: goes through the Route Handler, which can set cookies. */
function pingRouteHandler(cookie: string) {
  return auth.handler(new Request(`${ORIGIN}/api/auth/get-session`, { headers: { cookie } }));
}

/** What a Server Component does (src/lib/dal.ts). */
function readLikeDal(cookie: string) {
  return auth.api.getSession({ headers: new Headers({ cookie }), query: { disableRefresh: true } });
}

async function expiresAt(token: string) {
  const [row] = await db.select({ expiresAt: sessions.expiresAt }).from(sessions).where(eq(sessions.token, token));
  return row?.expiresAt.getTime();
}

describe("30-minute sliding session (BR-AU-03)", () => {
  it("renews a remembered session through the Route Handler and re-issues the cookie", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    at(0);
    const { setCookies, cookie, token } = await signIn(true);
    expect(sessionCookie(setCookies)).toMatch(/Max-Age=1800/i);
    expect(await expiresAt(token)).toBe(T0 + 30 * MINUTE);

    // A Server Component read must not move the row: it cannot move the cookie.
    at(6 * MINUTE);
    expect(await readLikeDal(cookie)).not.toBeNull();
    expect(await expiresAt(token)).toBe(T0 + 30 * MINUTE);

    const response = await pingRouteHandler(cookie);
    expect(response.status).toBe(200);
    expect(sessionCookie(response.headers.getSetCookie())).toMatch(/Max-Age=1800/i);
    expect(await expiresAt(token)).toBe(T0 + 36 * MINUTE);

    at(36 * MINUTE + 1000);
    expect(await readLikeDal(cookie)).toBeNull();
  });

  it("gives an unticked sign-in a browser-session cookie and the same 30 minutes", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    at(0);
    const { setCookies, cookie, token } = await signIn(false);
    expect(sessionCookie(setCookies)).not.toMatch(/Max-Age|Expires/i);
    // Better Auth alone would give this session 24 hours.
    expect(await expiresAt(token)).toBe(T0 + 30 * MINUTE);

    // Within updateAge: no write.
    at(3 * MINUTE);
    expect(await readLikeDal(cookie)).not.toBeNull();
    expect(await expiresAt(token)).toBe(T0 + 30 * MINUTE);

    // After updateAge any session check slides it, even from a Server Component.
    at(6 * MINUTE);
    expect(await readLikeDal(cookie)).not.toBeNull();
    expect(await expiresAt(token)).toBe(T0 + 36 * MINUTE);

    at(20 * MINUTE);
    expect((await pingRouteHandler(cookie)).status).toBe(200);
    expect(await expiresAt(token)).toBe(T0 + 50 * MINUTE);

    // Idle past the window → signed out.
    at(50 * MINUTE + 1000);
    expect(await readLikeDal(cookie)).toBeNull();
  });
});
