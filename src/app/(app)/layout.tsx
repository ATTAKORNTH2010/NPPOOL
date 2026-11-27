import { Suspense } from "react";
import { ActivityTracker } from "@/components/layout/activity-tracker";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SessionKeepAlive } from "@/components/layout/session-keep-alive";
import { UserMenu } from "@/components/layout/user-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Signed-in shell. Everything that reads the session sits inside <Suspense>
 * so the frame itself is prerendered (Cache Components). The sidebar frame
 * stays outside Suspense on purpose (see AppSidebar).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <div className="ml-auto min-w-0">
            <Suspense fallback={<Skeleton className="h-8 w-40" />}>
              <UserMenu />
            </Suspense>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
      {/* usePathname() is request data on dynamic routes such as /work-orders/[id]. */}
      <Suspense fallback={null}>
        <SessionKeepAlive />
        <ActivityTracker />
      </Suspense>
    </SidebarProvider>
  );
}
