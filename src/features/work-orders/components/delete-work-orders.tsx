"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteWorkOrdersAction } from "../actions";

export type WorkOrderRef = { id: number; workOrderNo: string };

const SHOW_AT_MOST = 10;

/**
 * Delete = hide from every screen, search, print and export; the data and the
 * number stay in the database (ADR-0010 addendum, user request 2026-11-27).
 */
export function DeleteWorkOrdersDialog({
  orders,
  open,
  onOpenChange,
  onDeleted,
}: {
  orders: WorkOrderRef[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const single = orders.length === 1 ? orders[0] : undefined;
  const shown = orders.slice(0, SHOW_AT_MOST).map((order) => order.workOrderNo);

  function confirm() {
    startTransition(async () => {
      const result = await deleteWorkOrdersAction({ ids: orders.map((order) => order.id) });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      onOpenChange(false);
      onDeleted?.();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {single ? `ลบใบงาน ${single.workOrderNo} ใช่หรือไม่?` : `ลบใบงาน ${orders.length} ใบ ใช่หรือไม่?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            ใบงานที่ลบจะไม่แสดงในรายการ การค้นหา การพิมพ์ และไฟล์ Excel อีก และเลขที่ใบงานจะไม่ถูกนำกลับมาใช้
            ข้อมูลยังเก็บไว้ในระบบพร้อมชื่อผู้ลบและเวลา
          </AlertDialogDescription>
        </AlertDialogHeader>
        {single ? null : (
          <p className="text-sm break-words">
            {shown.join(", ")}
            {orders.length > SHOW_AT_MOST ? ` และอีก ${orders.length - SHOW_AT_MOST} ใบ` : ""}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>ไม่ลบ</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Trash2 />}
            ลบใบงาน
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** On the view page: delete, then back to the list. */
export function DeleteWorkOrderButton({ id, workOrderNo }: WorkOrderRef) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" className="text-destructive" onClick={() => setOpen(true)}>
        <Trash2 />
        ลบใบงาน
      </Button>
      <DeleteWorkOrdersDialog
        orders={[{ id, workOrderNo }]}
        open={open}
        onOpenChange={setOpen}
        onDeleted={() => router.replace("/work-orders")}
      />
    </>
  );
}
