"use client";

import { Printer, X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * ADR-0005 A: opens the browser's print dialog once the fonts are ready.
 * The document title becomes the PDF file name, e.g. JobOrder_NP2569110001.
 */
export function PrintToolbar({ title }: { title: string }) {
  useEffect(() => {
    document.title = title;
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) window.print();
    });
    return () => {
      cancelled = true;
    };
  }, [title]);

  return (
    <div className="no-print mx-auto mb-4 flex w-[277mm] max-w-full flex-wrap items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm">
      <Button onClick={() => window.print()}>
        <Printer />
        พิมพ์ / บันทึกเป็น PDF
      </Button>
      <Button variant="outline" onClick={() => window.close()}>
        <X />
        ปิดหน้านี้
      </Button>
      <p className="text-muted-foreground">
        ได้ไฟล์ PDF: เลือกเครื่องพิมพ์ “บันทึกเป็น PDF” · แนวนอน A4 · ปิด “หัวกระดาษและท้ายกระดาษ” · เปิด “กราฟิกพื้นหลัง”
      </p>
    </div>
  );
}
