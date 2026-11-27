import { RuleError } from "@/lib/action-result";
import { PG_FOREIGN_KEY_VIOLATION, PG_UNIQUE_VIOLATION, pgErrorCode } from "@/lib/db-errors";

/** An update or delete that matched no row. */
export function assertFound(rows: unknown[]) {
  if (rows.length === 0) throw new RuleError("ไม่พบข้อมูล อาจถูกลบไปแล้ว");
}

/** Turns a unique-constraint failure into a field-friendly Thai message. */
export async function withUniqueMessage<T>(message: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) throw new RuleError(message);
    throw error;
  }
}

/**
 * Hard delete only works for rows nothing refers to; the database's foreign
 * keys refuse the rest (ADR-0010). The message points to deactivating instead.
 */
export async function deleteOrExplain(run: () => Promise<unknown[]>) {
  try {
    assertFound(await run());
  } catch (error) {
    if (pgErrorCode(error) === PG_FOREIGN_KEY_VIOLATION) {
      throw new RuleError("ลบไม่ได้ เพราะมีข้อมูลอื่นใช้รายการนี้อยู่ ให้ปิดใช้งานแทน");
    }
    throw error;
  }
}
