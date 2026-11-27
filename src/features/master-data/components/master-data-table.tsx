"use client";

import { ChevronLeft, ChevronRight, CircleCheck, CircleOff, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react";
import { useId, useState, useTransition } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ActionResult } from "@/lib/action-result";

export type Column<T> = { header: string; cell: (row: T) => React.ReactNode; className?: string };

type Confirm<T> = { kind: "deactivate" | "delete"; row: T };

/**
 * The list shared by every master-data screen (design 02, section 3.6):
 * search, “show inactive”, paging, and per row edit · deactivate/activate ·
 * delete (the server refuses rows that are still in use).
 */
export function MasterDataTable<T>({
  rows,
  columns,
  getId,
  isActive,
  searchText,
  describe,
  searchPlaceholder,
  toolbar,
  renderEdit,
  setActive,
  remove,
  pageSize = 20,
}: {
  rows: T[];
  columns: Column<T>[];
  getId: (row: T) => number;
  isActive: (row: T) => boolean;
  searchText: (row: T) => string;
  /** Short name of the row for confirmation titles, e.g. a company name. */
  describe: (row: T) => string;
  searchPlaceholder: string;
  /** Usually the “add” button with its dialog. */
  toolbar?: React.ReactNode;
  renderEdit: (row: T, close: () => void) => React.ReactNode;
  setActive: (input: { id: number; active: boolean }) => Promise<ActionResult>;
  remove: (input: { id: number }) => Promise<ActionResult>;
  pageSize?: number;
}) {
  const showInactiveId = useId();
  const [query, setQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<T | null>(null);
  const [confirm, setConfirm] = useState<Confirm<T> | null>(null);
  const [pending, startTransition] = useTransition();

  const needle = query.trim().toLocaleLowerCase("th");
  const filtered = rows.filter(
    (row) => (showInactive || isActive(row)) && (!needle || searchText(row).toLocaleLowerCase("th").includes(needle)),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);
  const inactiveCount = rows.filter((row) => !isActive(row)).length;

  function run(action: () => Promise<ActionResult>, after?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      after?.();
    });
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={showInactiveId}
            checked={showInactive}
            onCheckedChange={(checked) => {
              setShowInactive(checked === true);
              setPage(1);
            }}
          />
          <Label htmlFor={showInactiveId} className="font-normal">
            แสดงที่ปิดใช้งาน{inactiveCount > 0 ? ` (${inactiveCount})` : ""}
          </Label>
        </div>
        <div className="ml-auto">{toolbar}</div>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.header} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
              <TableHead>สถานะ</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">จัดการ</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="h-24 text-center text-muted-foreground">
                  {rows.length === 0 ? "ยังไม่มีข้อมูล" : "ไม่พบข้อมูลที่ค้นหา"}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((row) => {
                const active = isActive(row);
                return (
                  <TableRow key={getId(row)} className={active ? undefined : "text-muted-foreground"}>
                    {columns.map((column) => (
                      <TableCell key={column.header} className={column.className}>
                        {column.cell(row)}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Badge variant={active ? "outline" : "secondary"}>{active ? "ใช้งาน" : "ปิดใช้งาน"}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon" aria-label={`จัดการ ${describe(row)}`} />}
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-40">
                          <DropdownMenuItem onClick={() => setEditing(row)}>
                            <Pencil />
                            แก้ไข
                          </DropdownMenuItem>
                          {active ? (
                            <DropdownMenuItem onClick={() => setConfirm({ kind: "deactivate", row })}>
                              <CircleOff />
                              ปิดใช้งาน
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              disabled={pending}
                              onClick={() => run(() => setActive({ id: getId(row), active: true }))}
                            >
                              <CircleCheck />
                              เปิดใช้งาน
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => setConfirm({ kind: "delete", row })}>
                            <Trash2 />
                            ลบ
                          </DropdownMenuItem>
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

      {filtered.length > pageSize ? (
        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <span>
            แสดง {start + 1}–{start + visible.length} จาก {filtered.length} รายการ
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="หน้าก่อน"
            disabled={current <= 1}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="หน้าถัดไป"
            disabled={current >= pageCount}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      ) : null}

      {editing ? renderEdit(editing, () => setEditing(null)) : null}

      {confirm ? (
        <AlertDialog open onOpenChange={(open) => !open && !pending && setConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirm.kind === "delete" ? "ลบ" : "ปิดใช้งาน"} {describe(confirm.row)}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirm.kind === "delete"
                  ? "ลบถาวรได้เฉพาะรายการที่ยังไม่มีข้อมูลอื่นใช้ ถ้ามีใบงานใช้อยู่ ระบบจะให้ปิดใช้งานแทน"
                  : "รายการนี้จะไม่ให้เลือกตอนสร้างใบงานใหม่ แต่ใบงานเดิมยังแสดงข้อมูลเดิม เปิดใช้งานกลับได้ภายหลัง"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction
                variant={confirm.kind === "delete" ? "destructive" : "default"}
                disabled={pending}
                onClick={() =>
                  run(
                    () =>
                      confirm.kind === "delete"
                        ? remove({ id: getId(confirm.row) })
                        : setActive({ id: getId(confirm.row), active: false }),
                    () => setConfirm(null),
                  )
                }
              >
                {confirm.kind === "delete" ? "ลบ" : "ปิดใช้งาน"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}
