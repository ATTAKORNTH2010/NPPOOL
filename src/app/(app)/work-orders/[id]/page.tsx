import { Pencil, Plus, Printer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/db/client";
import { CancelWorkOrderButton } from "@/features/work-orders/components/cancel-work-order";
import { DeleteWorkOrderButton } from "@/features/work-orders/components/delete-work-orders";
import { WorkOrderNotice } from "@/features/work-orders/components/work-order-notice";
import { WorkStatusBadge } from "@/features/work-orders/components/work-status-badge";
import { getWorkOrder, wasWorkOrderDeleted, type WorkOrderDetail } from "@/features/work-orders/service";
import { WORK_STATUS } from "@/features/work-orders/statuses";
import { requirePermission } from "@/lib/dal";
import { formatDateTimeTh, formatMoney } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "ใบงาน" };

/** WO-11..14 · design 02 §3.4 — read only (F2); edit, print, cancel and delete by role. */
export default function WorkOrderPage({ params }: PageProps<"/work-orders/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <WorkOrderContent params={params} />
    </Suspense>
  );
}

async function WorkOrderContent({ params }: Pick<PageProps<"/work-orders/[id]">, "params">) {
  const user = await requirePermission("workOrder.view");
  const { id: raw } = await params;
  if (!/^\d{1,9}$/.test(raw)) notFound();
  const id = Number(raw);
  const order = await getWorkOrder(db, id);
  if (!order) {
    if (await wasWorkOrderDeleted(db, id)) return <WorkOrderNotice title="ใบงานนี้ถูกลบแล้ว" />;
    notFound();
  }

  const cancelled = order.statusCode === WORK_STATUS.CANCELLED;
  const canEdit = hasPermission(user.role, "workOrder.edit") && !cancelled;
  const canPrint = hasPermission(user.role, "workOrder.print");
  const canCancel = hasPermission(user.role, "workOrder.cancel") && !cancelled;
  const canDelete = hasPermission(user.role, "workOrder.delete");
  const canCreate = hasPermission(user.role, "workOrder.create");
  const edited = order.updatedAt.getTime() - order.createdAt.getTime() > 1000;
  const history = [
    `สร้างโดย ${order.createdByName ?? "—"} เมื่อ ${formatDateTimeTh(order.createdAt)}`,
    edited ? `แก้ไขล่าสุดโดย ${order.updatedByName ?? "—"} เมื่อ ${formatDateTimeTh(order.updatedAt)}` : null,
  ];

  return (
    <>
      <PageHeader title={`ใบงาน ${order.workOrderNo}`} description={history.filter(Boolean).join(" · ")}>
        <div className="flex flex-wrap items-center gap-2">
          <WorkStatusBadge code={order.statusCode} name={order.statusName} />
          {canEdit ? (
            <Link href={`/work-orders/${order.id}/edit`} className={buttonVariants()}>
              <Pencil />
              แก้ไขใบงาน
            </Link>
          ) : null}
          {canPrint ? (
            <a
              href={`/work-orders/${order.id}/print`}
              target="_blank"
              rel="noopener"
              className={buttonVariants({ variant: "outline" })}
            >
              <Printer />
              พิมพ์ใบสั่งปฏิบัติงาน
            </a>
          ) : null}
          {canCancel ? <CancelWorkOrderButton id={order.id} workOrderNo={order.workOrderNo} /> : null}
          {canDelete ? <DeleteWorkOrderButton id={order.id} workOrderNo={order.workOrderNo} /> : null}
          {canCreate ? (
            <Link href="/work-orders/new" className={buttonVariants({ variant: "outline" })}>
              <Plus />
              สร้างใบงานใหม่
            </Link>
          ) : null}
        </div>
      </PageHeader>

      {cancelled ? (
        <Alert>
          <AlertTitle>ใบงานนี้ถูกยกเลิกแล้ว</AlertTitle>
          <AlertDescription>
            ยกเลิกโดย {order.cancelledByName ?? "—"} เมื่อ {formatDateTimeTh(order.cancelledAt)}
          </AlertDescription>
        </Alert>
      ) : null}

      <DetailCard title="1. ผู้ว่าจ้าง">
        <Detail label="ผู้ว่าจ้าง" value={order.customerName} />
        <Detail label="สถานะงาน" value={order.statusName} />
        <Detail label="ผู้สั่งงาน" value={order.orderedBy} />
      </DetailCard>

      <DetailCard title="2. สถานที่รับ-ส่ง">
        <Detail label="สถานที่รับ" value={order.pickupLocation} />
        <Detail label="ผู้ติดต่อ (ฝั่งรับ)" value={order.pickupContactName} />
        <Detail label="เบอร์โทร (ฝั่งรับ)" value={order.pickupContactPhone} />
        <Detail label="สถานที่ส่ง" value={order.dropoffLocation} />
        <Detail label="ผู้ติดต่อ (ฝั่งส่ง)" value={order.dropoffContactName} />
        <Detail label="เบอร์โทร (ฝั่งส่ง)" value={order.dropoffContactPhone} />
        <Detail label="ค่าขนส่ง (บาท)" value={formatMoney(order.transportFee)} />
      </DetailCard>

      <Card>
        <CardHeader>
          <CardTitle>3. รถและการขนส่ง</CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleLines lines={order.vehicles} />
        </CardContent>
      </Card>

      <DetailCard title="4. ข้อมูลงาน">
        <Detail label="วันเวลารับงาน" value={formatDateTimeTh(order.receiveAt)} />
        <Detail label="วันเวลาส่งงาน" value={formatDateTimeTh(order.deliveryAt)} />
        <Detail label="Job No., Shipment" value={order.customerJobNo} />
        <Detail label="Remark" value={order.remark} wide />
      </DetailCard>

      <DetailCard title="5. ค่าใช้จ่ายเพิ่มเติม">
        <Detail label="ค่าผ่านท่า (บาท)" value={formatMoney(order.portFee)} />
        <Detail label="ค่าเสียเวลา (บาท)" value={formatMoney(order.demurrageFee)} />
        <Detail label="จำนวนคืน" value={String(order.overnightNights)} />
        <Detail label="ค่าแรงค้างคืน (บาท)" value={formatMoney(order.overnightLaborFee)} />
        <Detail label="จำนวนคน" value={String(order.extraWorkers)} />
        <Detail label="ค่าแรงคน (บาท)" value={formatMoney(order.extraWorkerFee)} />
      </DetailCard>
    </>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value, wide }: { label: string; value: string | null; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2 lg:col-span-3" : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line">{value || "—"}</dd>
    </div>
  );
}

function amount(value: string | null, unit: string | null): string {
  if (value === null) return "—";
  const number = Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
  return unit ? `${number} ${unit}` : number;
}

function VehicleLines({ lines }: { lines: WorkOrderDetail["vehicles"] }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>ประเภทรถ</TableHead>
            <TableHead>ทะเบียน</TableHead>
            <TableHead>พนักงานขับรถ</TableHead>
            <TableHead>เบอร์ พขร.</TableHead>
            <TableHead className="text-right">จำนวน</TableHead>
            <TableHead className="text-right">น้ำหนัก</TableHead>
            <TableHead>ขนาด</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.lineNo}>
              <TableCell>{line.lineNo}</TableCell>
              <TableCell>{line.vehicleTypeName ?? "—"}</TableCell>
              <TableCell>{line.plateNo ?? "—"}</TableCell>
              <TableCell>{line.driverName ?? "—"}</TableCell>
              <TableCell>{line.driverPhone ?? "—"}</TableCell>
              <TableCell className="text-right tabular-nums">{amount(line.quantity, line.quantityUnit)}</TableCell>
              <TableCell className="text-right tabular-nums">{amount(line.weight, line.weightUnit)}</TableCell>
              <TableCell>{line.dimensions ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
