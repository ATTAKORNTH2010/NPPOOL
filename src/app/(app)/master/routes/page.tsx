import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { db } from "@/db/client";
import { RoutesManager } from "@/features/routes/components/routes-manager";
import { listRoutes } from "@/features/routes/service";
import { requirePermission } from "@/lib/dal";

export const metadata: Metadata = { title: "สถานที่รับ-ส่ง" };

/** MD-04 · design 02, section 3.6 — admin only (the legacy page had no check at all, S3). */
export default function RoutesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RoutesContent />
    </Suspense>
  );
}

async function RoutesContent() {
  await requirePermission("masterData.manage");
  const rows = await listRoutes(db);
  return (
    <>
      <PageHeader title="สถานที่รับ-ส่ง" description={`ทั้งหมด ${rows.length} เส้นทาง`} />
      <RoutesManager rows={rows} />
    </>
  );
}
