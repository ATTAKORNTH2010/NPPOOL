"use client";

import { LoaderCircle } from "lucide-react";
import { useTransition } from "react";
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
import { banUserAction, unbanUserAction } from "../actions";
import type { UserListItem } from "../service";

/** Confirms banning (or lifting a ban on) a user — design 02, section 4: AlertDialog, not confirm(). */
export function BanUserDialog({ user, onClose }: { user: UserListItem; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const banning = !user.banned;

  function confirm() {
    startTransition(async () => {
      const result = banning ? await banUserAction({ userId: user.id }) : await unbanUserAction({ userId: user.id });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      onClose();
    });
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {banning ? "ระงับบัญชี" : "เลิกระงับบัญชี"} {user.username}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {banning
              ? "ผู้ใช้จะถูกออกจากระบบทันทีและเข้าสู่ระบบไม่ได้ จนกว่าจะเลิกระงับ"
              : "ผู้ใช้จะเข้าสู่ระบบได้อีกครั้งด้วยรหัสผ่านเดิม"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction variant={banning ? "destructive" : "default"} onClick={confirm} disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
            {banning ? "ระงับบัญชี" : "เลิกระงับ"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
