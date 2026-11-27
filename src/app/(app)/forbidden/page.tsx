import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "ไม่มีสิทธิ์เข้าถึง" };

/** Where requirePermission() sends a signed-in user who lacks the role (ADR-0009). */
export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <ShieldAlert className="size-10 text-destructive" aria-hidden />
      <h1 className="text-xl font-semibold">ไม่มีสิทธิ์เข้าถึงหน้านี้</h1>
      <p className="text-muted-foreground">
        บัญชีของคุณไม่มีสิทธิ์ใช้งานหน้านี้ หากคิดว่าไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ
      </p>
      <Link href="/" className={buttonVariants()}>
        กลับหน้าแรก
      </Link>
    </div>
  );
}
