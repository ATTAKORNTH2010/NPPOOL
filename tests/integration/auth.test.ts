import { asc, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { activityLogs, users } from "@/db/schema";
import { createAuth, type Auth } from "@/lib/auth/config";
import { syntheticEmail } from "@/lib/auth/options";
import { createTestDb, type TestDb } from "./test-db";

// ADR-0004: username login, admin-created accounts, no self sign-up.
let db: TestDb;
let auth: Auth;
let close: () => Promise<void>;
const password = "Np-Pool2026";

beforeAll(async () => {
  const testDb = await createTestDb();
  db = testDb.db;
  close = () => testDb.client.close();
  auth = createAuth(db);
  await auth.api.createUser({
    body: {
      email: syntheticEmail("maker01"),
      password,
      name: "สมชาย ตัวอย่าง",
      role: "maker",
      data: { username: "maker01", displayUsername: "Maker01" },
    },
  });
});

afterAll(async () => {
  await close();
});

describe("Better Auth setup", () => {
  it("stores the admin-created user with username, role and synthetic email", async () => {
    const [user] = await db.select().from(users).where(eq(users.username, "maker01"));
    expect(user).toMatchObject({
      username: "maker01",
      displayUsername: "Maker01",
      role: "maker",
      email: "maker01@users.nppool.invalid",
      banned: false,
    });
  });

  it("signs in with the username in any letter case", async () => {
    const result = await auth.api.signInUsername({ body: { username: "MAKER01", password } });
    expect(result?.token).toBeTruthy();
    expect(result?.user.id).toBeTruthy();
  });

  it("rejects a wrong password", async () => {
    await expect(auth.api.signInUsername({ body: { username: "maker01", password: "Wrong-Pass1" } })).rejects.toThrow();
  });

  it("has self sign-up disabled", async () => {
    await expect(
      auth.api.signUpEmail({ body: { email: "someone@example.com", password, name: "ไม่ควรสมัครได้" } }),
    ).rejects.toThrow();
  });

  it("blocks sign-in for a banned user", async () => {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.username, "maker01"));
    await db.update(users).set({ banned: true }).where(eq(users.id, user!.id));
    await expect(auth.api.signInUsername({ body: { username: "maker01", password } })).rejects.toThrow();
    await db.update(users).set({ banned: false }).where(eq(users.id, user!.id));
  });
});

describe("activity log of sign-in and sign-out (ADR-0012)", () => {
  const ORIGIN = "http://localhost:3000";
  const post = (path: string, body: unknown, cookie?: string) =>
    auth.handler(
      new Request(`${ORIGIN}/api/auth${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: ORIGIN,
          "user-agent": "vitest",
          "x-forwarded-for": "203.0.113.7, 10.0.0.1",
          ...(cookie ? { cookie } : {}),
        },
        body: JSON.stringify(body),
      }),
    );

  it("records sign-in, both kinds of failed sign-in and sign-out, without storing unknown usernames", async () => {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.username, "maker01"));
    await db.delete(activityLogs);

    const signedIn = await post("/sign-in/username", { username: "maker01", password });
    expect(signedIn.status).toBe(200);
    const cookie = signedIn.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
    expect((await post("/sign-in/username", { username: "maker01", password: "Wrong-Pass1" })).status).toBe(401);
    // Not a valid username at all (422) — as when someone types a password into the username box.
    expect((await post("/sign-in/username", { username: "Secret-Typed-1", password: "x" })).status).toBe(422);
    expect((await post("/sign-out", {}, cookie)).status).toBe(200);

    const rows = await db
      .select({
        userId: activityLogs.userId,
        module: activityLogs.module,
        action: activityLogs.action,
        detail: activityLogs.detail,
        ipAddress: activityLogs.ipAddress,
        userAgent: activityLogs.userAgent,
      })
      .from(activityLogs)
      .orderBy(asc(activityLogs.id));
    const meta = { module: "auth", ipAddress: "203.0.113.7", userAgent: "vitest" };
    expect(rows).toEqual([
      { ...meta, userId: user!.id, action: "login", detail: null },
      { ...meta, userId: user!.id, action: "loginFailed", detail: "รหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับ" },
      { ...meta, userId: null, action: "loginFailed", detail: "ไม่พบชื่อผู้ใช้ที่กรอก" },
      { ...meta, userId: user!.id, action: "logout", detail: null },
    ]);
    expect(JSON.stringify(rows)).not.toContain("Secret-Typed-1");
  });
});
