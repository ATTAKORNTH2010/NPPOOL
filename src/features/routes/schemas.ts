import { z } from "zod";
import { idSchema, requiredText } from "@/lib/validation";

/**
 * MD-04 · BR-MD-04: pickup, drop-off and price are required, now checked on
 * the server too. Price ≥ 0 with at most 2 decimals; commas are accepted.
 */
export const routeSchema = z.object({
  pickupLocation: requiredText("กรุณากรอกสถานที่รับ", 200),
  dropoffLocation: requiredText("กรุณากรอกสถานที่ส่ง", 200),
  price: z
    .string()
    .trim()
    .min(1, "กรุณากรอกราคา")
    .transform((value) => value.replace(/,/g, ""))
    .pipe(z.string().regex(/^\d{1,12}(\.\d{1,2})?$/, "ราคาต้องเป็นตัวเลขไม่ติดลบ ทศนิยมไม่เกิน 2 ตำแหน่ง")),
});
export const updateRouteSchema = routeSchema.extend({ id: idSchema });

export type RouteFormValues = z.input<typeof routeSchema>;
export type RouteInput = z.output<typeof routeSchema>;
export type UpdateRouteInput = z.output<typeof updateRouteSchema>;
