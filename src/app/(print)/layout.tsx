import { Sarabun } from "next/font/google";
import { Suspense } from "react";
import { ActivityTracker } from "@/components/layout/activity-tracker";

// Thai document font for printed forms (ADR-0005, ADR-0006).
const sarabun = Sarabun({
  weight: ["400", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

/** Print pages: no sidebar or menu, white paper in light and dark mode alike. */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${sarabun.className} min-h-full bg-neutral-200 py-6 print:bg-white print:py-0`}>
      <style>{`
        @page { size: A4 landscape; margin: 8mm; }
        @media print {
          .no-print { display: none !important; }
          html, body { background: #fff !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      {children}
      <Suspense fallback={null}>
        <ActivityTracker />
      </Suspense>
    </div>
  );
}
