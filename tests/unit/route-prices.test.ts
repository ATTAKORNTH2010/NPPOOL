import { describe, expect, it } from "vitest";
import {
  feeOptions,
  isKnownPair,
  routePairs,
  singlePrice,
  type RouteOption,
} from "@/features/work-orders/route-prices";

// WO-18 + D40: how the work order form finds ค่าขนส่ง in the routes' price lists.
const SIX = 6;
const TEN = 10;
const routes: RouteOption[] = [
  {
    pickup: "คลัง A",
    dropoff: "โรงงาน B",
    vehicleTypeId: SIX,
    vehicleTypeName: "รถ 6 ล้อ",
    rates: [
      { fuelPrice: 30, price: "3500.00" },
      { fuelPrice: 31, price: "3600.00" },
    ],
    legacyPrice: null,
  },
  {
    pickup: "คลัง A",
    dropoff: "โรงงาน B",
    vehicleTypeId: TEN,
    vehicleTypeName: "รถ 10 ล้อ",
    rates: [
      { fuelPrice: 30, price: "5000.00" },
      { fuelPrice: 32, price: "5200.00" },
    ],
    legacyPrice: null,
  },
  // Saved before prices by fuel price: one price, no vehicle type.
  { pickup: "คลัง A", dropoff: "ท่าเรือ C", vehicleTypeId: null, vehicleTypeName: null, rates: [], legacyPrice: "900.00" },
];

const query = (fuelPrice: number | null, vehicleTypeIds: number[] = [], dropoff = "โรงงาน B") => ({
  pickup: "คลัง A",
  dropoff,
  fuelPrice,
  vehicleTypeIds,
});

describe("route prices for the work order form", () => {
  it("lists each pickup → drop-off once with every price it can have", () => {
    expect(routePairs(routes)).toEqual([
      { pickup: "คลัง A", dropoff: "โรงงาน B", prices: ["3500.00", "3600.00", "5000.00", "5200.00"] },
      { pickup: "คลัง A", dropoff: "ท่าเรือ C", prices: ["900.00"] },
    ]);
    expect(isKnownPair(routes, "คลัง A", "ท่าเรือ C")).toBe(true);
    expect(isKnownPair(routes, "คลัง A", "ที่อื่น")).toBe(false);
  });

  it("offers the price of every vehicle type at the chosen fuel price", () => {
    expect(feeOptions(routes, query(30))).toEqual([
      { vehicleTypeName: "รถ 6 ล้อ", price: "3500.00" },
      { vehicleTypeName: "รถ 10 ล้อ", price: "5000.00" },
    ]);
    expect(singlePrice(feeOptions(routes, query(30)))).toBeNull();
    expect(feeOptions(routes, query(32))).toEqual([{ vehicleTypeName: "รถ 10 ล้อ", price: "5200.00" }]);
    expect(feeOptions(routes, query(40))).toEqual([]);
  });

  it("narrows to the vehicle types already on the work order", () => {
    expect(singlePrice(feeOptions(routes, query(30, [SIX])))).toBe("3500.00");
    expect(singlePrice(feeOptions(routes, query(31, [SIX, TEN])))).toBe("3600.00");
    // No route for that vehicle type: every route of the pair still counts.
    expect(feeOptions(routes, query(30, [99]))).toHaveLength(2);
    // The type's route has no price at this fuel price: nothing fits.
    expect(feeOptions(routes, query(32, [SIX]))).toEqual([]);
  });

  it("uses an old route's single price whatever the fuel price", () => {
    expect(singlePrice(feeOptions(routes, query(45, [], "ท่าเรือ C")))).toBe("900.00");
    expect(singlePrice(feeOptions(routes, query(null, [], "ท่าเรือ C")))).toBe("900.00");
  });

  it("without a fuel price fills only when the whole pair has one price", () => {
    expect(singlePrice(feeOptions(routes, query(null)))).toBeNull();
    expect(singlePrice([])).toBeNull();
    expect(singlePrice([{ price: "10.00" }, { price: "10.00" }])).toBe("10.00");
  });
});
