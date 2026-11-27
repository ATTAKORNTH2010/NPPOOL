/**
 * Idempotent seed data (ADR-0011). Safe to run on every deployment.
 */
import { sql } from "drizzle-orm";
import { WORK_STATUS_SEED } from "@/features/work-orders/statuses";
import { vehicleTypes, workStatuses } from "./schema";
import type { AppDatabase } from "./types";

/** Work statuses — required before any work order can be saved (FK + default 1). */
export async function seedReferenceData(db: AppDatabase): Promise<void> {
  await db
    .insert(workStatuses)
    .values(WORK_STATUS_SEED.map((s) => ({ code: s.code, name: s.name, sortOrder: s.sortOrder })))
    .onConflictDoUpdate({
      target: workStatuses.code,
      set: { name: sql`excluded.name`, sortOrder: sql`excluded.sort_order` },
    });
}

/**
 * Placeholder vehicle types for local development only. The real list comes
 * from the user (Q22) — never run this against production.
 */
export const SAMPLE_VEHICLE_TYPES = [
  { code: "SAMPLE-4W", name: "รถ 4 ล้อ (ตัวอย่าง)", sortOrder: 1 },
  { code: "SAMPLE-6W", name: "รถ 6 ล้อ (ตัวอย่าง)", sortOrder: 2 },
  { code: "SAMPLE-10W", name: "รถ 10 ล้อ (ตัวอย่าง)", sortOrder: 3 },
] as const;

export async function seedSampleVehicleTypes(db: AppDatabase): Promise<void> {
  await db
    .insert(vehicleTypes)
    .values(SAMPLE_VEHICLE_TYPES.map((v) => ({ ...v })))
    .onConflictDoNothing({ target: vehicleTypes.code });
}
