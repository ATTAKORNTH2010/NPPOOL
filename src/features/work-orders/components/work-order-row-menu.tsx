"use client";

import { Ban, Eye, MoreHorizontal, Pencil, Printer, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CancelWorkOrderDialog } from "./cancel-work-order";
import { DeleteWorkOrdersDialog } from "./delete-work-orders";

export type RowPermissions = { edit: boolean; cancel: boolean; delete: boolean; print: boolean };

/** Per-row ⋯ menu (design 02 §3.2): view · edit · print · cancel · delete, by role. */
export function WorkOrderRowMenu({
  id,
  workOrderNo,
  cancelled,
  can,
}: {
  id: number;
  workOrderNo: string;
  cancelled: boolean;
  can: RowPermissions;
}) {
  const [dialog, setDialog] = useState<"cancel" | "delete" | null>(null);
  const canEdit = can.edit && !cancelled;
  const canCancel = can.cancel && !cancelled;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`จัดการใบงาน ${workOrderNo}`} />}>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuItem render={<Link href={`/work-orders/${id}`} />}>
            <Eye />
            ดูใบงาน
          </DropdownMenuItem>
          {canEdit ? (
            <DropdownMenuItem render={<Link href={`/work-orders/${id}/edit`} />}>
              <Pencil />
              แก้ไขใบงาน
            </DropdownMenuItem>
          ) : null}
          {can.print ? (
            <DropdownMenuItem render={<a href={`/work-orders/${id}/print`} target="_blank" rel="noopener" />}>
              <Printer />
              พิมพ์ใบสั่งปฏิบัติงาน (PDF)
            </DropdownMenuItem>
          ) : null}
          {canCancel || can.delete ? <DropdownMenuSeparator /> : null}
          {canCancel ? (
            <DropdownMenuItem variant="destructive" onClick={() => setDialog("cancel")}>
              <Ban />
              ยกเลิกใบงาน
            </DropdownMenuItem>
          ) : null}
          {can.delete ? (
            <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
              <Trash2 />
              ลบใบงาน
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {canCancel ? (
        <CancelWorkOrderDialog
          id={id}
          workOrderNo={workOrderNo}
          open={dialog === "cancel"}
          onOpenChange={(open) => setDialog(open ? "cancel" : null)}
        />
      ) : null}
      {can.delete ? (
        <DeleteWorkOrdersDialog
          orders={[{ id, workOrderNo }]}
          open={dialog === "delete"}
          onOpenChange={(open) => setDialog(open ? "delete" : null)}
        />
      ) : null}
    </>
  );
}
