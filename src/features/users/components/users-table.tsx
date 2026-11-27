"use client";

import { Ban, KeyRound, MoreHorizontal, ShieldCheck, UserCog } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isRole, ROLE_LABELS } from "@/lib/permissions";
import type { UserListItem } from "../service";
import { BanUserDialog } from "./ban-user-dialog";
import { ChangeRoleDialog } from "./change-role-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";

type OpenDialog = { kind: "role" | "password" | "ban"; user: UserListItem } | null;

const ROLE_BADGE = { admin: "default", maker: "secondary", accounting: "outline" } as const;

export function UsersTable({ users, currentUserId }: { users: UserListItem[]; currentUserId: string }) {
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const close = () => setDialog(null);

  return (
    <>
      <div className="rounded-xl border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>ชื่อผู้ใช้</TableHead>
              <TableHead>ชื่อ-นามสกุล</TableHead>
              <TableHead>เบอร์โทร</TableHead>
              <TableHead>บทบาท</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">จัดการ</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  ยังไม่มีข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                  <TableRow key={user.id} className={user.banned ? "text-muted-foreground" : undefined}>
                    <TableCell className="font-medium">
                      {user.username}
                      {isSelf ? <span className="ml-1 text-xs text-muted-foreground">(คุณ)</span> : null}
                    </TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={isRole(user.role) ? ROLE_BADGE[user.role] : "outline"}>
                        {isRole(user.role) ? ROLE_LABELS[user.role] : "ไม่ระบุ"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.banned ? "destructive" : "outline"}>{user.banned ? "ระงับ" : "ใช้งาน"}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon" aria-label={`จัดการผู้ใช้ ${user.username}`} />}
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-44">
                          <DropdownMenuItem onClick={() => setDialog({ kind: "role", user })}>
                            <UserCog />
                            เปลี่ยนบทบาท
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDialog({ kind: "password", user })}>
                            <KeyRound />
                            ตั้งรหัสผ่านใหม่
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.banned ? (
                            <DropdownMenuItem onClick={() => setDialog({ kind: "ban", user })}>
                              <ShieldCheck />
                              เลิกระงับบัญชี
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={isSelf}
                              onClick={() => setDialog({ kind: "ban", user })}
                            >
                              <Ban />
                              ระงับบัญชี
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {dialog?.kind === "role" ? <ChangeRoleDialog user={dialog.user} onClose={close} /> : null}
      {dialog?.kind === "password" ? (
        <ResetPasswordDialog user={dialog.user} isSelf={dialog.user.id === currentUserId} onClose={close} />
      ) : null}
      {dialog?.kind === "ban" ? <BanUserDialog user={dialog.user} onClose={close} /> : null}
    </>
  );
}
