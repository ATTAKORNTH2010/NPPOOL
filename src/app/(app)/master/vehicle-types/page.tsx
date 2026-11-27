import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { db } from "@/db/client";
import { VehicleTypesManager } from "@/features/vehicle-types/components/vehicle-types-manager";
import { listVehicleTypes } from "@/features/vehicle-types/service";
import { requirePermission } from "@/lib/dal";

export const metadata: Metadata = { title: "ประเภทรถ" };

/** MD-05, pulled into module 2 (D24) — admin only. */
export default function VehicleTypesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <VehicleTypesContent />
    </Suspense>
  );
}

async function VehicleTypesContent() {
  await requirePermission("masterData.manage");
  const rows = await listVehicleTypes(db);
  return (
    <>
      <PageHeader title="ประเภทรถ" description={`ทั้งหมด ${rows.length} ประเภท`} />
      <VehicleTypesManager rows={rows} />
    </>
  );
}
