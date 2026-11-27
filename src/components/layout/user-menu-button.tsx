"use client";

import { ChevronsUpDown, CircleUserRound, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth/client";

export function UserMenuButton({ name, username, roleLabel }: { name: string; username: string; roleLabel: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      const { error } = await authClient.signOut();
      if (error) {
        toast.error("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่");
        return;
      }
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex max-w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
        <CircleUserRound className="size-5 text-muted-foreground" />
        <span className="hidden max-w-48 truncate font-medium sm:inline">{name}</span>
        <Badge variant="secondary">{roleLabel}</Badge>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {/* Base UI: a GroupLabel must sit inside a Group. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="text-sm text-foreground">{name}</div>
            <div className="font-normal">{username}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} disabled={pending}>
            <LogOut />
            ออกจากระบบ
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
