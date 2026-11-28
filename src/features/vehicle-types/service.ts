import { eq } from "drizzle-orm";
import { vehicleTypes } from "@/db/schema";
import type { AppDatabase, DbOrTx } from "@/db/types";
import type { DeleteInput, SetActiveInput } from "@/features/master-data/schemas";
import { assertFound, deleteOrExplain, withUniqueMessage } from "@/features/master-data/service-helpers";
import { RuleError } from "@/lib/action-result";
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

/**
 * The vehicle type picked for a vehicle or a route must exist and be in use.
 * `keptId`: the record's current type, which may stay even if it was
 * deactivated later. Returns the type's name for the activity log.
 */
export async function assertUsableVehicleType(
  db: DbOrTx,
  vehicleTypeId: number,
  keptId: number | null = null,
): Promise<string> {
  const [type] = await db
    .select({ name: vehicleTypes.name, isActive: vehicleTypes.isActive })
    .from(vehicleTypes)
    .where(eq(vehicleTypes.id, vehicleTypeId))
    .limit(1);
  if (!type || (!type.isActive && vehicleTypeId !== keptId)) throw new RuleError("กรุณาเลือกประเภทรถที่ใช้งานอยู่");
  return type.name;
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
