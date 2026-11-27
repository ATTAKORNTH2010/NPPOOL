import { Construction } from "lucide-react";
import { Suspense } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requirePermission } from "@/lib/dal";
import type { Permission } from "@/lib/permissions";
import { PageHeader } from "./page-header";
import { PageSkeleton } from "./page-skeleton";

/**
 * Placeholder for a screen that phase 5 builds. It already enforces the
 * screen's permission, so the menu and the guard can be checked end to end.
 */
export function ComingSoonPage({ title, permission }: { title: string; permission: Permission }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <GuardedPlaceholder title={title} permission={permission} />
    </Suspense>
  );
}

async function GuardedPlaceholder({ title, permission }: { title: string; permission: Permission }) {
  await requirePermission(permission);
  return (
    <>
      <PageHeader title={title} />
      <Alert>
        <Construction />
        <AlertTitle>อยู่ระหว่างพัฒนา</AlertTitle>
        <AlertDescription>หน้านี้จะเปิดใช้งานในขั้นที่ 5</AlertDescription>
      </Alert>
    </>
  );
}
