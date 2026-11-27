import { eq } from "drizzle-orm";
import { customers } from "@/db/schema";
import type { AppDatabase } from "@/db/types";
import type { DeleteInput, SetActiveInput } from "@/features/master-data/schemas";
import { assertFound, deleteOrExplain } from "@/features/master-data/service-helpers";
import { sortByThai } from "@/lib/thai-sort";
import type { CustomerInput, UpdateCustomerInput } from "./schemas";

export type CustomerRow = {
  id: number;
  name: string;
  address: string;
  phone: string;
  taxId: string;
  isActive: boolean;
};

/** Sorted by company name in Thai order (BR-MD-01, BR-MD-06). */
export async function listCustomers(db: AppDatabase): Promise<CustomerRow[]> {
  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      address: customers.address,
      phone: customers.phone,
      taxId: customers.taxId,
      isActive: customers.isActive,
    })
    .from(customers);
  return sortByThai(rows, (row) => row.name);
}

export async function createCustomer(db: AppDatabase, actorId: string, input: CustomerInput) {
  await db.insert(customers).values({ ...input, createdBy: actorId, updatedBy: actorId });
}

export async function updateCustomer(db: AppDatabase, actorId: string, { id, ...input }: UpdateCustomerInput) {
  assertFound(
    await db
      .update(customers)
      .set({ ...input, updatedBy: actorId })
      .where(eq(customers.id, id))
      .returning({ id: customers.id }),
  );
}

export async function setCustomerActive(db: AppDatabase, actorId: string, { id, active }: SetActiveInput) {
  assertFound(
    await db
      .update(customers)
      .set({ isActive: active, updatedBy: actorId })
      .where(eq(customers.id, id))
      .returning({ id: customers.id }),
  );
}

export async function deleteCustomer(db: AppDatabase, { id }: DeleteInput) {
  await deleteOrExplain(() => db.delete(customers).where(eq(customers.id, id)).returning({ id: customers.id }));
}
