"use client";

import { FileSpreadsheet, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function fileName(disposition: string | null): string {
  return /filename="([^"]+)"/.exec(disposition ?? "")?.[1] ?? "work-orders.xlsx";
}

/** Downloads every work order of the current search as .xlsx (user request 2026-11-27). */
export function ExportWorkOrdersButton({ query, total }: { query: string; total: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function download() {
    setPending(true);
    try {
      const response = await fetch(`/api/work-orders/export${query ? `?${query}` : ""}`, { cache: "no-store" });
      const type = response.headers.get("content-type") ?? "";
      if (!response.ok || !type.startsWith(XLSX_MIME)) {
        const body: unknown = type.includes("json") ? await response.json().catch(() => null) : null;
        const message =
          body && typeof body === "object" && "message" in body && typeof body.message === "string"
            ? body.message
            : "ส่งออกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
        toast.error(message);
        if (response.status === 401) router.push("/login");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName(response.headers.get("content-disposition"));
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);

      const count = Number(response.headers.get("x-export-count") ?? 0);
      if (response.headers.get("x-export-truncated") === "1") {
        toast.warning(`ส่งออก ${count.toLocaleString("th-TH")} ใบล่าสุด (ส่งออกได้ครั้งละไม่เกินนี้) กรุณาค้นหาให้แคบลงเพื่อได้ครบทุกใบ`);
      } else {
        toast.success(`ส่งออก Excel ${count.toLocaleString("th-TH")} ใบแล้ว`);
      }
    } catch {
      toast.error("ส่งออกไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" onClick={download} disabled={pending || total === 0}>
      {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <FileSpreadsheet />}
      Export Excel
    </Button>
  );
}
