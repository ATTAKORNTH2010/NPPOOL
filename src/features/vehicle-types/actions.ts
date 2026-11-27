"use server";

import { deleteSchema, setActiveSchema, type DeleteInput, type SetActiveInput } from "@/features/master-data/schemas";
import { runAction } from "@/lib/server-action";
import { updateVehicleTypeSchema, vehicleTypeSchema, type VehicleTypeFormValues } from "./schemas";
import * as service from "./service";

const permission = "masterData.manage";

export async function createVehicleTypeAction(input: VehicleTypeFormValues) {
  return runAction({ permission, schema: vehicleTypeSchema, input, success: "เพิ่มประเภทรถแล้ว" }, (ctx, data) =>
    service.createVehicleType(ctx.db, ctx.actorId, data),
  );
}

export async function updateVehicleTypeAction(input: VehicleTypeFormValues & { id: number }) {
  return runAction(
    { permission, schema: updateVehicleTypeSchema, input, success: "บันทึกประเภทรถแล้ว" },
    (ctx, data) => service.updateVehicleType(ctx.db, ctx.actorId, data),
  );
}

export async function setVehicleTypeActiveAction(input: SetActiveInput) {
  return runAction(
    { permission, schema: setActiveSchema, input, success: input.active ? "เปิดใช้งานแล้ว" : "ปิดใช้งานแล้ว" },
    (ctx, data) => service.setVehicleTypeActive(ctx.db, ctx.actorId, data),
  );
}

export async function deleteVehicleTypeAction(input: DeleteInput) {
  return runAction({ permission, schema: deleteSchema, input, success: "ลบประเภทรถแล้ว" }, (ctx, data) =>
    service.deleteVehicleType(ctx.db, data),
  );
}
