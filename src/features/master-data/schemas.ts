import { z } from "zod";
import { idSchema } from "@/lib/validation";

/** Inputs shared by every master-data screen (MD-08: deactivate instead of delete). */
export const setActiveSchema = z.object({ id: idSchema, active: z.boolean() });
export type SetActiveInput = z.infer<typeof setActiveSchema>;

export const deleteSchema = z.object({ id: idSchema });
export type DeleteInput = z.infer<typeof deleteSchema>;
