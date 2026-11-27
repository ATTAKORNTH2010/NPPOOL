import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/layout/coming-soon-page";

export const metadata: Metadata = { title: "ผู้ว่าจ้าง" };

export default function CustomersPage() {
  return <ComingSoonPage title="ผู้ว่าจ้าง" permission="masterData.manage" />;
}
