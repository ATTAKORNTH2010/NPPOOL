import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { db } from "@/db/client";
import { listVehicleTypes } from "@/features/vehicle-types/service";
import { VehiclesManager } from "@/features/vehicles/components/vehicles-manager";
import { listVehicles } from "@/features/vehicles/service";
import { requirePermission } from "@/lib/dal";

export const metadata: Metadata = { title: "รถ" };

/** MD-02 · design 02, section 3.6 — admin only. */
export default function VehiclesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <VehiclesContent />
    </Suspense>
  );
}

async function VehiclesContent() {
  await requirePermission("masterData.manage");
  const [rows, vehicleTypes] = await Promise.all([listVehicles(db), listVehicleTypes(db)]);
  return (
    <>
      <PageHeader title="รถ" description={`ทั้งหมด ${rows.length} คัน`} />
      <VehiclesManager rows={rows} vehicleTypes={vehicleTypes} />
    </>
  );
}
