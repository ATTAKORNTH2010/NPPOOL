/**
 * Days in Thai time (ADR-0008). Thailand has no daylight saving, so a day is
 * always [00:00+07:00, next day 00:00+07:00). Pure: safe in the browser too.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** A real calendar day written "YYYY-MM-DD". */
export function isYmd(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** First instant of the day in Thai time. */
export function bangkokDayStart(ymd: string): Date {
  return new Date(`${ymd}T00:00:00+07:00`);
}

/** First instant after the day in Thai time (exclusive end). */
export function bangkokDayEnd(ymd: string): Date {
  return new Date(bangkokDayStart(ymd).getTime() + DAY_MS);
}

/** Instant → Thai wall clock { date: "YYYY-MM-DD", time: "HH:mm" }. */
export function toBangkokParts(value: Date): { date: string; time: string } {
  const shifted = new Date(value.getTime() + BANGKOK_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`,
    time: `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`,
  };
}

/** Today in Thai time as "YYYY-MM-DD". */
export function bangkokToday(now: Date = new Date()): string {
  return toBangkokParts(now).date;
}

/** "2026-11-27" → "27/11/2569" without going through any time zone. */
export function formatYmdTh(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${Number(year) + 543}`;
}

/** Orders a from/to pair so that from ≤ to; either side may be missing. */
export function orderedRange(from: string | null, to: string | null): [string | null, string | null] {
  return from && to && from > to ? [to, from] : [from, to];
}
