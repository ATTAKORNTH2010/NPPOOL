import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/db/client";
import { ExportWorkOrdersButton } from "@/features/work-orders/components/export-work-orders-button";
import { WorkOrderFiltersForm } from "@/features/work-orders/components/work-order-filters";
import { WorkOrdersTable, type WorkOrderTableRow } from "@/features/work-orders/components/work-orders-table";
import {
  activeFilterCount,
  filtersToSearchParams,
  pageNumber,
  parseWorkOrderFilters,
  type WorkOrderFilters,
} from "@/features/work-orders/filters";
import { listWorkOrders, listWorkStatuses } from "@/features/work-orders/service";
import { requirePermission } from "@/lib/dal";
import { formatDateTimeTh, formatMoney } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "รายการใบงาน" };

/** WO-10, WO-16 · design 02 §3.2 — Maker, Admin, Accounting (view, print, export). */
export default function WorkOrdersPage({ searchParams }: PageProps<"/work-orders">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <WorkOrdersContent searchParams={searchParams} />
    </Suspense>
  );
}

async function WorkOrdersContent({ searchParams }: Pick<PageProps<"/work-orders">, "searchParams">) {
  const user = await requirePermission("workOrder.view");
  const params = await searchParams;
  const filters = parseWorkOrderFilters(params);
  const [{ rows, page, pageCount, total }, statuses] = await Promise.all([
    listWorkOrders(db, filters, pageNumber(params)),
    listWorkStatuses(db),
  ]);
  const query = filtersToSearchParams(filters).toString();
  const searching = activeFilterCount(filters) > 0;
  const can = {
    edit: hasPermission(user.role, "workOrder.edit"),
    cancel: hasPermission(user.role, "workOrder.cancel"),
    delete: hasPermission(user.role, "workOrder.delete"),
    print: hasPermission(user.role, "workOrder.print"),
  };

  const tableRows: WorkOrderTableRow[] = rows.map((row) => ({
    id: row.id,
    workOrderNo: row.workOrderNo,
    statusCode: row.statusCode,
    statusName: row.statusName,
    customerName: row.customerName,
    orderedBy: row.orderedBy,
    pickupLocation: row.pickupLocation,
    dropoffLocation: row.dropoffLocation,
    vehicle: row.firstVehicle,
    moreVehicles: row.moreVehicles,
    receiveAt: formatDateTimeTh(row.receiveAt),
    deliveryAt: formatDateTimeTh(row.deliveryAt),
    transportFee: formatMoney(row.transportFee),
  }));

  return (
    <>
      <PageHeader
        title="รายการใบงาน"
        description={searching ? `พบ ${total.toLocaleString("th-TH")} ใบตามที่ค้นหา` : `ทั้งหมด ${total.toLocaleString("th-TH")} ใบ`}
      >
        <div className="flex flex-wrap gap-2">
          {hasPermission(user.role, "workOrder.export") ? <ExportWorkOrdersButton query={query} total={total} /> : null}
          {hasPermission(user.role, "workOrder.create") ? (
            <Link href="/work-orders/new" className={buttonVariants()}>
              <Plus />
              สร้างใบงาน
            </Link>
          ) : null}
        </div>
      </PageHeader>

      {/* Keyed by the search, so the form shows what the URL says after back/forward or "ล้าง". */}
      <WorkOrderFiltersForm key={query} filters={filters} statuses={statuses} />

      <WorkOrdersTable key={`${query}#${page}`} rows={tableRows} can={can} />

      {pageCount > 1 ? (
        <nav aria-label="เปลี่ยนหน้า" className="flex items-center justify-end gap-2 text-sm">
          <PageLink filters={filters} page={page - 1} disabled={page <= 1}>
            <ChevronLeft />
            ก่อนหน้า
          </PageLink>
          <span className="text-muted-foreground">
            หน้า {page} / {pageCount}
          </span>
          <PageLink filters={filters} page={page + 1} disabled={page >= pageCount}>
            ถัดไป
            <ChevronRight />
          </PageLink>
        </nav>
      ) : null}
    </>
  );
}

function PageLink({
  filters,
  page,
  disabled,
  children,
}: {
  filters: WorkOrderFilters;
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span aria-disabled className={buttonVariants({ variant: "outline", size: "sm", className: "pointer-events-none opacity-50" })}>
        {children}
      </span>
    );
  }
  const query = filtersToSearchParams(filters, page).toString();
  return (
    <Link href={query ? `/work-orders?${query}` : "/work-orders"} className={buttonVariants({ variant: "outline", size: "sm" })}>
      {children}
    </Link>
  );
}
