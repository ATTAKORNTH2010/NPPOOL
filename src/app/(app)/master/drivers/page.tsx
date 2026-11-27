import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { db } from "@/db/client";
import { DriversManager } from "@/features/drivers/components/drivers-manager";
import { listDrivers } from "@/features/drivers/service";
import { requirePermission } from "@/lib/dal";

export const metadata: Metadata = { title: "พนักงานขับรถ" };

/** MD-03 · design 02, section 3.6 — admin only. */
export default function DriversPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DriversContent />
    </Suspense>
  );
}

async function DriversContent() {
  await requirePermission("masterData.manage");
  const rows = await listDrivers(db);
  return (
    <>
      <PageHeader title="พนักงานขับรถ" description={`ทั้งหมด ${rows.length} คน`} />
      <DriversManager rows={rows} />
    </>
  );
}
