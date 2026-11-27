"use server";

import { z } from "zod";
import { RuleError } from "@/lib/action-result";
import { runAction } from "@/lib/server-action";
import { idSchema } from "@/lib/validation";
import { workOrderSchema, type WorkOrderFormValues } from "./schemas";
import * as service from "./service";

type Saved = { id: number; workOrderNo: string };

/** WO-01/02: saves and returns the new id + number so the page can open it. */
export async function createWorkOrderAction(input: WorkOrderFormValues) {
  return runAction(
    {
      permission: "workOrder.create",
      schema: workOrderSchema,
      input,
      success: (created: Saved) => `บันทึกใบงาน ${created.workOrderNo} แล้ว`,
      activity: {
        module: "workOrders",
        action: "create",
        entityId: (_, created) => created.id,
        detail: (_, created) => `สร้างใบงาน ${created.workOrderNo}`,
      },
    },
    (ctx, data) => service.createWorkOrder(ctx.db, ctx.actorId, data),
  );
}

const editTargetSchema = z.object({ id: idSchema, version: z.string().min(1).max(40) });

/** WO-14: `target.version` is the updated_at the form was opened with (optimistic lock). */
export async function updateWorkOrderAction(target: { id: number; version: string }, input: WorkOrderFormValues) {
  return runAction(
    {
      permission: "workOrder.edit",
      schema: workOrderSchema,
      input,
      success: (saved: Saved) => `บันทึกการแก้ไขใบงาน ${saved.workOrderNo} แล้ว`,
      activity: {
        module: "workOrders",
        action: "update",
        entityId: (_, saved) => saved.id,
        detail: (_, saved) => `แก้ไขใบงาน ${saved.workOrderNo}`,
      },
    },
    (ctx, data) => {
      const parsed = editTargetSchema.safeParse(target);
      if (!parsed.success) throw new RuleError("ไม่พบใบงาน");
      return service.updateWorkOrder(ctx.db, ctx.actorId, parsed.data.id, parsed.data.version, data);
    },
  );
}

/** WO-13: Maker and Admin only (workOrder.cancel). */
export async function cancelWorkOrderAction(input: { id: number }) {
  return runAction(
    {
      permission: "workOrder.cancel",
      schema: z.object({ id: idSchema }),
      input,
      success: (cancelled: { workOrderNo: string }) => `ยกเลิกใบงาน ${cancelled.workOrderNo} แล้ว`,
      activity: {
        module: "workOrders",
        action: "cancel",
        entityId: (data) => data.id,
        detail: (_, cancelled) => `ยกเลิกใบงาน ${cancelled.workOrderNo}`,
      },
    },
    (ctx, data) => service.cancelWorkOrder(ctx.db, ctx.actorId, data.id),
  );
}

const deleteSchema = z.object({
  ids: z
    .array(idSchema)
    .min(1, "กรุณาเลือกใบงาน")
    .max(500, "ลบได้ครั้งละไม่เกิน 500 ใบ")
    .transform((ids) => [...new Set(ids)]),
});

/** Delete = hide, one or many at once (ADR-0010 addendum, user request 2026-11-27). */
export async function deleteWorkOrdersAction(input: { ids: number[] }) {
  return runAction(
    {
      permission: "workOrder.delete",
      schema: deleteSchema,
      input,
      success: (deleted: { workOrderNos: string[] }) =>
        deleted.workOrderNos.length === 1
          ? `ลบใบงาน ${deleted.workOrderNos[0]} แล้ว`
          : `ลบใบงาน ${deleted.workOrderNos.length} ใบแล้ว`,
      activity: {
        module: "workOrders",
        action: "delete",
        entityId: (data) => data.ids.join(","),
        detail: (_, deleted) => `ลบใบงาน ${deleted.workOrderNos.join(", ")}`,
      },
    },
    (ctx, data) => service.deleteWorkOrders(ctx.db, ctx.actorId, data.ids),
  );
}
