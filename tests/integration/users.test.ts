import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { users } from "@/db/schema";
import { RuleError } from "@/lib/action-result";
import { createAuth, type Auth } from "@/lib/auth/config";
import { syntheticEmail } from "@/lib/auth/options";
import * as service from "@/features/users/service";
import { createTestDb, type TestDb } from "./test-db";

// AUTH-06 · design 02 section 3.7: admin user management and its safeguards.
const ADMIN_PASSWORD = "Admin-Pass1";
const MAKER_PASSWORD = "Maker-Pass1";

let db: TestDb;
let auth: Auth;
let close: () => Promise<void>;
let adminId: string;
let ctx: service.UsersContext;

async function signIn(username: string, password: string) {
  const { headers } = await auth.api.signInUsername({ body: { username, password }, returnHeaders: true });
  return new Headers({ cookie: headers.getSetCookie().map((c) => c.split(";")[0]).join("; ") });
}

async function idOf(username: string) {
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
  if (!row) throw new Error(`no user ${username}`);
  return row.id;
}

beforeAll(async () => {
  const testDb = await createTestDb();
  db = testDb.db;
  close = () => testDb.client.close();
  auth = createAuth(db);
  // First admin, as admin:ensure creates it during the build.
  await auth.api.createUser({
    body: {
      email: syntheticEmail("boss"),
      password: ADMIN_PASSWORD,
      name: "ผู้ดูแล หลัก",
      role: "admin",
      data: { username: "boss", displayUsername: "boss" },
    },
  });
  adminId = await idOf("boss");
  ctx = { auth, db, headers: await signIn("boss", ADMIN_PASSWORD), actorId: adminId };
});

afterAll(async () => {
  await close();
});

describe("user management service", () => {
  it("creates a user with username, phone and role, and lists them", async () => {
    await service.createUser(ctx, {
      username: "Maker01",
      name: "สมหญิง ทดสอบ",
      phone: "081-234-5678",
      role: "maker",
      password: MAKER_PASSWORD,
    });
    const list = await service.listUsers(db);
    expect(list.find((u) => u.username === "Maker01")).toMatchObject({
      name: "สมหญิง ทดสอบ",
      phone: "081-234-5678",
      role: "maker",
      banned: false,
    });
    expect(await signIn("maker01", MAKER_PASSWORD)).toBeTruthy();
  });

  it("rejects a username that already exists in any letter case", async () => {
    await expect(
      service.createUser(ctx, { username: "MAKER01", name: "ซ้ำ", phone: "", role: "maker", password: MAKER_PASSWORD }),
    ).rejects.toThrow(new RuleError("ชื่อผู้ใช้นี้มีอยู่แล้ว"));
  });

  it("changes a role", async () => {
    const makerId = await idOf("maker01");
    await service.changeRole(ctx, { userId: makerId, role: "accounting" });
    const [row] = await db.select({ role: users.role }).from(users).where(eq(users.id, makerId));
    expect(row?.role).toBe("accounting");
    await service.changeRole(ctx, { userId: makerId, role: "maker" });
  });

  it("does not let the last active admin lose the admin role", async () => {
    await expect(service.changeRole(ctx, { userId: adminId, role: "maker" })).rejects.toThrow(
      new RuleError("ต้องมีผู้ดูแลระบบที่ใช้งานได้อย่างน้อย 1 คน"),
    );
  });

  it("does not let an admin ban themselves", async () => {
    await expect(service.banUser(ctx, { userId: adminId })).rejects.toThrow(
      new RuleError("ระงับบัญชีของตัวเองไม่ได้"),
    );
  });

  it("bans a user, signs them out, and unbans them", async () => {
    const makerId = await idOf("maker01");
    const makerHeaders = await signIn("maker01", MAKER_PASSWORD);
    expect(await auth.api.getSession({ headers: makerHeaders })).not.toBeNull();

    await service.banUser(ctx, { userId: makerId });
    expect(await auth.api.getSession({ headers: makerHeaders })).toBeNull();
    await expect(signIn("maker01", MAKER_PASSWORD)).rejects.toThrow();

    await service.unbanUser(ctx, { userId: makerId });
    expect(await signIn("maker01", MAKER_PASSWORD)).toBeTruthy();
  });

  it("sets a new password and signs the user out everywhere", async () => {
    const makerId = await idOf("maker01");
    const makerHeaders = await signIn("maker01", MAKER_PASSWORD);

    await service.resetPassword(ctx, { userId: makerId, password: "New-Maker-Pass2" });
    expect(await auth.api.getSession({ headers: makerHeaders })).toBeNull();
    await expect(signIn("maker01", MAKER_PASSWORD)).rejects.toThrow();
    expect(await signIn("maker01", "New-Maker-Pass2")).toBeTruthy();
  });

  it("allows demoting or banning an admin while another active admin remains", async () => {
    await service.createUser(ctx, {
      username: "deputy",
      name: "ผู้ดูแล สำรอง",
      phone: "",
      role: "admin",
      password: ADMIN_PASSWORD,
    });
    const deputyId = await idOf("deputy");
    await service.banUser(ctx, { userId: deputyId });
    // The banned deputy does not count, so the actor is still the last active admin.
    await expect(service.changeRole(ctx, { userId: adminId, role: "accounting" })).rejects.toThrow(RuleError);

    await service.unbanUser(ctx, { userId: deputyId });
    await service.changeRole(ctx, { userId: deputyId, role: "accounting" });
    const [row] = await db.select({ role: users.role }).from(users).where(eq(users.id, deputyId));
    expect(row?.role).toBe("accounting");
  });

  it("is refused by Better Auth for a non-admin session", async () => {
    const makerCtx = { ...ctx, headers: await signIn("maker01", "New-Maker-Pass2"), actorId: await idOf("maker01") };
    await expect(
      service.createUser(makerCtx, { username: "intruder", name: "ไม่ควรได้", phone: "", role: "admin", password: ADMIN_PASSWORD }),
    ).rejects.toThrow();
    expect(await db.select().from(users).where(eq(users.username, "intruder"))).toHaveLength(0);
  });
});
