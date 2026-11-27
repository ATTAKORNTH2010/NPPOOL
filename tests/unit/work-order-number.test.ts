import { describe, expect, it } from "vitest";
import { formatWorkOrderNo, workOrderPeriod } from "@/features/work-orders/number";

// BR-WO-01 / ADR-0007 examples.
describe("workOrderPeriod (Buddhist year + month, Thai time)", () => {
  it("uses the Thai month, not the UTC month", () => {
    // 2026-11-30 17:30 UTC = 2026-12-01 00:30 in Bangkok → December 2569
    expect(workOrderPeriod(new Date("2026-11-30T17:30:00Z"))).toBe("256912");
    // 2026-11-30 16:59 UTC = 2026-11-30 23:59 in Bangkok → still November
    expect(workOrderPeriod(new Date("2026-11-30T16:59:00Z"))).toBe("256911");
  });

  it("rolls over the Buddhist year at New Year in Thai time", () => {
    expect(workOrderPeriod(new Date("2026-12-31T16:59:00Z"))).toBe("256912");
    expect(workOrderPeriod(new Date("2026-12-31T17:00:00Z"))).toBe("257001");
  });

  it("matches the legacy example for October 2568", () => {
    expect(workOrderPeriod(new Date("2025-10-05T03:00:00Z"))).toBe("256810");
  });
});

describe("formatWorkOrderNo", () => {
  it("pads the running number to 4 digits", () => {
    expect(formatWorkOrderNo("256810", 1)).toBe("NP2568100001");
    expect(formatWorkOrderNo("256810", 42)).toBe("NP2568100042");
    expect(formatWorkOrderNo("256810", 9999)).toBe("NP2568109999");
  });

  it("keeps growing past 9,999 instead of truncating (legacy bug / lpad pitfall)", () => {
    expect(formatWorkOrderNo("256810", 10000)).toBe("NP25681010000");
  });

  it("rejects invalid input", () => {
    expect(() => formatWorkOrderNo("2568", 1)).toThrow(RangeError);
    expect(() => formatWorkOrderNo("256810", 0)).toThrow(RangeError);
    expect(() => formatWorkOrderNo("256810", 1.5)).toThrow(RangeError);
  });
});
