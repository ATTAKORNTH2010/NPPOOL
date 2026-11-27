import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/layout/coming-soon-page";

export const metadata: Metadata = { title: "รถ" };

export default function VehiclesPage() {
  return <ComingSoonPage title="รถ" permission="masterData.manage" />;
}
