import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">ไม่พบหน้าที่ต้องการ</h1>
      <p className="text-muted-foreground">ลิงก์อาจไม่ถูกต้อง หรือหน้านี้ถูกย้ายไปแล้ว</p>
      <Link href="/" className={buttonVariants()}>
        กลับหน้าแรก
      </Link>
    </main>
  );
}
