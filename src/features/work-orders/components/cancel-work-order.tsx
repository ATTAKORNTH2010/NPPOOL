"use client";

import { Ban, LoaderCircle } from "lucide-react";
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
import { cancelWorkOrderAction } from "../actions";

/** WO-13 · design 02 §3.4: confirm first; cancelling cannot be undone. */
export function CancelWorkOrderDialog({
  id,
  workOrderNo,
  open,
  onOpenChange,
}: {
  id: number;
  workOrderNo: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await cancelWorkOrderAction({ id });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(`ยกเลิกใบงาน ${workOrderNo} แล้ว`);
      onOpenChange(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ยกเลิกใบงาน {workOrderNo} ใช่หรือไม่?</AlertDialogTitle>
          <AlertDialogDescription>
            ยกเลิกแล้วกลับคืนไม่ได้ ใบงานยังอยู่ในรายการพร้อมสถานะ “ยกเลิก” และบันทึกผู้ยกเลิกกับเวลาไว้
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>ไม่ยกเลิก</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
            ยกเลิกใบงาน
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function CancelWorkOrderButton({ id, workOrderNo }: { id: number; workOrderNo: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" className="text-destructive" onClick={() => setOpen(true)}>
        <Ban />
        ยกเลิกใบงาน
      </Button>
      <CancelWorkOrderDialog id={id} workOrderNo={workOrderNo} open={open} onOpenChange={setOpen} />
    </>
  );
}
