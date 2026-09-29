"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { IconBook, IconCheck, IconHome, IconPlus, IconTasks, IconVault } from "./icons";
import { useStaff } from "./staff-context";
import { TaskSheet } from "./sheets/task-sheet";
import { IncidentSheet, QuickAddSheet, RefusalSheet, UploadSheet } from "./sheets/quick-add-sheet";
import type { StaffTab } from "./types";
import "./staff.css";

function tabFromPath(pathname: string): StaffTab {
  if (pathname.startsWith("/staff/tasks")) return "tasks";
  if (pathname.startsWith("/staff/logbook")) return "logbook";
  if (pathname.startsWith("/staff/evidence")) return "evidence";
  return "home";
}

export function StaffShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { loading, toast, openSheet } = useStaff();
  const tab = tabFromPath(pathname);

  if (loading) {
    return (
      <div className="staff-root">
        <div className="staff-screen">
          <div className="staff-loading staff-loading-pulse">
            <div style={{ height: 128, borderRadius: 26, background: "var(--line-2)", marginBottom: 24 }} />
            <div style={{ height: 96, borderRadius: 20, background: "#fff", marginBottom: 16 }} />
            <div style={{ height: 80, borderRadius: 14, background: "#fff", marginBottom: 11 }} />
            <div style={{ height: 80, borderRadius: 14, background: "#fff" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-root">
      <div className="staff-screen">
        <div className="staff-app">
          <div className="staff-scroll">{children}</div>

          <nav className="staff-tabbar">
            <TabLink href="/staff" active={tab === "home"} label="Home" icon={<IconHome />} />
            <TabLink href="/staff/tasks" active={tab === "tasks"} label="Tasks" icon={<IconTasks />} />
            <div className="staff-fab-slot">
              <button type="button" className="staff-fab" aria-label="Log something" onClick={() => openSheet({ kind: "quick-add" })}>
                <IconPlus />
              </button>
            </div>
            <TabLink href="/staff/logbook" active={tab === "logbook"} label="Logbook" icon={<IconBook />} />
            <TabLink href="/staff/evidence" active={tab === "evidence"} label="Evidence" icon={<IconVault />} />
          </nav>
        </div>

        {toast ? (
          <div className="staff-toast">
            <span className="ti">
              <IconCheck className="h-4 w-4" />
            </span>
            {toast}
          </div>
        ) : null}

        <QuickAddSheet />
        <TaskSheet />
        <IncidentSheet />
        <RefusalSheet />
        <UploadSheet />
      </div>
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
  icon,
}: {
  href: string;
  active: boolean;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Link href={href} className={`staff-tab${active ? " active" : ""}`}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}
