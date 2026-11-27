import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { db } from "@/db/client";
import { CreateUserDialog } from "@/features/users/components/create-user-dialog";
import { UsersTable } from "@/features/users/components/users-table";
import { listUsers } from "@/features/users/service";
import { requirePermission } from "@/lib/dal";

export const metadata: Metadata = { title: "จัดการผู้ใช้" };

/** AUTH-06 · design 02, section 3.7 — admin only. */
export default function UsersPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <UsersContent />
    </Suspense>
  );
}

async function UsersContent() {
  const actor = await requirePermission("user.manage");
  const users = await listUsers(db);
  const banned = users.filter((user) => user.banned).length;

  return (
    <>
      <PageHeader
        title="จัดการผู้ใช้"
        description={`ทั้งหมด ${users.length} คน${banned > 0 ? ` · ระงับอยู่ ${banned} คน` : ""}`}
      >
        <CreateUserDialog />
      </PageHeader>
      <UsersTable users={users} currentUserId={actor.id} />
    </>
  );
}
