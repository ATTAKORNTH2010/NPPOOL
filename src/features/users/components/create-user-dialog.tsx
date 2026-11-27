"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, UserPlus } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createUserAction } from "../actions";
import { createUserSchema, type CreateUserInput } from "../schemas";
import { applyFieldErrors } from "./form-errors";
import { RoleSelect } from "./role-select";

const EMPTY: CreateUserInput = { username: "", name: "", phone: "", role: "maker", password: "" };

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const form = useForm<CreateUserInput>({ resolver: zodResolver(createUserSchema), defaultValues: EMPTY });
  const submitting = form.formState.isSubmitting;

  async function onSubmit(values: CreateUserInput) {
    const result = await createUserAction(values);
    if (!result.ok) {
      applyFieldErrors(result, form.setError);
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    form.reset(EMPTY);
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset(EMPTY);
      }}
    >
      <DialogTrigger render={<Button />}>
        <UserPlus />
        เพิ่มผู้ใช้
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>เพิ่มผู้ใช้</DialogTitle>
            <DialogDescription>ผู้ใช้เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่านเริ่มต้นนี้</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Controller
              name="username"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="new-user-username">ชื่อผู้ใช้</FieldLabel>
                  <Input
                    {...field}
                    id="new-user-username"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>a–z, 0–9, _ และ . ยาว 3–30 ตัว (ไม่สนตัวพิมพ์เล็ก-ใหญ่)</FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="new-user-name">ชื่อ-นามสกุล</FieldLabel>
                  <Input {...field} id="new-user-name" autoComplete="off" aria-invalid={fieldState.invalid} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="new-user-phone">เบอร์โทร (ไม่บังคับ)</FieldLabel>
                  <Input {...field} id="new-user-phone" type="tel" autoComplete="off" aria-invalid={fieldState.invalid} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="role"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="new-user-role">บทบาท</FieldLabel>
                  <RoleSelect id="new-user-role" value={field.value} onChange={field.onChange} invalid={fieldState.invalid} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="new-user-password">รหัสผ่านเริ่มต้น</FieldLabel>
                  <Input
                    {...field}
                    id="new-user-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>อย่างน้อย 8 ตัว มีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และสัญลักษณ์</FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>ยกเลิก</DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
              บันทึก
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
