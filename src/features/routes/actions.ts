"use server";

import { masterDataActivity } from "@/features/master-data/activity";
import { deleteSchema, setActiveSchema, type DeleteInput, type SetActiveInput } from "@/features/master-data/schemas";
import { runAction } from "@/lib/server-action";
import {
  routeSchema,
  updateRouteSchema,
  type RouteFormValues,
  type RouteInput,
  type UpdateRouteInput,
} from "./schemas";
import * as service from "./service";

const permission = "masterData.manage";
const log = masterDataActivity("routes", "สถานที่รับ-ส่ง");
const pair = (data: RouteInput) => `${data.pickupLocation} → ${data.dropoffLocation} (${data.price} บาท)`;

export async function createRouteAction(input: RouteFormValues) {
  return runAction(
    { permission, schema: routeSchema, input, success: "เพิ่มสถานที่รับ-ส่งแล้ว", activity: log.create(pair) },
    (ctx, data) => service.createRoute(ctx.db, ctx.actorId, data),
  );
}

export async function updateRouteAction(input: RouteFormValues & { id: number }) {
  return runAction(
    {
      permission,
      schema: updateRouteSchema,
      input,
      success: "บันทึกสถานที่รับ-ส่งแล้ว",
      activity: log.update((data: UpdateRouteInput) => pair(data)),
    },
    (ctx, data) => service.updateRoute(ctx.db, ctx.actorId, data),
  );
}

export async function setRouteActiveAction(input: SetActiveInput) {
  return runAction(
    {
      permission,
      schema: setActiveSchema,
      input,
      success: input.active ? "เปิดใช้งานแล้ว" : "ปิดใช้งานแล้ว",
      activity: log.setActive,
    },
    (ctx, data) => service.setRouteActive(ctx.db, ctx.actorId, data),
  );
}

export async function deleteRouteAction(input: DeleteInput) {
  return runAction(
    { permission, schema: deleteSchema, input, success: "ลบสถานที่รับ-ส่งแล้ว", activity: log.delete },
    (ctx, data) => service.deleteRoute(ctx.db, data),
  );
}
