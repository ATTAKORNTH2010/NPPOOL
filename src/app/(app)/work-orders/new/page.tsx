import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/layout/coming-soon-page";

export const metadata: Metadata = { title: "สร้างใบงาน" };

export default function NewWorkOrderPage() {
  return <ComingSoonPage title="สร้างใบงาน" permission="workOrder.create" />;
}
