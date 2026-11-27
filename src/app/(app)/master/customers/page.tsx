import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { db } from "@/db/client";
import { CustomersManager } from "@/features/customers/components/customers-manager";
import { listCustomers } from "@/features/customers/service";
import { requirePermission } from "@/lib/dal";

export const metadata: Metadata = { title: "ผู้ว่าจ้าง" };

/** MD-01 · design 02, section 3.6 — admin only. */
export default function CustomersPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CustomersContent />
    </Suspense>
  );
}

async function CustomersContent() {
  await requirePermission("masterData.manage");
  const rows = await listCustomers(db);
  return (
    <>
      <PageHeader title="ผู้ว่าจ้าง" description={`ทั้งหมด ${rows.length} ราย`} />
      <CustomersManager rows={rows} />
    </>
  );
}
