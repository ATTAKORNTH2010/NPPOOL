import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/db/client";
import { WorkOrderRowMenu } from "@/features/work-orders/components/work-order-row-menu";
import { WorkStatusBadge } from "@/features/work-orders/components/work-status-badge";
import { listWorkOrders } from "@/features/work-orders/service";
import { WORK_STATUS } from "@/features/work-orders/statuses";
import { requirePermission } from "@/lib/dal";
import { formatDateTimeTh, formatMoney } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "รายการใบงาน" };

/** WO-10 · design 02 §3.2 — Maker, Admin, Accounting (view only). */
export default function WorkOrdersPage({ searchParams }: PageProps<"/work-orders">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <WorkOrdersContent searchParams={searchParams} />
    </Suspense>
  );
}

function pageNumber(value: string | string[] | undefined): number {
  const text = Array.isArray(value) ? value[0] : value;
  return text && /^\d{1,6}$/.test(text) ? Number(text) : 1;
}

async function WorkOrdersContent({ searchParams }: Pick<PageProps<"/work-orders">, "searchParams">) {
  const user = await requirePermission("workOrder.view");
  const { page: requested } = await searchParams;
  const { rows, page, pageCount, total } = await listWorkOrders(db, pageNumber(requested));
  const canCreate = hasPermission(user.role, "workOrder.create");
  const canCancel = hasPermission(user.role, "workOrder.cancel");

  return (
    <>
      <PageHeader title="รายการใบงาน" description={`ทั้งหมด ${total} ใบ`}>
        {canCreate ? (
          <Link href="/work-orders/new" className={buttonVariants()}>
            <Plus />
            สร้างใบงาน
          </Link>
        ) : null}
      </PageHeader>

      <div className="rounded-xl border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>สถานะ</TableHead>
              <TableHead>เลขที่</TableHead>
              <TableHead>ผู้ว่าจ้าง</TableHead>
              <TableHead>ผู้สั่งงาน</TableHead>
              <TableHead>สถานที่รับ</TableHead>
              <TableHead>สถานที่ส่ง</TableHead>
              <TableHead>รถ</TableHead>
              <TableHead>รับงาน</TableHead>
              <TableHead>ส่งงาน</TableHead>
              <TableHead className="text-right">ค่าขนส่ง</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">จัดการ</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                  ยังไม่มีข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const cancelled = row.statusCode === WORK_STATUS.CANCELLED;
                return (
                  <TableRow key={row.id} className={cancelled ? "text-muted-foreground" : undefined}>
                    <TableCell>
                      <WorkStatusBadge code={row.statusCode} name={row.statusName} />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/work-orders/${row.id}`} className="underline-offset-4 hover:underline">
                        {row.workOrderNo}
                      </Link>
                    </TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell>{row.orderedBy ?? "—"}</TableCell>
                    <TableCell>{row.pickupLocation ?? "—"}</TableCell>
                    <TableCell>{row.dropoffLocation ?? "—"}</TableCell>
                    <TableCell>
                      {row.firstVehicle ?? "—"}
                      {row.moreVehicles > 0 ? (
                        <span className="block text-xs text-muted-foreground">+ อีก {row.moreVehicles} คัน</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">{formatDateTimeTh(row.receiveAt) || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">{formatDateTimeTh(row.deliveryAt) || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(row.transportFee) || "—"}</TableCell>
                    <TableCell>
                      <WorkOrderRowMenu id={row.id} workOrderNo={row.workOrderNo} canCancel={canCancel && !cancelled} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 ? (
        <nav aria-label="เปลี่ยนหน้า" className="flex items-center justify-end gap-2 text-sm">
          <PageLink page={page - 1} disabled={page <= 1}>
            <ChevronLeft />
            ก่อนหน้า
          </PageLink>
          <span className="text-muted-foreground">
            หน้า {page} / {pageCount}
          </span>
          <PageLink page={page + 1} disabled={page >= pageCount}>
            ถัดไป
            <ChevronRight />
          </PageLink>
        </nav>
      ) : null}
    </>
  );
}

function PageLink({ page, disabled, children }: { page: number; disabled: boolean; children: React.ReactNode }) {
  if (disabled) {
    return (
      <span aria-disabled className={buttonVariants({ variant: "outline", size: "sm", className: "pointer-events-none opacity-50" })}>
        {children}
      </span>
    );
  }
  return (
    <Link href={`/work-orders?page=${page}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
      {children}
    </Link>
  );
}
