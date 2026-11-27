import { eq } from "drizzle-orm";
import { drivers } from "@/db/schema";
import type { AppDatabase } from "@/db/types";
import type { DeleteInput, SetActiveInput } from "@/features/master-data/schemas";
import { assertFound, deleteOrExplain } from "@/features/master-data/service-helpers";
import { sortByThai } from "@/lib/thai-sort";
import type { DriverInput, UpdateDriverInput } from "./schemas";

export type DriverRow = { id: number; firstName: string; lastName: string; phone: string | null; isActive: boolean };

/** Sorted by first name, then last name (BR-MD-03). */
export async function listDrivers(db: AppDatabase): Promise<DriverRow[]> {
  const rows = await db
    .select({
      id: drivers.id,
      firstName: drivers.firstName,
      lastName: drivers.lastName,
      phone: drivers.phone,
      isActive: drivers.isActive,
    })
    .from(drivers);
  return sortByThai(
    rows,
    (row) => row.firstName,
    (row) => row.lastName,
  );
}

function values(input: DriverInput) {
  return { firstName: input.firstName, lastName: input.lastName, phone: input.phone || null };
}

export async function createDriver(db: AppDatabase, actorId: string, input: DriverInput) {
  await db.insert(drivers).values({ ...values(input), createdBy: actorId, updatedBy: actorId });
}

export async function updateDriver(db: AppDatabase, actorId: string, { id, ...input }: UpdateDriverInput) {
  assertFound(
    await db
      .update(drivers)
      .set({ ...values(input), updatedBy: actorId })
      .where(eq(drivers.id, id))
      .returning({ id: drivers.id }),
  );
}

export async function setDriverActive(db: AppDatabase, actorId: string, { id, active }: SetActiveInput) {
  assertFound(
    await db
      .update(drivers)
      .set({ isActive: active, updatedBy: actorId })
      .where(eq(drivers.id, id))
      .returning({ id: drivers.id }),
  );
}

export async function deleteDriver(db: AppDatabase, { id }: DeleteInput) {
  await deleteOrExplain(() => db.delete(drivers).where(eq(drivers.id, id)).returning({ id: drivers.id }));
}
