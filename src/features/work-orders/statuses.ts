/**
 * Work statuses (legacy WorkFlow_Status, values confirmed from the legacy
 * database 2026-11-26). Code 2 = cancelled is tied to a check constraint on
 * work_orders (ADR-0010).
 */
export const WORK_STATUS = {
  OPEN: 1,
  CANCELLED: 2,
  JOB_ORDER_PRINTED: 3,
  VEHICLE_ASSIGNED: 4,
  PRICED: 5,
  CASH_COLLECTED: 6,
  BILLED: 7,
  CHECKED: 8,
} as const;

export type WorkStatusCode = (typeof WORK_STATUS)[keyof typeof WORK_STATUS];

/** Seed rows: code order until the lifecycle order is confirmed (Q10). */
export const WORK_STATUS_SEED: ReadonlyArray<{ code: WorkStatusCode; name: string; sortOrder: number }> = [
  { code: 1, name: "เปิดใบงาน", sortOrder: 1 },
  { code: 2, name: "ยกเลิก", sortOrder: 2 },
  { code: 3, name: "พิมพ์ใบสั่งงาน", sortOrder: 3 },
  { code: 4, name: "จัดรถ", sortOrder: 4 },
  { code: 5, name: "ใส่ราคา", sortOrder: 5 },
  { code: 6, name: "เก็บเงินสด", sortOrder: 6 },
  { code: 7, name: "วางบิล", sortOrder: 7 },
  { code: 8, name: "ตรวจใบงาน", sortOrder: 8 },
];
