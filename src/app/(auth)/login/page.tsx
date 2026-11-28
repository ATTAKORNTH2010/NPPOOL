import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/layout/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SITE } from "@/config/site";
import { getCurrentUser } from "@/lib/dal";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

/** AUTH-01. No sign-up link: admins create accounts (design 02, section 3.1). */
export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* The logo has a white background: a white badge keeps it tidy in dark mode too. */}
        <div className="self-center rounded-xl bg-white px-4 py-2 shadow-sm ring-1 ring-foreground/10">
          <Logo className="h-24 w-auto" />
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">เข้าสู่ระบบ</CardTitle>
            <CardDescription>
              {SITE.name} {SITE.tagline}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          ยังไม่มีบัญชีหรือลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ
        </p>
      </div>
    </main>
  );
}

async function RedirectIfSignedIn() {
  if (await getCurrentUser()) redirect("/");
  return null;
}
