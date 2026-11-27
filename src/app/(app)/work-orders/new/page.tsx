import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { db } from "@/db/client";
import { WorkOrderForm } from "@/features/work-orders/components/work-order-form";
import { getWorkOrderFormOptions } from "@/features/work-orders/service";
import { requirePermission } from "@/lib/dal";

export const metadata: Metadata = { title: "สร้างใบงาน" };

/** WO-01..09 · design 02 §3.3 — Maker, Admin. */
export default function NewWorkOrderPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewWorkOrderContent />
    </Suspense>
  );
}

async function NewWorkOrderContent() {
  await requirePermission("workOrder.create");
  const options = await getWorkOrderFormOptions(db);
  return (
    <>
      <PageHeader title="สร้างใบงาน" description="เลขที่ใบงานจะออกให้อัตโนมัติเมื่อกดบันทึก" />
      <WorkOrderForm options={options} />
    </>
  );
}
