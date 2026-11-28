import { z } from "zod";
import { idSchema, requiredText } from "@/lib/validation";

/**
 * ราคาน้ำมัน (บาท/ลิตร) ที่เลือกได้: 25–50 ทีละ 1 บาท (user request
 * 2026-11-28). The database checks the same range (route_rates_fuel_price_check).
 */
export const FUEL_PRICE_MIN = 25;
export const FUEL_PRICE_MAX = 50;
export const FUEL_PRICES: readonly number[] = Array.from(
  { length: FUEL_PRICE_MAX - FUEL_PRICE_MIN + 1 },
  (_, index) => FUEL_PRICE_MIN + index,
);

/** Typed by hand: ≥ 0 with at most 2 decimals; commas are accepted and dropped, e.g. "3,500.50" → "3500.50". */
export const priceSchema = z
  .string()
  .trim()
  .min(1, "กรุณากรอกราคา")
  .transform((value) => value.replace(/,/g, ""))
  .pipe(z.string().regex(/^\d{1,12}(\.\d{1,2})?$/, "ราคาต้องเป็นตัวเลขไม่ติดลบ ทศนิยมไม่เกิน 2 ตำแหน่ง"));

const FUEL_PRICE_RANGE = `ราคาน้ำมันต้องอยู่ระหว่าง ${FUEL_PRICE_MIN}–${FUEL_PRICE_MAX} บาท`;

/** One transport price at one fuel price. Form values are strings, as the inputs give them. */
export const routeRateSchema = z.object({
  fuelPrice: z
    .string()
    .regex(/^\d+$/, "กรุณาเลือกราคาน้ำมัน")
    .transform(Number)
    .pipe(z.number().int().min(FUEL_PRICE_MIN, FUEL_PRICE_RANGE).max(FUEL_PRICE_MAX, FUEL_PRICE_RANGE)),
  price: priceSchema,
});

/**
 * MD-04 · BR-MD-04, changed by the user request of 2026-11-28: pickup,
 * drop-off, vehicle type and at least one transport price are required. Each
 * fuel price appears once. Checked in the browser and again on the server.
 */
export const routeSchema = z.object({
  pickupLocation: requiredText("กรุณากรอกสถานที่รับ", 200),
  dropoffLocation: requiredText("กรุณากรอกสถานที่ส่ง", 200),
  vehicleTypeId: z.string().regex(/^\d+$/, "กรุณาเลือกประเภทรถ").transform(Number),
  rates: z
    .array(routeRateSchema)
    .min(1, "กรุณาเพิ่มราคาขนส่งอย่างน้อย 1 ราคา")
    .superRefine((rates, ctx) => {
      const seen = new Set<number>();
      for (const rate of rates) {
        if (seen.has(rate.fuelPrice)) {
          ctx.addIssue({ code: "custom", message: `ราคาน้ำมัน ${rate.fuelPrice} บาท มีมากกว่า 1 ราคา` });
          return;
        }
        seen.add(rate.fuelPrice);
      }
    }),
});
export const updateRouteSchema = routeSchema.extend({ id: idSchema });

/**
 * The dialog's own check (browser only): a price still typed in the add row
 * must be added with + or cleared before saving, so it is never lost silently.
 */
export const routeDialogSchema = routeSchema.extend({
  draftPrice: z.string().refine((value) => value.trim() === "", "กด + เพื่อเพิ่มราคาที่กรอกไว้ หรือลบออกก่อนบันทึก"),
});

export type RouteRateFormValues = z.input<typeof routeRateSchema>;
export type RouteDialogValues = z.input<typeof routeDialogSchema>;
export type RouteDialogOutput = z.output<typeof routeDialogSchema>;
export type RouteFormValues = z.input<typeof routeSchema>;
export type RouteInput = z.output<typeof routeSchema>;
export type UpdateRouteInput = z.output<typeof updateRouteSchema>;
