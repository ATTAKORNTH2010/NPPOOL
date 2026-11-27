"use client";

import { Ban, Eye, MoreHorizontal } from "lucide-react";
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

/** Per-row menu in the list (design 02 §3.2): view · cancel (Maker, Admin). Print comes with module 4. */
export function WorkOrderRowMenu({
  id,
  workOrderNo,
  canCancel,
}: {
  id: number;
  workOrderNo: string;
  canCancel: boolean;
}) {
  const [cancelling, setCancelling] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`จัดการใบงาน ${workOrderNo}`} />}>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuItem render={<Link href={`/work-orders/${id}`} />}>
            <Eye />
            ดูใบงาน
          </DropdownMenuItem>
          {canCancel ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setCancelling(true)}>
                <Ban />
                ยกเลิกใบงาน
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {canCancel ? (
        <CancelWorkOrderDialog id={id} workOrderNo={workOrderNo} open={cancelling} onOpenChange={setCancelling} />
      ) : null}
    </>
  );
}
