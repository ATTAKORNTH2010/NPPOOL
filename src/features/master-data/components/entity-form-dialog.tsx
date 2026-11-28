"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm, type DefaultValues, type FieldValues, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { applyFieldErrors } from "@/components/form/apply-field-errors";
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
import { FieldGroup } from "@/components/ui/field";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

/**
 * Add/edit dialog shared by the master-data screens (design 02, section 3.6):
 * Zod check in the browser, Thai errors under the fields, toast on success.
 * The raw form values go to the Server Action, which validates them again.
 */
export function EntityFormDialog<TInput extends FieldValues, TOutput>({
  open,
  onOpenChange,
  title,
  description,
  schema,
  defaultValues,
  submit,
  className,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  schema: z.ZodType<TOutput, TInput>;
  defaultValues: TInput;
  submit: (values: TInput) => Promise<ActionResult<unknown>>;
  /** Width override for forms with more in them, e.g. "sm:max-w-lg". */
  className?: string;
  children: (form: UseFormReturn<TInput, unknown, TOutput>) => React.ReactNode;
}) {
  const form = useForm<TInput, unknown, TOutput>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<TInput>,
  });
  const submitting = form.formState.isSubmitting;

  async function onValid() {
    const result = await submit(form.getValues());
    if (!result.ok) {
      applyFieldErrors(result, form.setError);
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    form.reset(defaultValues);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (submitting) return;
        onOpenChange(next);
        if (!next) form.reset(defaultValues);
      }}
    >
      {/* Long forms scroll inside the dialog instead of running off a short screen. */}
      <DialogContent className={cn("max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-md", className)}>
        <form noValidate onSubmit={form.handleSubmit(onValid)} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          <FieldGroup>{children(form)}</FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />} disabled={submitting}>
              ยกเลิก
            </DialogClose>
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
