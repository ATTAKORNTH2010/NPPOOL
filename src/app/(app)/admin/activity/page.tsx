import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/db/client";
import { ACTIVITY_MODULES, ACTIVITY_RETENTION_MONTHS, actionLabel, moduleLabel } from "@/features/activity/catalog";
import { ActivityFiltersForm } from "@/features/activity/components/activity-filters";
import {
  listActivity,
  listActivityUsers,
  parseActivityFilters,
  summarizeActivity,
  type ActivityFilters,
} from "@/features/activity/service";
import { formatRangeLabel } from "@/features/activity/range-label";
import { pageNumber } from "@/features/work-orders/filters";
import { requirePermission } from "@/lib/dal";
import { formatDateTimeTh } from "@/lib/format";

export const metadata: Metadata = { title: "Activity Logs" };

/** ADR-0012 (user request 2026-11-27) — admin only: who used which function, and when. */
export default function ActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ActivityContent searchParams={searchParams} />
    </Suspense>
  );
}

function toQuery(filters: ActivityFilters, page?: number): string {
  const params = new URLSearchParams();
  if (filters.userId) params.set("user", filters.userId);
  if (filters.module) params.set("module", filters.module);
  if (filters.action) params.set("action", filters.action);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (page && page > 1) params.set("page", String(page));
  return params.toString();
}

async function ActivityContent({ searchParams }: Pick<PageProps<"/admin/activity">, "searchParams">) {
  await requirePermission("activity.view");
  const params = await searchParams;
  const filters = parseActivityFilters(params);
  const [{ rows, page, pageCount, total }, summary, users] = await Promise.all([
    listActivity(db, filters, pageNumber(params)),
    summarizeActivity(db, filters),
    listActivityUsers(db),
  ]);
  const modules = (Object.keys(ACTIVITY_MODULES) as (keyof typeof ACTIVITY_MODULES)[]).filter((key) =>
    summary.some((row) => row.counts[key]),
  );
  const query = toQuery(filters);

  return (
    <>
      <PageHeader
        title="Activity Logs"
        description={`การเข้าใช้งานของผู้ใช้แต่ละคนในแต่ละฟังก์ชัน · เก็บไว้ ${ACTIVITY_RETENTION_MONTHS} เดือน รายการที่เก่ากว่านั้นระบบลบให้อัตโนมัติ`}
      />

      <ActivityFiltersForm key={query} filters={filters} users={users} />

      <Card>
        <CardHeader>
          <CardTitle>สรุปตามผู้ใช้และฟังก์ชัน</CardTitle>
          <CardDescription>จำนวนครั้ง · {formatRangeLabel(filters)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>ผู้ใช้</TableHead>
                  {modules.map((key) => (
                    <TableHead key={key} className="text-right">
                      {ACTIVITY_MODULES[key]}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">รวม</TableHead>
                  <TableHead>ใช้งานล่าสุด</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={modules.length + 3} className="h-16 text-center text-muted-foreground">
                      ยังไม่มีข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  summary.map((row) => (
                    <TableRow key={row.userId}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/activity?${toQuery({ ...filters, userId: row.userId })}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {row.userName}
                        </Link>
                      </TableCell>
                      {modules.map((key) => (
                        <TableCell key={key} className="text-right tabular-nums">
                          {row.counts[key] ? row.counts[key].toLocaleString("th-TH") : "—"}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-medium tabular-nums">{row.total.toLocaleString("th-TH")}</TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">{formatDateTimeTh(row.lastAt) || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการ</CardTitle>
          <CardDescription>ใหม่→เก่า · {total.toLocaleString("th-TH")} รายการ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>เวลา</TableHead>
                  <TableHead>ผู้ใช้</TableHead>
                  <TableHead>ฟังก์ชัน</TableHead>
                  <TableHead>การกระทำ</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-16 text-center text-muted-foreground">
                      ไม่พบรายการ
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap tabular-nums">{formatDateTimeTh(row.occurredAt)}</TableCell>
                      <TableCell>
                        {row.userName ?? <span className="text-muted-foreground">ไม่ทราบผู้ใช้</span>}
                        {row.username ? <span className="block text-xs text-muted-foreground">{row.username}</span> : null}
                      </TableCell>
                      <TableCell>{moduleLabel(row.module)}</TableCell>
                      <TableCell>
                        <Badge variant={row.action === "loginFailed" || row.action === "delete" ? "destructive" : "secondary"}>
                          {actionLabel(row.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md break-words whitespace-normal">{row.detail ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">{row.ipAddress ?? "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {pageCount > 1 ? (
        <nav aria-label="เปลี่ยนหน้า" className="flex items-center justify-end gap-2 text-sm">
          <PageLink href={`/admin/activity?${toQuery(filters, page - 1)}`} disabled={page <= 1}>
            <ChevronLeft />
            ก่อนหน้า
          </PageLink>
          <span className="text-muted-foreground">
            หน้า {page} / {pageCount}
          </span>
          <PageLink href={`/admin/activity?${toQuery(filters, page + 1)}`} disabled={page >= pageCount}>
            ถัดไป
            <ChevronRight />
          </PageLink>
        </nav>
      ) : null}
    </>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  if (disabled) {
    return (
      <span aria-disabled className={buttonVariants({ variant: "outline", size: "sm", className: "pointer-events-none opacity-50" })}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={buttonVariants({ variant: "outline", size: "sm" })}>
      {children}
    </Link>
  );
}
