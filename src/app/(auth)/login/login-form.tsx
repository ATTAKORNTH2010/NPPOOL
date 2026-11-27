"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";

const loginSchema = z.object({
  username: z.string().trim().min(1, "กรุณากรอกชื่อผู้ใช้"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
  rememberMe: z.boolean(),
});

type LoginValues = z.infer<typeof loginSchema>;

/** Design 02, section 3.1. One message for every bad-credential case (no account probing). */
function errorMessage(status: number): string {
  if (status === 429) return "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่";
  if (status === 403) return "บัญชีนี้ถูกระงับการใช้งาน";
  if (status === 400 || status === 401 || status === 422) return "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
  return "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
}

export function LoginForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", rememberMe: false },
  });
  const submitting = form.formState.isSubmitting || redirecting;

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    let status: number | null;
    try {
      const { error } = await authClient.signIn.username(values);
      status = error ? error.status : null;
    } catch {
      status = 0; // network failure
    }
    if (status !== null) {
      setFormError(errorMessage(status));
      form.resetField("password");
      form.setFocus("password");
      return;
    }
    setRedirecting(true);
    router.replace("/");
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        {formError ? (
          <Alert variant="destructive" aria-live="polite">
            <CircleAlert />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <Controller
          name="username"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-username">ชื่อผู้ใช้</FieldLabel>
              <Input
                {...field}
                id="login-username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-password">รหัสผ่าน</FieldLabel>
              <Input
                {...field}
                id="login-password"
                type="password"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="rememberMe"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                id="login-remember"
                name={field.name}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <FieldLabel htmlFor="login-remember" className="font-normal">
                จดจำการเข้าสู่ระบบ
              </FieldLabel>
            </Field>
          )}
        />

        <Button type="submit" disabled={submitting}>
          {submitting ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
          เข้าสู่ระบบ
        </Button>
      </FieldGroup>
    </form>
  );
}
