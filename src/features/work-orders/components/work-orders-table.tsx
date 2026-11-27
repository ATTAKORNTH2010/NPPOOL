"use client";

import { Pencil, Printer, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WORK_STATUS } from "../statuses";
import { DeleteWorkOrdersDialog, type WorkOrderRef } from "./delete-work-orders";
import { WorkOrderRowMenu, type RowPermissions } from "./work-order-row-menu";
import { WorkStatusBadge } from "./work-status-badge";

/** A list row with every date and amount already formatted on the server (no time-zone drift). */
export type WorkOrderTableRow = {
  id: number;
  workOrderNo: string;
  statusCode: number;
  statusName: string;
  customerName: string;
  orderedBy: string | null;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  vehicle: string | null;
  moreVehicles: number;
  receiveAt: string;
  deliveryAt: string;
  transportFee: string;
};

/**
 * WO-10/16 list with a tick box per row (user request 2026-11-27): tick one
 * to edit or print it, tick one or more to delete them.
 */
export function WorkOrdersTable({ rows, can }: { rows: WorkOrderTableRow[]; can: RowPermissions }) {
  const router = useRouter();
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  // Snapshot taken when the dialog opens, so its text does not change while the list refreshes.
  const [deleting, setDeleting] = useState<WorkOrderRef[] | null>(null);
  const selectable = can.edit || can.print || can.delete;

  const chosen = rows.filter((row) => selected.has(row.id));
  const only = chosen.length === 1 ? chosen[0] : undefined;
  const allChecked = rows.length > 0 && chosen.length === rows.length;

  function toggle(id: number, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    setSelected(next);
  }

  return (
    <div className="grid gap-2">
      {selectable && chosen.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm" role="toolbar" aria-label="จัดการใบงานที่เลือก">
          <span className="font-medium">เลือก {chosen.length} ใบ</span>
          <span className="flex-1" />
          {can.edit ? (
            <Button
              size="sm"
              variant="outline"
              disabled={!only || only.statusCode === WORK_STATUS.CANCELLED}
              title={!only ? "เลือกใบงานเพียง 1 ใบเพื่อแก้ไข" : undefined}
              onClick={() => only && router.push(`/work-orders/${only.id}/edit`)}
            >
              <Pencil />
              แก้ไข
            </Button>
          ) : null}
          {can.print ? (
            <Button
              size="sm"
              variant="outline"
              disabled={!only}
              title={!only ? "เลือกใบงานเพียง 1 ใบเพื่อพิมพ์" : undefined}
              onClick={() => only && window.open(`/work-orders/${only.id}/print`, "_blank", "noopener")}
            >
              <Printer />
              พิมพ์
            </Button>
          ) : null}
          {can.delete ? (
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleting(chosen.map((row) => ({ id: row.id, workOrderNo: row.workOrderNo })))}>
              <Trash2 />
              ลบ {chosen.length > 1 ? `${chosen.length} ใบ` : ""}
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            <X />
            ล้างการเลือก
          </Button>
        </div>
      ) : null}

      <div className="rounded-xl border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {selectable ? (
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="เลือกทุกใบในหน้านี้"
                    checked={allChecked}
                    indeterminate={chosen.length > 0 && !allChecked}
                    disabled={rows.length === 0}
                    onCheckedChange={(checked) => setSelected(checked ? new Set(rows.map((row) => row.id)) : new Set())}
                  />
                </TableHead>
              ) : null}
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
                <TableCell colSpan={selectable ? 12 : 11} className="h-24 text-center text-muted-foreground">
                  ไม่พบใบงาน
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const cancelled = row.statusCode === WORK_STATUS.CANCELLED;
                const checked = selected.has(row.id);
                return (
                  <TableRow
                    key={row.id}
                    data-state={checked ? "selected" : undefined}
                    className={cancelled ? "text-muted-foreground" : undefined}
                  >
                    {selectable ? (
                      <TableCell>
                        <Checkbox
                          aria-label={`เลือกใบงาน ${row.workOrderNo}`}
                          checked={checked}
                          onCheckedChange={(value) => toggle(row.id, value)}
                        />
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <WorkStatusBadge code={row.statusCode} name={row.statusName} />
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      <Link href={`/work-orders/${row.id}`} className="underline-offset-4 hover:underline">
                        {row.workOrderNo}
                      </Link>
                    </TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell>{row.orderedBy ?? "—"}</TableCell>
                    <TableCell>{row.pickupLocation ?? "—"}</TableCell>
                    <TableCell>{row.dropoffLocation ?? "—"}</TableCell>
                    <TableCell>
                      {row.vehicle ?? "—"}
                      {row.moreVehicles > 0 ? (
                        <span className="block text-xs text-muted-foreground">+ อีก {row.moreVehicles} คัน</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">{row.receiveAt || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">{row.deliveryAt || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.transportFee || "—"}</TableCell>
                    <TableCell>
                      <WorkOrderRowMenu id={row.id} workOrderNo={row.workOrderNo} cancelled={cancelled} can={can} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {can.delete ? (
        <DeleteWorkOrdersDialog
          orders={deleting ?? []}
          open={deleting !== null}
          onOpenChange={(open) => !open && setDeleting(null)}
          onDeleted={() => setSelected(new Set())}
        />
      ) : null}
    </div>
  );
}
