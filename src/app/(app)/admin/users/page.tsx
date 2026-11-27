import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/layout/coming-soon-page";

export const metadata: Metadata = { title: "จัดการผู้ใช้" };

export default function UsersPage() {
  return <ComingSoonPage title="จัดการผู้ใช้" permission="user.manage" />;
}
