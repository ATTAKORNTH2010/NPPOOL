import { describe, expect, it } from "vitest";
import { formatDateTh, formatDateTimeTh, formatMoney, formatTimeTh } from "@/lib/format";

// ADR-0008 / BR-UI-02, BR-UI-03
describe("Thai date formats", () => {
  it("shows the Buddhist year and Thai local time", () => {
    const value = new Date("2026-11-30T17:30:00Z"); // 01/12/2569 00:30 in Bangkok
    expect(formatDateTh(value)).toBe("01/12/2569");
    expect(formatTimeTh(value)).toBe("00:30");
    expect(formatDateTimeTh(value)).toBe("01/12/2569 00:30");
  });

  it("accepts ISO strings and uses a 24-hour clock", () => {
    expect(formatDateTimeTh("2026-11-27T07:05:00Z")).toBe("27/11/2569 14:05");
  });

  it("returns an empty string for missing or invalid values", () => {
    for (const value of [null, undefined, "", "not a date"]) {
      expect(formatDateTimeTh(value)).toBe("");
    }
  });
});

describe("formatMoney", () => {
  it("formats numeric strings from Postgres with 2 decimals and thousands separators", () => {
    expect(formatMoney("3500")).toBe("3,500.00");
    expect(formatMoney("3500.5")).toBe("3,500.50");
    expect(formatMoney(0)).toBe("0.00");
  });

  it("returns an empty string for missing or invalid values", () => {
    expect(formatMoney(null)).toBe("");
    expect(formatMoney("")).toBe("");
    expect(formatMoney("abc")).toBe("");
  });
});
