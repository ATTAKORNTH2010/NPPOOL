import { sql } from "drizzle-orm";
import { workOrderCounters } from "@/db/schema";
import type { DbOrTx } from "@/db/types";
import { formatWorkOrderNo, workOrderPeriod } from "./number";

/**
 * Allocates the next work order number for the month of `at` (ADR-0007).
 * Call it inside the same transaction that inserts the work order: the
 * upsert locks this month's counter row until commit, so concurrent saves get
 * consecutive numbers, and a rolled-back save gives its number back.
 */
export async function allocateWorkOrderNo(tx: DbOrTx, at: Date = new Date()): Promise<string> {
  const period = workOrderPeriod(at);
  const [row] = await tx
    .insert(workOrderCounters)
    .values({ period, lastNo: 1 })
    .onConflictDoUpdate({
      target: workOrderCounters.period,
      set: { lastNo: sql`${workOrderCounters.lastNo} + 1` },
    })
    .returning({ lastNo: workOrderCounters.lastNo });
  if (!row) throw new Error("Work order counter upsert returned no row");
  return formatWorkOrderNo(period, row.lastNo);
}
