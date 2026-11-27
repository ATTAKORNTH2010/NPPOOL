import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NAV_GROUPS } from "@/components/layout/nav-config";
import { NAV_ICONS } from "@/components/layout/nav-icons";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/dal";
import { hasPermission, ROLE_LABELS } from "@/lib/permissions";

export const metadata: Metadata = { title: "หน้าแรก" };

/** GEN-01: greeting + shortcuts for what this role may open. */
export default function HomePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Home />
    </Suspense>
  );
}

async function Home() {
  const user = await requireUser();
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => hasPermission(user.role, item.permission)),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <PageHeader title={`สวัสดี ${user.name}`} description={`เข้าใช้งานในบทบาท${ROLE_LABELS[user.role]}`} />
      {groups.map((group) => (
        <section key={group.title} className="grid gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">{group.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((item) => {
              const Icon = NAV_ICONS[item.icon];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="h-full transition-colors group-hover:bg-muted/50">
                    <CardHeader className="flex flex-row items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <div className="grid gap-1">
                        <CardTitle>{item.title}</CardTitle>
                        <CardDescription>{group.title}</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
