"use server";

import { z } from "zod";
import { runAction } from "@/lib/server-action";
import { idSchema } from "@/lib/validation";
import { workOrderSchema, type WorkOrderFormValues } from "./schemas";
import * as service from "./service";

/** WO-01/02: saves and returns the new id + number so the page can open it. */
export async function createWorkOrderAction(input: WorkOrderFormValues) {
  return runAction(
    {
      permission: "workOrder.create",
      schema: workOrderSchema,
      input,
      success: (created: { workOrderNo: string }) => `บันทึกใบงาน ${created.workOrderNo} แล้ว`,
    },
    (ctx, data) => service.createWorkOrder(ctx.db, ctx.actorId, data),
  );
}

/** WO-13: Maker and Admin only (workOrder.cancel). */
export async function cancelWorkOrderAction(input: { id: number }) {
  return runAction(
    { permission: "workOrder.cancel", schema: z.object({ id: idSchema }), input, success: "ยกเลิกใบงานแล้ว" },
    (ctx, data) => service.cancelWorkOrder(ctx.db, ctx.actorId, data.id),
  );
}
