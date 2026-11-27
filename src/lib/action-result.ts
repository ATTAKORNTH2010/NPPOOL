/**
 * What every Server Action returns. Messages are Thai and safe to show;
 * internal errors never reach the user (design 02, section 4).
 */
export type ActionResult<T = void> =
  | { ok: true; message: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export const GENERIC_ERROR = "ทำรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
export const INVALID_INPUT = "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";

/** A business-rule failure whose message can be shown as is. */
export class RuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuleError";
  }
}
