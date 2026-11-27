import { desc, eq } from "drizzle-orm";
import { routes } from "@/db/schema";
import type { AppDatabase } from "@/db/types";
import type { DeleteInput, SetActiveInput } from "@/features/master-data/schemas";
import { assertFound, deleteOrExplain } from "@/features/master-data/service-helpers";
import type { RouteInput, UpdateRouteInput } from "./schemas";

/** `price` is a numeric(14,2) string, e.g. "3500.50". */
export type RouteRow = {
  id: number;
  pickupLocation: string;
  dropoffLocation: string;
  price: string;
  isActive: boolean;
};

/** Newest first, as in the legacy screen (BR-MD-04). */
export async function listRoutes(db: AppDatabase): Promise<RouteRow[]> {
  return db
    .select({
      id: routes.id,
      pickupLocation: routes.pickupLocation,
      dropoffLocation: routes.dropoffLocation,
      price: routes.price,
      isActive: routes.isActive,
    })
    .from(routes)
    .orderBy(desc(routes.id));
}

export async function createRoute(db: AppDatabase, actorId: string, input: RouteInput) {
  await db.insert(routes).values({ ...input, createdBy: actorId, updatedBy: actorId });
}

export async function updateRoute(db: AppDatabase, actorId: string, { id, ...input }: UpdateRouteInput) {
  assertFound(
    await db
      .update(routes)
      .set({ ...input, updatedBy: actorId })
      .where(eq(routes.id, id))
      .returning({ id: routes.id }),
  );
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

/** Work orders copy the place names, so a route can always be deleted. */
export async function deleteRoute(db: AppDatabase, { id }: DeleteInput) {
  await deleteOrExplain(() => db.delete(routes).where(eq(routes.id, id)).returning({ id: routes.id }));
}
