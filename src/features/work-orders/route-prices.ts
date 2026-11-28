/**
 * Transport prices of the pickup → drop-off routes, for the work order form
 * (BR-WO-05, WO-18, D38, D40). Pure: runs in the browser and in unit tests.
 * Prices are numeric(14,2) strings, compared as numbers for ordering only,
 * never added up.
 */

/** An active route as the work order form sees it. */
export type RouteOption = {
  pickup: string;
  dropoff: string;
  vehicleTypeId: number | null;
  vehicleTypeName: string | null;
  /** Prices by fuel price (whole baht per litre), lowest fuel price first. */
  rates: { fuelPrice: number; price: string }[];
  /** The one price of a route not yet moved to prices by fuel price. */
  legacyPrice: string | null;
};

export type RoutePair = { pickup: string; dropoff: string; prices: string[] };

export type FeeOption = { vehicleTypeName: string | null; price: string };

const byAmount = (a: string, b: string) => Number(a) - Number(b);

/** A route's prices at this fuel price (all of them when null). An old route's single price stands for every fuel price. */
function pricesOf(route: RouteOption, fuelPrice: number | null): string[] {
  if (route.rates.length === 0) return route.legacyPrice === null ? [] : [route.legacyPrice];
  return route.rates.filter((rate) => fuelPrice === null || rate.fuelPrice === fuelPrice).map((rate) => rate.price);
}

/** One entry per pickup → drop-off, in the routes' order, with every price it can have, lowest first. */
export function routePairs(routes: RouteOption[]): RoutePair[] {
  const pairs = new Map<string, { pickup: string; dropoff: string; prices: Set<string> }>();
  for (const route of routes) {
    const key = JSON.stringify([route.pickup, route.dropoff]);
    const pair = pairs.get(key) ?? { pickup: route.pickup, dropoff: route.dropoff, prices: new Set<string>() };
    for (const price of pricesOf(route, null)) pair.prices.add(price);
    pairs.set(key, pair);
  }
  return [...pairs.values()].map(({ prices, ...pair }) => ({ ...pair, prices: [...prices].sort(byAmount) }));
}

/** Whether any route runs from this pickup to this drop-off. */
export function isKnownPair(routes: RouteOption[], pickup: string, dropoff: string): boolean {
  return routes.some((route) => route.pickup === pickup && route.dropoff === dropoff);
}

/**
 * The transport fees a pickup → drop-off can have at a fuel price (D40; at
 * any fuel price when null). When some of its routes are for vehicle types
 * already on the work order, only those count. Lowest first, no repeats.
 */
export function feeOptions(
  routes: RouteOption[],
  query: { pickup: string; dropoff: string; fuelPrice: number | null; vehicleTypeIds: number[] },
): FeeOption[] {
  const pair = routes.filter((route) => route.pickup === query.pickup && route.dropoff === query.dropoff);
  const typed = pair.filter((route) => route.vehicleTypeId !== null && query.vehicleTypeIds.includes(route.vehicleTypeId));
  const seen = new Set<string>();
  const options: FeeOption[] = [];
  for (const route of typed.length > 0 ? typed : pair) {
    for (const price of pricesOf(route, query.fuelPrice)) {
      const key = JSON.stringify([route.vehicleTypeName, price]);
      if (seen.has(key)) continue;
      seen.add(key);
      options.push({ vehicleTypeName: route.vehicleTypeName, price });
    }
  }
  return options.sort((a, b) => byAmount(a.price, b.price));
}

/** The fee to fill in: the price every option agrees on, else null. */
export function singlePrice(options: { price: string }[]): string | null {
  const [first, ...rest] = options;
  if (!first) return null;
  return rest.every((option) => option.price === first.price) ? first.price : null;
}
