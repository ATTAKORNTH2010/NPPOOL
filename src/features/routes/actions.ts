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

/** e.g. "ลาดกระบัง → แหลมฉบัง · รถ 6 ล้อ · 3 ราคา (น้ำมัน 25–27 บาท)" */
function routeSummary(data: RouteInput, saved: service.SavedRoute): string {
  const fuels = data.rates.map((rate) => rate.fuelPrice).sort((a, b) => a - b);
  const range = fuels.length > 1 ? `${fuels[0]}–${fuels[fuels.length - 1]}` : `${fuels[0]}`;
  return `${data.pickupLocation} → ${data.dropoffLocation} · ${saved.vehicleTypeName} · ${fuels.length} ราคา (น้ำมัน ${range} บาท)`;
}

export async function createRouteAction(input: RouteFormValues) {
  return runAction<RouteInput, service.SavedRoute>(
    {
      permission,
      schema: routeSchema,
      input,
      success: "เพิ่มสถานที่รับ-ส่งแล้ว",
      activity: {
        module: "routes",
        action: "create",
        entityId: (_data, saved) => saved.id,
        detail: (data, saved) => `เพิ่มสถานที่รับ-ส่ง ${routeSummary(data, saved)}`,
      },
    },
    (ctx, data) => service.createRoute(ctx.db, ctx.actorId, data),
  );
}

export async function updateRouteAction(input: RouteFormValues & { id: number }) {
  return runAction<UpdateRouteInput, service.SavedRoute>(
    {
      permission,
      schema: updateRouteSchema,
      input,
      success: "บันทึกสถานที่รับ-ส่งแล้ว",
      activity: {
        module: "routes",
        action: "update",
        entityId: (data) => data.id,
        detail: (data, saved) => `แก้ไขสถานที่รับ-ส่ง ${routeSummary(data, saved)}`,
      },
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
