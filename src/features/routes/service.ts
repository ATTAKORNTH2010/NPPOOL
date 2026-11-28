import { asc, desc, eq } from "drizzle-orm";
import { routeRates, routes, vehicleTypes } from "@/db/schema";
import type { AppDatabase, DbOrTx } from "@/db/types";
import type { DeleteInput, SetActiveInput } from "@/features/master-data/schemas";
import { assertFound, deleteOrExplain } from "@/features/master-data/service-helpers";
import { assertUsableVehicleType } from "@/features/vehicle-types/service";
import type { RouteInput, UpdateRouteInput } from "./schemas";

/** `price` is a numeric(14,2) string, e.g. "3500.50"; `fuelPrice` is whole baht per litre. */
export type RouteRate = { fuelPrice: number; price: string };

export type RouteRow = {
  id: number;
  pickupLocation: string;
  dropoffLocation: string;
  /** Null only on routes saved before 2026-11-28. */
  vehicleTypeId: number | null;
  vehicleTypeName: string | null;
  vehicleTypeActive: boolean | null;
  /** The one price from before prices by fuel price; null once the route is saved again. */
  legacyPrice: string | null;
  /** Lowest fuel price first. */
  rates: RouteRate[];
  isActive: boolean;
};

/** What a save tells the activity log. */
export type SavedRoute = { id: number; vehicleTypeName: string };

/** Newest first, as in the legacy screen (BR-MD-04). */
export async function listRoutes(db: AppDatabase): Promise<RouteRow[]> {
  const [routeRows, rateRows] = await Promise.all([
    db
      .select({
        id: routes.id,
        pickupLocation: routes.pickupLocation,
        dropoffLocation: routes.dropoffLocation,
        vehicleTypeId: routes.vehicleTypeId,
        vehicleTypeName: vehicleTypes.name,
        vehicleTypeActive: vehicleTypes.isActive,
        legacyPrice: routes.price,
        isActive: routes.isActive,
      })
      .from(routes)
      .leftJoin(vehicleTypes, eq(routes.vehicleTypeId, vehicleTypes.id))
      .orderBy(desc(routes.id)),
    db
      .select({ routeId: routeRates.routeId, fuelPrice: routeRates.fuelPrice, price: routeRates.price })
      .from(routeRates)
      .orderBy(asc(routeRates.routeId), asc(routeRates.fuelPrice)),
  ]);

  const ratesByRoute = new Map<number, RouteRate[]>();
  for (const { routeId, fuelPrice, price } of rateRows) {
    const list = ratesByRoute.get(routeId) ?? [];
    list.push({ fuelPrice, price });
    ratesByRoute.set(routeId, list);
  }
  return routeRows.map((row) => ({ ...row, rates: ratesByRoute.get(row.id) ?? [] }));
}

async function insertRates(tx: DbOrTx, routeId: number, rates: RouteInput["rates"]) {
  if (rates.length === 0) return;
  await tx.insert(routeRates).values(rates.map(({ fuelPrice, price }) => ({ routeId, fuelPrice, price })));
}

export async function createRoute(db: AppDatabase, actorId: string, { rates, ...input }: RouteInput): Promise<SavedRoute> {
  return db.transaction(async (tx) => {
    const vehicleTypeName = await assertUsableVehicleType(tx, input.vehicleTypeId);
    const [created] = await tx
      .insert(routes)
      .values({ ...input, createdBy: actorId, updatedBy: actorId })
      .returning({ id: routes.id });
    if (!created) throw new Error("route insert returned no row");
    await insertRates(tx, created.id, rates);
    return { id: created.id, vehicleTypeName };
  });
}

/**
 * Saves the route and replaces its whole price list, as the form shows it.
 * The row lock keeps two people saving the same route at once from mixing
 * their lists. The old single price gives way to the prices by fuel price.
 */
export async function updateRoute(
  db: AppDatabase,
  actorId: string,
  { id, rates, ...input }: UpdateRouteInput,
): Promise<SavedRoute> {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({ vehicleTypeId: routes.vehicleTypeId })
      .from(routes)
      .where(eq(routes.id, id))
      .for("update");
    assertFound(current ? [current] : []);
    const vehicleTypeName = await assertUsableVehicleType(tx, input.vehicleTypeId, current?.vehicleTypeId ?? null);
    await tx
      .update(routes)
      .set({ ...input, price: null, updatedBy: actorId })
      .where(eq(routes.id, id));
    await tx.delete(routeRates).where(eq(routeRates.routeId, id));
    await insertRates(tx, id, rates);
    return { id, vehicleTypeName };
  });
}

export async function setRouteActive(db: AppDatabase, actorId: string, { id, active }: SetActiveInput) {
  assertFound(
    await db
      .update(routes)
      .set({ isActive: active, updatedBy: actorId })
      .where(eq(routes.id, id))
      .returning({ id: routes.id }),
  );
}

/** Work orders copy the place names and the fee, so a route can always be deleted; its prices go with it. */
export async function deleteRoute(db: AppDatabase, { id }: DeleteInput) {
  await deleteOrExplain(() => db.delete(routes).where(eq(routes.id, id)).returning({ id: routes.id }));
}
