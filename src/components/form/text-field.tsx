"use client";

import { useId } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/** A labelled text input (or textarea) bound to react-hook-form, error shown in Thai below it. */
export function TextField<T extends FieldValues, TTransformed = T>({
  control,
  name,
  label,
  description,
  multiline = false,
  type = "text",
  inputMode,
  list,
  placeholder,
}: {
  control: Control<T, unknown, TTransformed>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  multiline?: boolean;
  type?: "text" | "tel";
  inputMode?: "text" | "decimal" | "numeric" | "tel";
  list?: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          {multiline ? (
            <Textarea {...field} id={id} rows={3} placeholder={placeholder} aria-invalid={fieldState.invalid} />
          ) : (
            <Input
              {...field}
              id={id}
              type={type}
              inputMode={inputMode}
              list={list}
              placeholder={placeholder}
              autoComplete="off"
              aria-invalid={fieldState.invalid}
            />
          )}
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
