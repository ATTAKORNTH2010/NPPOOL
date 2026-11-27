import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/db/client";
import { JobOrderSheet } from "@/features/work-orders/components/job-order-sheet";
import { PrintToolbar } from "@/features/work-orders/components/print-toolbar";
import { WorkOrderNotice } from "@/features/work-orders/components/work-order-notice";
import { getWorkOrder, wasWorkOrderDeleted } from "@/features/work-orders/service";
import { requirePermission } from "@/lib/dal";

// The toolbar renames the tab to JobOrder_{เลขที่} so "Save as PDF" suggests that file name.
export const metadata: Metadata = { title: { absolute: "JobOrder" } };

/** WO-12 · ADR-0005 A · design 02 §3.5 — every role may print. */
export default function PrintJobOrderPage({ params }: PageProps<"/work-orders/[id]/print">) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-neutral-600">กำลังเตรียมใบสั่งปฏิบัติงาน…</p>}>
      <PrintContent params={params} />
    </Suspense>
  );
}

async function PrintContent({ params }: Pick<PageProps<"/work-orders/[id]/print">, "params">) {
  await requirePermission("workOrder.print");
  const { id: raw } = await params;
  if (!/^\d{1,9}$/.test(raw)) notFound();
  const id = Number(raw);
  const order = await getWorkOrder(db, id);
  if (!order) {
    if (await wasWorkOrderDeleted(db, id)) {
      return (
        <div className="mx-auto max-w-xl bg-background p-6">
          <WorkOrderNotice title="ใบงานนี้ถูกลบแล้ว จึงพิมพ์ไม่ได้" />
        </div>
      );
    }
    notFound();
  }

  return (
    <>
      <PrintToolbar title={`JobOrder_${order.workOrderNo}`} />
      <JobOrderSheet order={order} />
    </>
  );
}
