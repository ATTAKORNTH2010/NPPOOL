import { describe, expect, it } from "vitest";
import {
  bangkokDayEnd,
  bangkokDayStart,
  bangkokToday,
  formatYmdTh,
  isYmd,
  orderedRange,
  toBangkokParts,
} from "@/lib/date-range";

// ADR-0008: a "day" is a day in Thai time, whatever the server's time zone.
describe("Thai-time days", () => {
  it("accepts only real calendar days", () => {
    expect(isYmd("2026-11-27")).toBe(true);
    expect(isYmd("2028-02-29")).toBe(true);
    expect(isYmd("2026-02-29")).toBe(false);
    expect(isYmd("2026-13-01")).toBe(false);
    expect(isYmd("27/11/2569")).toBe(false);
  });

  it("starts and ends a day at midnight in Thai time", () => {
    expect(bangkokDayStart("2026-12-01").toISOString()).toBe("2026-11-30T17:00:00.000Z");
    expect(bangkokDayEnd("2026-12-01").toISOString()).toBe("2026-12-01T17:00:00.000Z");
  });

  it("turns an instant into the Thai wall clock", () => {
    expect(toBangkokParts(new Date("2026-11-30T17:30:00Z"))).toEqual({ date: "2026-12-01", time: "00:30" });
    expect(bangkokToday(new Date("2026-11-30T16:59:00Z"))).toBe("2026-11-30");
  });

  it("shows days with the Buddhist year and orders ranges", () => {
    expect(formatYmdTh("2026-11-27")).toBe("27/11/2569");
    expect(orderedRange("2026-11-30", "2026-11-01")).toEqual(["2026-11-01", "2026-11-30"]);
    expect(orderedRange(null, "2026-11-01")).toEqual([null, "2026-11-01"]);
  });
});
