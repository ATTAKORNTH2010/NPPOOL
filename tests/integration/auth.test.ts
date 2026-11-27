import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { users } from "@/db/schema";
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
