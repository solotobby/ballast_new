import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { StaffProvider } from "@/components/staff/staff-context";
import { StaffShell } from "@/components/staff/staff-shell";

export const metadata: Metadata = {
  title: "On-site (Staff)",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <StaffProvider>
      <StaffShell>{children}</StaffShell>
    </StaffProvider>
  );
}
