import { describe, expect, it } from "vitest";
import {
  activeFilterCount,
  EMPTY_WORK_ORDER_FILTERS,
  filtersToSearchParams,
  pageNumber,
  parseWorkOrderFilters,
} from "@/features/work-orders/filters";

// WO-16 search filters (user request 2026-11-27): they live in the URL.
describe("work-order search filters", () => {
  it("reads every filter from the URL and tidies the text", () => {
    const filters = parseWorkOrderFilters(
      new URLSearchParams({
        no: " NP2569 ",
        status: "3",
        customer: "บริษัท   ก.",
        orderedBy: "คุณ ข.",
        pickup: "คลัง A",
        dropoff: "โรงงาน B",
        vehicle: "70-1234",
        receiveFrom: "2026-11-01",
        receiveTo: "2026-11-30",
        deliveryFrom: "2026-12-01",
        deliveryTo: "2026-12-01",
        feeMin: "1,000",
        feeMax: "5000.50",
      }),
    );
    expect(filters).toEqual({
      no: "NP2569",
      status: 3,
      customer: "บริษัท ก.",
      orderedBy: "คุณ ข.",
      pickup: "คลัง A",
      dropoff: "โรงงาน B",
      vehicle: "70-1234",
      receiveFrom: "2026-11-01",
      receiveTo: "2026-11-30",
      deliveryFrom: "2026-12-01",
      deliveryTo: "2026-12-01",
      feeMin: "1000",
      feeMax: "5000.50",
    });
    expect(activeFilterCount(filters)).toBe(13);
  });

  it("drops values that are not valid instead of failing", () => {
    expect(
      parseWorkOrderFilters({
        status: "x",
        receiveFrom: "2026-02-30",
        deliveryTo: "27/11/2569",
        feeMin: "-5",
        feeMax: "1.234",
        customer: "   ",
      }),
    ).toEqual(EMPTY_WORK_ORDER_FILTERS);
  });

  it("swaps ranges that were entered backwards", () => {
    const filters = parseWorkOrderFilters({ receiveFrom: "2026-11-30", receiveTo: "2026-11-01", feeMin: "900", feeMax: "100" });
    expect(filters).toMatchObject({ receiveFrom: "2026-11-01", receiveTo: "2026-11-30", feeMin: "100", feeMax: "900" });
  });

  it("caps long text and takes the first value of repeated params", () => {
    expect(parseWorkOrderFilters({ customer: "ก".repeat(150) }).customer).toHaveLength(100);
    expect(parseWorkOrderFilters({ pickup: ["A", "B"] }).pickup).toBe("A");
  });

  it("writes only the filters that are set, so URLs stay short and stable", () => {
    const filters = { ...EMPTY_WORK_ORDER_FILTERS, customer: "บริษัท ก.", status: 1, feeMin: "100" };
    expect(filtersToSearchParams(filters).toString()).toBe(
      new URLSearchParams({ status: "1", customer: "บริษัท ก.", feeMin: "100" }).toString(),
    );
    expect(filtersToSearchParams(filters, 3).get("page")).toBe("3");
    expect(filtersToSearchParams(EMPTY_WORK_ORDER_FILTERS, 1).toString()).toBe("");
  });

  it("reads the page number, falling back to 1", () => {
    expect(pageNumber({ page: "4" })).toBe(4);
    expect(pageNumber({ page: "0" })).toBe(1);
    expect(pageNumber({ page: "abc" })).toBe(1);
    expect(pageNumber({})).toBe(1);
  });
});
