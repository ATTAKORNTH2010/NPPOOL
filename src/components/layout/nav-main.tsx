"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { NavGroup } from "./nav-config";
import { NAV_ICONS } from "./nav-icons";

function isActive(pathname: string, href: string) {
  // "/work-orders" must not light up while on "/work-orders/new".
  if (href === "/work-orders") return pathname === href || /^\/work-orders\/\d+/.test(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavMain({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  return groups.map((group) => (
    <SidebarGroup key={group.title}>
      <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
      <SidebarMenu>
        {group.items.map((item) => {
          const Icon = NAV_ICONS[item.icon];
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                render={<Link href={item.href} />}
                isActive={isActive(pathname, item.href)}
                tooltip={item.title}
              >
                <Icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  ));
}
