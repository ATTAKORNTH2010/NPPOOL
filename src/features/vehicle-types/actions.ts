"use server";

import { masterDataActivity } from "@/features/master-data/activity";
import { deleteSchema, setActiveSchema, type DeleteInput, type SetActiveInput } from "@/features/master-data/schemas";
import { runAction } from "@/lib/server-action";
import {
  updateVehicleTypeSchema,
  vehicleTypeSchema,
  type UpdateVehicleTypeInput,
  type VehicleTypeFormValues,
  type VehicleTypeInput,
} from "./schemas";
import * as service from "./service";

const permission = "masterData.manage";
const log = masterDataActivity("vehicleTypes", "ประเภทรถ");

export async function createVehicleTypeAction(input: VehicleTypeFormValues) {
  return runAction(
    {
      permission,
      schema: vehicleTypeSchema,
      input,
      success: "เพิ่มประเภทรถแล้ว",
      activity: log.create((data: VehicleTypeInput) => `${data.code} ${data.name}`),
    },
    (ctx, data) => service.createVehicleType(ctx.db, ctx.actorId, data),
  );
}

export async function updateVehicleTypeAction(input: VehicleTypeFormValues & { id: number }) {
  return runAction(
    {
      permission,
      schema: updateVehicleTypeSchema,
      input,
      success: "บันทึกประเภทรถแล้ว",
      activity: log.update((data: UpdateVehicleTypeInput) => `${data.code} ${data.name}`),
    },
    (ctx, data) => service.updateVehicleType(ctx.db, ctx.actorId, data),
  );
}

export async function setVehicleTypeActiveAction(input: SetActiveInput) {
  return runAction(
    {
      permission,
      schema: setActiveSchema,
      input,
      success: input.active ? "เปิดใช้งานแล้ว" : "ปิดใช้งานแล้ว",
      activity: log.setActive,
    },
    (ctx, data) => service.setVehicleTypeActive(ctx.db, ctx.actorId, data),
  );
}

export async function deleteVehicleTypeAction(input: DeleteInput) {
  return runAction(
    { permission, schema: deleteSchema, input, success: "ลบประเภทรถแล้ว", activity: log.delete },
    (ctx, data) => service.deleteVehicleType(ctx.db, data),
  );
}
