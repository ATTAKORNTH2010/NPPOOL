"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { resetPasswordAction } from "../actions";
import { resetPasswordFormSchema } from "../schemas";
import type { UserListItem } from "../service";
import { applyFieldErrors } from "@/components/form/apply-field-errors";

type FormValues = z.infer<typeof resetPasswordFormSchema>;

export function ResetPasswordDialog({
  user,
  isSelf,
  onClose,
}: {
  user: UserListItem;
  isSelf: boolean;
  onClose: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: "", confirm: "" },
  });
  const submitting = form.formState.isSubmitting;

  async function onSubmit(values: FormValues) {
    const result = await resetPasswordAction({ userId: user.id, password: values.password });
    if (!result.ok) {
      applyFieldErrors(result, form.setError);
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>ตั้งรหัสผ่านใหม่</DialogTitle>
            <DialogDescription>
              ผู้ใช้ {user.username}
              {isSelf ? "" : " — จะถูกออกจากระบบทุกเครื่อง และต้องใช้รหัสผ่านใหม่"}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="reset-password">รหัสผ่านใหม่</FieldLabel>
                  <Input
                    {...field}
                    id="reset-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>อย่างน้อย 8 ตัว มีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และสัญลักษณ์</FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="confirm"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="reset-password-confirm">ยืนยันรหัสผ่านใหม่</FieldLabel>
                  <Input
                    {...field}
                    id="reset-password-confirm"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
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
