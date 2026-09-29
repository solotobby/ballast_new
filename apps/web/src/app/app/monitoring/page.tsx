import type { Metadata } from "next";
import { MonitoringPage } from "@/components/app/monitoring-page";

export const metadata: Metadata = {
  title: "Continuous Monitoring",
};

export default function MonitoringRoutePage() {
  return <MonitoringPage />;
}
