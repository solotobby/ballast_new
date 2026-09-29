import { OpsShell } from "@/components/ops/ops-shell";

export default function OpsConsoleLayout({ children }: { children: React.ReactNode }) {
  return <OpsShell>{children}</OpsShell>;
}
