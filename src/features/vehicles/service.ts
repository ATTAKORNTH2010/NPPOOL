import { eq } from "drizzle-orm";
import { vehicles, vehicleTypes } from "@/db/schema";
import type { AppDatabase } from "@/db/types";
import type { DeleteInput, SetActiveInput } from "@/features/master-data/schemas";
import { assertFound, deleteOrExplain, withUniqueMessage } from "@/features/master-data/service-helpers";
import { assertUsableVehicleType } from "@/features/vehicle-types/service";
import { sortByThai } from "@/lib/thai-sort";
import type { UpdateVehicleInput, VehicleInput } from "./schemas";

export type VehicleRow = {
  id: number;
  plateNo: string;
  vehicleTypeId: number;
  vehicleTypeName: string;
  isActive: boolean;
};

const DUPLICATE_PLATE = "ทะเบียนนี้มีอยู่แล้ว";

/** Sorted by plate number (BR-MD-02). */
export async function listVehicles(db: AppDatabase): Promise<VehicleRow[]> {
  const rows = await db
    .select({
      id: vehicles.id,
      plateNo: vehicles.plateNo,
      vehicleTypeId: vehicles.vehicleTypeId,
      vehicleTypeName: vehicleTypes.name,
      isActive: vehicles.isActive,
    })
    .from(vehicles)
    .innerJoin(vehicleTypes, eq(vehicles.vehicleTypeId, vehicleTypes.id));
  return sortByThai(rows, (row) => row.plateNo);
}

export async function createVehicle(db: AppDatabase, actorId: string, input: VehicleInput) {
  await assertUsableVehicleType(db, input.vehicleTypeId);
  await withUniqueMessage(DUPLICATE_PLATE, () =>
    db.insert(vehicles).values({ ...input, createdBy: actorId, updatedBy: actorId }),
  );
}

export async function updateVehicle(db: AppDatabase, actorId: string, { id, ...input }: UpdateVehicleInput) {
  const [current] = await db
    .select({ vehicleTypeId: vehicles.vehicleTypeId })
    .from(vehicles)
    .where(eq(vehicles.id, id))
    .limit(1);
  assertFound(current ? [current] : []);
  // Keeping a type that was deactivated later is fine; switching to one is not.
  if (current && current.vehicleTypeId !== input.vehicleTypeId) await assertUsableVehicleType(db, input.vehicleTypeId);
  assertFound(
    await withUniqueMessage(DUPLICATE_PLATE, () =>
      db
        .update(vehicles)
        .set({ ...input, updatedBy: actorId })
        .where(eq(vehicles.id, id))
        .returning({ id: vehicles.id }),
    ),
  );
}

export async function setVehicleActive(db: AppDatabase, actorId: string, { id, active }: SetActiveInput) {
  assertFound(
    await db
      .update(vehicles)
      .set({ isActive: active, updatedBy: actorId })
      .where(eq(vehicles.id, id))
      .returning({ id: vehicles.id }),
  );
}

export async function deleteVehicle(db: AppDatabase, { id }: DeleteInput) {
  await deleteOrExplain(() => db.delete(vehicles).where(eq(vehicles.id, id)).returning({ id: vehicles.id }));
}
