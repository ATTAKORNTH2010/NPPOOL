import Link from "next/link";
import { Suspense } from "react";
import { Brand } from "@/components/layout/brand";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/dal";
import { hasPermission } from "@/lib/permissions";
import { NAV_GROUPS } from "./nav-config";
import { NavMain } from "./nav-main";

/**
 * The sidebar frame renders in the static shell, in the same hydration pass
 * as SidebarProvider. Sidebar picks its desktop or mobile (Sheet) branch from
 * the provider's isMobile; if the frame sat inside a Suspense boundary, that
 * boundary could hydrate after isMobile flipped on a narrow screen and no
 * longer match the server HTML (React error #418). Only the role-dependent
 * menu waits for the session.
 */
export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <Brand />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <Suspense fallback={<NavSkeleton />}>
          <AppNav />
        </Suspense>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

/** Menu items depend on the user's role → reads the session. */
async function AppNav() {
  const user = await requireUser();
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => hasPermission(user.role, item.permission)),
  })).filter((group) => group.items.length > 0);

  return <NavMain groups={groups} />;
}

// Fixed widths: shadcn's SidebarMenuSkeleton calls Math.random(), which fails
// the prerender of the static shell under Cache Components.
const SKELETON_WIDTHS = ["w-3/4", "w-2/3", "w-4/5", "w-1/2"];

function NavSkeleton() {
  return (
    <SidebarMenu className="p-2">
      {SKELETON_WIDTHS.map((width) => (
        <SidebarMenuItem key={width} className="flex h-8 items-center gap-2 px-2">
          <Skeleton className="size-4 rounded-md" />
          <Skeleton className={`h-4 ${width}`} />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
