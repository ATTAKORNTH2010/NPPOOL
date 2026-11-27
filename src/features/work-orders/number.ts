/**
 * Work order number format (BR-WO-01, ADR-0007):
 *   "NP" + Buddhist year (4 digits) + month (2 digits) + running number (at least 4 digits)
 * The month is taken in Thai time (Asia/Bangkok) — Vercel servers run in UTC.
 */
export const WORK_ORDER_PREFIX = "NP";

const periodFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
});

/** Buddhist year + month in Asia/Bangkok, e.g. 2026-11-27 → "256911". */
export function workOrderPeriod(at: Date): string {
  const parts = periodFormatter.formatToParts(at);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = parts.find((p) => p.type === "month")?.value;
  if (!Number.isInteger(year) || !month) {
    throw new Error(`Cannot compute work order period for ${at.toISOString()}`);
  }
  return `${year + 543}${month}`;
}

/**
 * Pads the running number to 4 digits in TypeScript. Postgres lpad() is not
 * used because it truncates longer values (lpad('10000', 4, '0') = '1000').
 */
export function formatWorkOrderNo(period: string, running: number): string {
  if (!/^\d{6}$/.test(period)) throw new RangeError(`Invalid period: ${period}`);
  if (!Number.isSafeInteger(running) || running < 1) {
    throw new RangeError(`Invalid running number: ${running}`);
  }
  return `${WORK_ORDER_PREFIX}${period}${String(running).padStart(4, "0")}`;
}
