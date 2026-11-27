import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/layout/coming-soon-page";

export const metadata: Metadata = { title: "รายการใบงาน" };

export default function WorkOrdersPage() {
  return <ComingSoonPage title="รายการใบงาน" permission="workOrder.view" />;
}
