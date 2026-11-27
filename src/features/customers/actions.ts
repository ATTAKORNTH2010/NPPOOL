"use server";

import { masterDataActivity } from "@/features/master-data/activity";
import { deleteSchema, setActiveSchema, type DeleteInput, type SetActiveInput } from "@/features/master-data/schemas";
import { runAction } from "@/lib/server-action";
import {
  customerSchema,
  updateCustomerSchema,
  type CustomerFormValues,
  type CustomerInput,
  type UpdateCustomerInput,
} from "./schemas";
import * as service from "./service";

const permission = "masterData.manage";
const log = masterDataActivity("customers", "ผู้ว่าจ้าง");

export async function createCustomerAction(input: CustomerFormValues) {
  return runAction(
    {
      permission,
      schema: customerSchema,
      input,
      success: "เพิ่มผู้ว่าจ้างแล้ว",
      activity: log.create((data: CustomerInput) => data.name),
    },
    (ctx, data) => service.createCustomer(ctx.db, ctx.actorId, data),
  );
}

export async function updateCustomerAction(input: CustomerFormValues & { id: number }) {
  return runAction(
    {
      permission,
      schema: updateCustomerSchema,
      input,
      success: "บันทึกผู้ว่าจ้างแล้ว",
      activity: log.update((data: UpdateCustomerInput) => data.name),
    },
    (ctx, data) => service.updateCustomer(ctx.db, ctx.actorId, data),
  );
}

export async function setCustomerActiveAction(input: SetActiveInput) {
  return runAction(
    {
      permission,
      schema: setActiveSchema,
      input,
      success: input.active ? "เปิดใช้งานแล้ว" : "ปิดใช้งานแล้ว",
      activity: log.setActive,
    },
    (ctx, data) => service.setCustomerActive(ctx.db, ctx.actorId, data),
  );
}

export async function deleteCustomerAction(input: DeleteInput) {
  return runAction(
    { permission, schema: deleteSchema, input, success: "ลบผู้ว่าจ้างแล้ว", activity: log.delete },
    (ctx, data) => service.deleteCustomer(ctx.db, data),
  );
}
