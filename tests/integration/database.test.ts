import { count, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { customers, users, workOrders, workStatuses } from "@/db/schema";
import { seedReferenceData } from "@/db/seed";
import { allocateWorkOrderNo } from "@/features/work-orders/numbering";
import { WORK_STATUS } from "@/features/work-orders/statuses";
import { createTestDb, type TestDb } from "./test-db";

let db: TestDb;
let close: () => Promise<void>;
let customerId: number;
const userId = "test-user-1";

beforeAll(async () => {
  const testDb = await createTestDb();
  db = testDb.db;
  close = () => testDb.client.close();
  await seedReferenceData(db);
  await db.insert(users).values({ id: userId, name: "ทดสอบ", email: "tester@users.nppool.invalid" });
  const [customer] = await db
    .insert(customers)
    .values({ name: "บริษัท ตัวอย่าง จำกัด", address: "99 ถนนตัวอย่าง", phone: "02-000-0000", taxId: "0000000000000" })
    .returning({ id: customers.id });
  customerId = customer!.id;
});

afterAll(async () => {
  await close();
});

function workOrder(no: string, overrides: Partial<typeof workOrders.$inferInsert> = {}) {
  return { workOrderNo: no, customerId, createdBy: userId, updatedBy: userId, ...overrides };
}

describe("migrations and seed", () => {
  it("seeds the 8 legacy work statuses and is idempotent", async () => {
    await seedReferenceData(db);
    const [{ n }] = await db.select({ n: count() }).from(workStatuses);
    expect(n).toBe(8);
    const [open] = await db.select().from(workStatuses).where(eq(workStatuses.code, 1));
    expect(open?.name).toBe("เปิดใบงาน");
  });
});

describe("work order numbering (ADR-0007)", () => {
  const nov = new Date("2026-11-27T03:00:00Z");

  it("issues consecutive numbers per month and restarts each month", async () => {
    const first = await db.transaction((tx) => allocateWorkOrderNo(tx, nov));
    const second = await db.transaction((tx) => allocateWorkOrderNo(tx, nov));
    const december = await db.transaction((tx) => allocateWorkOrderNo(tx, new Date("2026-11-30T17:30:00Z")));
    expect([first, second, december]).toEqual(["NP2569110001", "NP2569110002", "NP2569120001"]);
  });

  it("gives the number back when the saving transaction rolls back", async () => {
    await expect(
      db.transaction(async (tx) => {
        await allocateWorkOrderNo(tx, nov); // would be ...0003
        throw new Error("save failed");
      }),
    ).rejects.toThrow("save failed");
    const next = await db.transaction((tx) => allocateWorkOrderNo(tx, nov));
    expect(next).toBe("NP2569110003");
  });
});

describe("work order constraints", () => {
  it("accepts a valid work order with defaults", async () => {
    const [row] = await db.insert(workOrders).values(workOrder("TEST-OK")).returning();
    expect(row?.statusCode).toBe(WORK_STATUS.OPEN);
    expect(row?.overnightNights).toBe(0);
  });

  it("rejects a duplicate work order number", async () => {
    await expect(db.insert(workOrders).values(workOrder("TEST-OK"))).rejects.toThrow();
  });

  it("rejects negative money, out-of-range counts and delivery before receive", async () => {
    await expect(db.insert(workOrders).values(workOrder("T-1", { portFee: "-1.00" }))).rejects.toThrow();
    await expect(db.insert(workOrders).values(workOrder("T-2", { overnightNights: 16 }))).rejects.toThrow();
    await expect(
      db.insert(workOrders).values(
        workOrder("T-3", {
          receiveAt: new Date("2026-11-27T08:00:00Z"),
          deliveryAt: new Date("2026-11-27T07:00:00Z"),
        }),
      ),
    ).rejects.toThrow();
  });

  it("ties status 2 (ยกเลิก) to cancelled_at (ADR-0010)", async () => {
    await expect(
      db.insert(workOrders).values(workOrder("T-4", { statusCode: WORK_STATUS.CANCELLED })),
    ).rejects.toThrow();
    await expect(db.insert(workOrders).values(workOrder("T-5", { cancelledAt: new Date() }))).rejects.toThrow();
    const [cancelled] = await db
      .insert(workOrders)
      .values(workOrder("T-6", { statusCode: WORK_STATUS.CANCELLED, cancelledAt: new Date(), cancelledBy: userId }))
      .returning({ id: workOrders.id });
    expect(cancelled?.id).toBeTypeOf("number");
  });

  it("does not allow deleting a customer that has work orders", async () => {
    await expect(db.delete(customers).where(eq(customers.id, customerId))).rejects.toThrow();
    const [{ n }] = await db.select({ n: count() }).from(customers).where(sql`${customers.id} = ${customerId}`);
    expect(n).toBe(1);
  });
});
