import { isYmd, orderedRange } from "@/lib/date-range";

/**
 * Search filters of the work-order list (WO-16, user request 2026-11-27).
 * They live in the URL so that paging, the Excel export and the back button
 * all use the same search. Pure: used by the page, the export route and the
 * filter form in the browser.
 */
export type WorkOrderFilters = {
  /** เลขที่ใบงาน (contains) */
  no: string | null;
  status: number | null;
  /** ผู้ว่าจ้าง (name contains) */
  customer: string | null;
  orderedBy: string | null;
  pickup: string | null;
  dropoff: string | null;
  /** รถ: plate, vehicle type name or code (contains) */
  vehicle: string | null;
  /** วันที่รับงาน / ส่งงาน: Thai-time days "YYYY-MM-DD", both ends included */
  receiveFrom: string | null;
  receiveTo: string | null;
  deliveryFrom: string | null;
  deliveryTo: string | null;
  /** ค่าขนส่ง range, plain decimal strings */
  feeMin: string | null;
  feeMax: string | null;
};

export type WorkOrderFilterKey = keyof WorkOrderFilters;

export const WORK_ORDER_FILTER_KEYS = [
  "no",
  "status",
  "customer",
  "orderedBy",
  "pickup",
  "dropoff",
  "vehicle",
  "receiveFrom",
  "receiveTo",
  "deliveryFrom",
  "deliveryTo",
  "feeMin",
  "feeMax",
] as const satisfies readonly WorkOrderFilterKey[];

export const EMPTY_WORK_ORDER_FILTERS: WorkOrderFilters = {
  no: null,
  status: null,
  customer: null,
  orderedBy: null,
  pickup: null,
  dropoff: null,
  vehicle: null,
  receiveFrom: null,
  receiveTo: null,
  deliveryFrom: null,
  deliveryTo: null,
  feeMin: null,
  feeMax: null,
};

const TEXT_MAX = 100;
const AMOUNT = /^\d{1,12}(\.\d{1,2})?$/;

export type SearchParamsInput = URLSearchParams | Record<string, string | string[] | undefined>;

function read(params: SearchParamsInput, key: string): string {
  const value = params instanceof URLSearchParams ? params.get(key) : params[key];
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" ? first : "";
}

function text(value: string): string | null {
  const tidy = value.replace(/\s+/g, " ").trim();
  return tidy ? tidy.slice(0, TEXT_MAX) : null;
}

function amount(value: string): string | null {
  const plain = value.replace(/,/g, "").trim();
  return AMOUNT.test(plain) ? plain : null;
}

function day(value: string): string | null {
  return isYmd(value) ? value : null;
}

/** Bad values are dropped instead of failing; ranges given backwards are swapped. */
export function parseWorkOrderFilters(params: SearchParamsInput): WorkOrderFilters {
  const status = read(params, "status");
  const [receiveFrom, receiveTo] = orderedRange(day(read(params, "receiveFrom")), day(read(params, "receiveTo")));
  const [deliveryFrom, deliveryTo] = orderedRange(day(read(params, "deliveryFrom")), day(read(params, "deliveryTo")));
  let feeMin = amount(read(params, "feeMin"));
  let feeMax = amount(read(params, "feeMax"));
  if (feeMin !== null && feeMax !== null && Number(feeMin) > Number(feeMax)) [feeMin, feeMax] = [feeMax, feeMin];

  return {
    no: text(read(params, "no")),
    status: /^\d{1,2}$/.test(status) ? Number(status) : null,
    customer: text(read(params, "customer")),
    orderedBy: text(read(params, "orderedBy")),
    pickup: text(read(params, "pickup")),
    dropoff: text(read(params, "dropoff")),
    vehicle: text(read(params, "vehicle")),
    receiveFrom,
    receiveTo,
    deliveryFrom,
    deliveryTo,
    feeMin,
    feeMax,
  };
}

/** Only the filters that are set, in a fixed order (stable URLs). */
export function filtersToSearchParams(filters: WorkOrderFilters, page?: number): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of WORK_ORDER_FILTER_KEYS) {
    const value = filters[key];
    if (value !== null) params.set(key, String(value));
  }
  if (page && page > 1) params.set("page", String(page));
  return params;
}

export function activeFilterCount(filters: WorkOrderFilters): number {
  return WORK_ORDER_FILTER_KEYS.filter((key) => filters[key] !== null).length;
}

export function pageNumber(params: SearchParamsInput): number {
  const value = read(params, "page");
  return /^\d{1,6}$/.test(value) ? Math.max(1, Number(value)) : 1;
}
