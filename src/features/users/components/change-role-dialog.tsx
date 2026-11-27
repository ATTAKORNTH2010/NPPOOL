"use client";

import { LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { isRole, type Role } from "@/lib/permissions";
import { changeRoleAction } from "../actions";
import type { UserListItem } from "../service";
import { RoleSelect } from "./role-select";

export function ChangeRoleDialog({ user, onClose }: { user: UserListItem; onClose: () => void }) {
  const [role, setRole] = useState<Role | undefined>(isRole(user.role) ? user.role : undefined);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!role) return;
    startTransition(async () => {
      const result = await changeRoleAction({ userId: user.id, role });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>เปลี่ยนบทบาท</DialogTitle>
          <DialogDescription>
            ผู้ใช้ {user.username} · {user.name}
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="change-role">บทบาท</FieldLabel>
          <RoleSelect id="change-role" value={role} onChange={setRole} />
        </Field>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>ยกเลิก</DialogClose>
          <Button onClick={save} disabled={pending || !role || role === user.role}>
            {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
