"use server";

import { deleteSchema, setActiveSchema, type DeleteInput, type SetActiveInput } from "@/features/master-data/schemas";
import { runAction } from "@/lib/server-action";
import { updateVehicleSchema, vehicleSchema, type VehicleFormValues } from "./schemas";
import * as service from "./service";

const permission = "masterData.manage";

export async function createVehicleAction(input: VehicleFormValues) {
  return runAction({ permission, schema: vehicleSchema, input, success: "บันทึกข้อมูลรถเรียบร้อยแล้ว" }, (ctx, data) =>
    service.createVehicle(ctx.db, ctx.actorId, data),
  );
}

export async function updateVehicleAction(input: VehicleFormValues & { id: number }) {
  return runAction(
    { permission, schema: updateVehicleSchema, input, success: "บันทึกข้อมูลรถเรียบร้อยแล้ว" },
    (ctx, data) => service.updateVehicle(ctx.db, ctx.actorId, data),
  );
}

export async function setVehicleActiveAction(input: SetActiveInput) {
  return runAction(
    { permission, schema: setActiveSchema, input, success: input.active ? "เปิดใช้งานแล้ว" : "ปิดใช้งานแล้ว" },
    (ctx, data) => service.setVehicleActive(ctx.db, ctx.actorId, data),
  );
}

export async function deleteVehicleAction(input: DeleteInput) {
  return runAction({ permission, schema: deleteSchema, input, success: "ลบรถแล้ว" }, (ctx, data) =>
    service.deleteVehicle(ctx.db, data),
  );
}
