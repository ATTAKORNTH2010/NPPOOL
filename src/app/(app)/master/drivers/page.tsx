import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/layout/coming-soon-page";

export const metadata: Metadata = { title: "พนักงานขับรถ" };

export default function DriversPage() {
  return <ComingSoonPage title="พนักงานขับรถ" permission="masterData.manage" />;
}
