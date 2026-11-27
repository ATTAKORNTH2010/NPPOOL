import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { users } from "@/db/schema";
import {
  listActivity,
  parseActivityFilters,
  recordActivity,
  summarizeActivity,
} from "@/features/activity/service";
import { createTestDb, type TestDb } from "./test-db";

// ADR-0012: the admin sees who used which function and when.
let db: TestDb;
let close: () => Promise<void>;

beforeAll(async () => {
  const testDb = await createTestDb();
  db = testDb.db;
  close = () => testDb.client.close();
  await db.insert(users).values([
    { id: "u-b", name: "ขวัญใจ บัญชี", email: "b@users.nppool.invalid", displayUsername: "khwanjai" },
    { id: "u-a", name: "กมล ผู้ทำใบงาน", email: "a@users.nppool.invalid", displayUsername: "kamon" },
  ]);
  await recordActivity(db, {
    userId: "u-a",
    module: "workOrders",
    action: "view",
    detail: "รายการใบงาน",
    path: "/work-orders",
    occurredAt: new Date("2026-11-26T02:00:00Z"),
  });
  await recordActivity(db, {
    userId: "u-a",
    module: "workOrders",
    action: "create",
    entityId: 5,
    detail: "สร้างใบงาน NP2569110001",
    occurredAt: new Date("2026-11-26T17:30:00Z"), // 27 Nov 00:30 in Thai time
  });
  await recordActivity(db, {
    userId: "u-b",
    module: "customers",
    action: "update",
    ipAddress: "203.0.113.9",
    occurredAt: new Date("2026-11-27T03:00:00Z"),
  });
  await recordActivity(db, {
    userId: null,
    module: "auth",
    action: "loginFailed",
    detail: "ไม่พบชื่อผู้ใช้ที่กรอก",
    occurredAt: new Date("2026-11-27T04:00:00Z"),
  });
});

afterAll(async () => {
  await close();
});

describe("activity log", () => {
  it("lists entries newest first with the user's name", async () => {
    const { rows, total } = await listActivity(db, parseActivityFilters({}), 1);
    expect(total).toBe(4);
    expect(rows.map((row) => [row.userName, row.module, row.action])).toEqual([
      [null, "auth", "loginFailed"],
      ["ขวัญใจ บัญชี", "customers", "update"],
      ["กมล ผู้ทำใบงาน", "workOrders", "create"],
      ["กมล ผู้ทำใบงาน", "workOrders", "view"],
    ]);
    expect(rows[2]).toMatchObject({ entityId: "5", username: "kamon" });
  });

  it("filters by user, function, action and whole days in Thai time", async () => {
    const list = async (params: Record<string, string>) =>
      (await listActivity(db, parseActivityFilters(params), 1)).rows.map((row) => row.action);
    expect(await list({ user: "u-a" })).toEqual(["create", "view"]);
    expect(await list({ module: "customers" })).toEqual(["update"]);
    expect(await list({ action: "loginFailed" })).toEqual(["loginFailed"]);
    expect(await list({ from: "2026-11-27", to: "2026-11-27" })).toEqual(["loginFailed", "update", "create"]);
    expect(await list({ to: "2026-11-26" })).toEqual(["view"]);
  });

  it("ignores unknown filter values instead of failing", () => {
    expect(parseActivityFilters({ module: "bogus", action: "view", from: "2026-02-30", user: "x y" })).toEqual({
      userId: null,
      module: null,
      action: "view",
      from: null,
      to: null,
    });
    expect(parseActivityFilters({ from: "2026-11-30", to: "2026-11-01" })).toMatchObject({
      from: "2026-11-01",
      to: "2026-11-30",
    });
  });

  it("summarises how often each user used each function", async () => {
    const summary = await summarizeActivity(db, parseActivityFilters({}));
    expect(summary.map((row) => [row.userName, row.counts, row.total])).toEqual([
      ["กมล ผู้ทำใบงาน", { workOrders: 2 }, 2],
      ["ขวัญใจ บัญชี", { customers: 1 }, 1],
    ]);
    expect(summary[0]?.lastAt?.toISOString()).toBe("2026-11-26T17:30:00.000Z");
  });

  it("cuts very long text instead of failing", async () => {
    await recordActivity(db, { userId: "u-b", module: "workOrders", action: "delete", detail: "ก".repeat(600) });
    const [row] = (await listActivity(db, parseActivityFilters({ action: "delete" }), 1)).rows;
    expect(row?.detail).toHaveLength(500);
  });
});
