"use server";

import { deleteSchema, setActiveSchema, type DeleteInput, type SetActiveInput } from "@/features/master-data/schemas";
import { runAction } from "@/lib/server-action";
import { driverSchema, updateDriverSchema, type DriverFormValues } from "./schemas";
import * as service from "./service";

const permission = "masterData.manage";

export async function createDriverAction(input: DriverFormValues) {
  return runAction({ permission, schema: driverSchema, input, success: "เพิ่มพนักงานขับรถแล้ว" }, (ctx, data) =>
    service.createDriver(ctx.db, ctx.actorId, data),
  );
}

export async function updateDriverAction(input: DriverFormValues & { id: number }) {
  return runAction({ permission, schema: updateDriverSchema, input, success: "บันทึกพนักงานขับรถแล้ว" }, (ctx, data) =>
    service.updateDriver(ctx.db, ctx.actorId, data),
  );
}

export async function setDriverActiveAction(input: SetActiveInput) {
  return runAction(
    { permission, schema: setActiveSchema, input, success: input.active ? "เปิดใช้งานแล้ว" : "ปิดใช้งานแล้ว" },
    (ctx, data) => service.setDriverActive(ctx.db, ctx.actorId, data),
  );
}

export async function deleteDriverAction(input: DeleteInput) {
  return runAction({ permission, schema: deleteSchema, input, success: "ลบพนักงานขับรถแล้ว" }, (ctx, data) =>
    service.deleteDriver(ctx.db, data),
  );
}
