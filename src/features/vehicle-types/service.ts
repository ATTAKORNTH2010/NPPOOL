import { eq } from "drizzle-orm";
import { vehicleTypes } from "@/db/schema";
import type { AppDatabase } from "@/db/types";
import type { DeleteInput, SetActiveInput } from "@/features/master-data/schemas";
import { assertFound, deleteOrExplain, withUniqueMessage } from "@/features/master-data/service-helpers";
import { thaiCompare } from "@/lib/thai-sort";
import type { UpdateVehicleTypeInput, VehicleTypeInput } from "./schemas";

export type VehicleTypeRow = { id: number; code: string; name: string; sortOrder: number; isActive: boolean };

const DUPLICATE_CODE = "รหัสประเภทรถนี้มีอยู่แล้ว";

/** Display order first, then Thai name (BR-MD-06). */
export async function listVehicleTypes(db: AppDatabase): Promise<VehicleTypeRow[]> {
  const rows = await db
    .select({
      id: vehicleTypes.id,
      code: vehicleTypes.code,
      name: vehicleTypes.name,
      sortOrder: vehicleTypes.sortOrder,
      isActive: vehicleTypes.isActive,
    })
    .from(vehicleTypes);
  return rows.sort((a, b) => a.sortOrder - b.sortOrder || thaiCompare(a.name, b.name));
}

export async function createVehicleType(db: AppDatabase, actorId: string, input: VehicleTypeInput) {
  await withUniqueMessage(DUPLICATE_CODE, () =>
    db.insert(vehicleTypes).values({ ...input, createdBy: actorId, updatedBy: actorId }),
  );
}

export async function updateVehicleType(db: AppDatabase, actorId: string, { id, ...input }: UpdateVehicleTypeInput) {
  assertFound(
    await withUniqueMessage(DUPLICATE_CODE, () =>
      db
        .update(vehicleTypes)
        .set({ ...input, updatedBy: actorId })
        .where(eq(vehicleTypes.id, id))
        .returning({ id: vehicleTypes.id }),
    ),
  );
}

export async function setVehicleTypeActive(db: AppDatabase, actorId: string, { id, active }: SetActiveInput) {
  assertFound(
    await db
      .update(vehicleTypes)
      .set({ isActive: active, updatedBy: actorId })
      .where(eq(vehicleTypes.id, id))
      .returning({ id: vehicleTypes.id }),
  );
}

export async function deleteVehicleType(db: AppDatabase, { id }: DeleteInput) {
  await deleteOrExplain(() =>
    db.delete(vehicleTypes).where(eq(vehicleTypes.id, id)).returning({ id: vehicleTypes.id }),
  );
}
