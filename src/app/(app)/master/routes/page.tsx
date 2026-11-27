import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/layout/coming-soon-page";

export const metadata: Metadata = { title: "สถานที่รับ-ส่ง" };

export default function RoutesPage() {
  return <ComingSoonPage title="สถานที่รับ-ส่ง" permission="masterData.manage" />;
}
