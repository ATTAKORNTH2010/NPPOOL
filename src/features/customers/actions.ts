"use server";

import { deleteSchema, setActiveSchema, type DeleteInput, type SetActiveInput } from "@/features/master-data/schemas";
import { runAction } from "@/lib/server-action";
import { customerSchema, updateCustomerSchema, type CustomerFormValues } from "./schemas";
import * as service from "./service";

const permission = "masterData.manage";

export async function createCustomerAction(input: CustomerFormValues) {
  return runAction({ permission, schema: customerSchema, input, success: "เพิ่มผู้ว่าจ้างแล้ว" }, (ctx, data) =>
    service.createCustomer(ctx.db, ctx.actorId, data),
  );
}

export async function updateCustomerAction(input: CustomerFormValues & { id: number }) {
  return runAction({ permission, schema: updateCustomerSchema, input, success: "บันทึกผู้ว่าจ้างแล้ว" }, (ctx, data) =>
    service.updateCustomer(ctx.db, ctx.actorId, data),
  );
}

export async function setCustomerActiveAction(input: SetActiveInput) {
  return runAction(
    { permission, schema: setActiveSchema, input, success: input.active ? "เปิดใช้งานแล้ว" : "ปิดใช้งานแล้ว" },
    (ctx, data) => service.setCustomerActive(ctx.db, ctx.actorId, data),
  );
}

export async function deleteCustomerAction(input: DeleteInput) {
  return runAction({ permission, schema: deleteSchema, input, success: "ลบผู้ว่าจ้างแล้ว" }, (ctx, data) =>
    service.deleteCustomer(ctx.db, data),
  );
}
