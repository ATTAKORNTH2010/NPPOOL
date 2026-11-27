import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { db } from "@/db/client";
import { WorkOrderForm } from "@/features/work-orders/components/work-order-form";
import { WorkOrderNotice } from "@/features/work-orders/components/work-order-notice";
import {
  getWorkOrder,
  getWorkOrderForEdit,
  getWorkOrderFormOptions,
  wasWorkOrderDeleted,
} from "@/features/work-orders/service";
import { requirePermission } from "@/lib/dal";

export const metadata: Metadata = { title: "แก้ไขใบงาน" };

/** WO-14 (user request 2026-11-27) — Maker, Admin; cancelled or deleted work orders cannot be edited. */
export default function EditWorkOrderPage({ params }: PageProps<"/work-orders/[id]/edit">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EditWorkOrderContent params={params} />
    </Suspense>
  );
}

async function EditWorkOrderContent({ params }: Pick<PageProps<"/work-orders/[id]/edit">, "params">) {
  await requirePermission("workOrder.edit");
  const { id: raw } = await params;
  if (!/^\d{1,9}$/.test(raw)) notFound();
  const id = Number(raw);

  const edit = await getWorkOrderForEdit(db, id);
  if (!edit) {
    if (await wasWorkOrderDeleted(db, id)) return <WorkOrderNotice title="ใบงานนี้ถูกลบแล้ว" />;
    const order = await getWorkOrder(db, id);
    if (!order) notFound();
    return (
      <WorkOrderNotice
        title={`ใบงาน ${order.workOrderNo} ถูกยกเลิกแล้ว จึงแก้ไขไม่ได้`}
        href={`/work-orders/${id}`}
        linkText="กลับไปดูใบงาน"
      />
    );
  }

  const options = await getWorkOrderFormOptions(db, edit.refs);
  return (
    <>
      <PageHeader
        title={`แก้ไขใบงาน ${edit.workOrderNo}`}
        description="เลขที่ใบงานไม่เปลี่ยน · ระบบบันทึกชื่อผู้แก้ไขและเวลาไว้"
      />
      {/* A new version (someone saved) gives a fresh form with the saved values. */}
      <WorkOrderForm key={edit.version} options={options} edit={edit} />
    </>
  );
}
