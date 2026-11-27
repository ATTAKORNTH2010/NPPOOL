import { formatYmdTh } from "@/lib/date-range";
import { ACTIVITY_RETENTION_MONTHS } from "./catalog";

/** "ย้อนหลัง 3 เดือน" (everything kept), "ตั้งแต่ 01/11/2569", "01/11/2569 – 30/11/2569"… */
export function formatRangeLabel(range: { from: string | null; to: string | null }): string {
  if (range.from && range.to) {
    return range.from === range.to ? formatYmdTh(range.from) : `${formatYmdTh(range.from)} – ${formatYmdTh(range.to)}`;
  }
  if (range.from) return `ตั้งแต่ ${formatYmdTh(range.from)}`;
  if (range.to) return `ถึง ${formatYmdTh(range.to)}`;
  return `ย้อนหลัง ${ACTIVITY_RETENTION_MONTHS} เดือน`;
}
