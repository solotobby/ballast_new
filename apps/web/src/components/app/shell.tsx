"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { NotificationsPanel } from "@/components/app/notifications-panel";
import { NavIcon } from "@/components/app/nav-icons";
import { QuickLogModal } from "@/components/app/quick-log-modal";
import { SignOutButton } from "@/components/app/sign-out-button";
import {
  client,
  type EvidenceRecord,
  type LogEntry,
  type Obligation,
  type Organisation,
  type SessionUser,
} from "@/lib/api";
import { onboardingPath } from "@/lib/onboarding";
import { initials, roleLabel } from "@/lib/user";

type NavItemDef = {
  href: string;
  label: string;
  icon: string;
  hotkey?: string;
  badge?: string;
  hasDot?: boolean;
};

type NavGroup = {
  section: string;
  items: NavItemDef[];
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [org, setOrg] = useState<Organisation | null>(null);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [attention, setAttention] = useState(0);
  const [monitoringCount, setMonitoringCount] = useState(0);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Shell interactivity states
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [siteDropdownOpen, setSiteDropdownOpen] = useState(false);
  const [activeSite, setActiveSite] = useState("Central Manchester (HQ)");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");
  const cmdInputRef = useRef<HTMLInputElement>(null);

  const refreshShellData = useCallback(async () => {
    const [me, organisation, obligationRows, logRows, evidenceRows] = await Promise.all([
      client.me(),
      client.organisation(),
      client.listObligations(),
      client.listLogs(),
      client.listEvidence(),
    ]);

    if (me.user.role === "owner") {
      if (organisation.onboardingStep !== "done") {
        router.replace(onboardingPath(organisation.onboardingStep));
        return;
      }
      if (!organisation.profileComplete) {
        router.replace("/onboarding/profile");
        return;
      }
    } else if (me.user.role === "staff") {
      router.replace("/staff");
      return;
    }

    setUser(me.user);
    setOrg(organisation);
    setObligations(obligationRows);
    setLogs(logRows);
    setEvidence(evidenceRows);
    setAttention(
      obligationRows.filter((item) => item.reviewState === "pending" || item.status !== "on_track").length,
    );
    setMonitoringCount(
      obligationRows.filter(
        (o) => o.status === "overdue" || o.status === "evidence_gap" || o.status === "due_soon",
      ).length,
    );
  }, [router]);

  useEffect(() => {
    refreshShellData().catch(() => {
      router.replace("/signin");
    });
  }, [refreshShellData, pathname]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Hotkey listener (Cmd+K and sequential G+D, G+O etc.)
  useEffect(() => {
    let keySeq = "";
    let seqTimer: NodeJS.Timeout | null = null;

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
        return;
      }
      if (e.key === "Escape") {
        setCmdOpen(false);
        setUserMenuOpen(false);
        setSiteDropdownOpen(false);
        return;
      }

      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName || "")) return;

      if (seqTimer) clearTimeout(seqTimer);
      keySeq += e.key.toLowerCase();
      seqTimer = setTimeout(() => {
        keySeq = "";
      }, 600);

      if (keySeq === "gd") router.push("/app");
      else if (keySeq === "go") router.push("/app/obligations");
      else if (keySeq === "gm") router.push("/app/monitoring");
      else if (keySeq === "gl") router.push("/app/logbook");
      else if (keySeq === "ge") router.push("/app/vault");
      else if (keySeq === "gr") router.push("/app/reports");
      else if (keySeq === "gs") router.push("/app/settings");
      else if (keySeq === "nl") setQuickLogOpen(true);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  useEffect(() => {
    if (cmdOpen) {
      setTimeout(() => cmdInputRef.current?.focus(), 50);
    } else {
      setCmdQuery("");
    }
  }, [cmdOpen]);

  // Categorized Navigation matching mockup
  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        section: "Overview",
        items: [
          { href: "/app", label: "Overview", icon: "dashboard", hotkey: "G D" },
          {
            href: "/app/obligations",
            label: "Revenue & Duties",
            icon: "obligations",
            hotkey: "G O",
            hasDot: true,
            badge: attention > 0 ? `${attention}` : undefined,
          },
          {
            href: "/app/monitoring",
            label: "Continuous Audit",
            icon: "monitoring",
            hotkey: "G M",
            badge: monitoringCount > 0 ? `${monitoringCount}` : undefined,
          },
          { href: "/app/settings", label: "Integrations", icon: "settings", hotkey: "G S" },
        ],
      },
      {
        section: "WORKSPACE",
        items: [
          { href: "/app/reports", label: "Reports", icon: "reports", hotkey: "G R" },
          { href: "/app/vault", label: "Subscriptions & Vault", icon: "vault", hotkey: "G E" },
          { href: "/app/logbook", label: "Invoices & Logs", icon: "logbook", hotkey: "G L" },
          { href: "/app/team", label: "Team & Sites", icon: "team" },
        ],
      },
      {
        section: "RECENTS",
        items: [
          { href: "/app/obligations", label: "Q3 Revenue Review", icon: "obligations", hasDot: true },
          { href: "/app/monitoring", label: "Overdue Gas Safety (CP12)", icon: "monitoring" },
          { href: "/app/team", label: "Central Manchester HQ", icon: "team" },
        ],
      },
    ],
    [attention, monitoringCount],
  );

  // Command palette search results
  const filteredNav = useMemo(() => {
    const q = cmdQuery.toLowerCase().trim();
    if (!q) {
      return navGroups.flatMap((g) => g.items);
    }
    return navGroups.flatMap((g) => g.items).filter((item) => item.label.toLowerCase().includes(q));
  }, [cmdQuery, navGroups]);

  const filteredDuties = useMemo(() => {
    const q = cmdQuery.toLowerCase().trim();
    if (!q || q.length < 2) return [];
    return obligations.filter(
      (o) => o.title.toLowerCase().includes(q) || (o.definitionId && o.definitionId.toLowerCase().includes(q)),
    );
  }, [cmdQuery, obligations]);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Mobile Backdrop */}
      {mobileNavOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          style={{ zIndex: 45 }}
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      {/* Clean White Sidebar from Reference Mockup */}
      <aside className={`app-sidebar ${mobileNavOpen ? "nav-open" : ""}`}>
        {/* Brand Header with Blue Squircle Sparkle Logo */}
        <div className="flex h-[64px] items-center justify-between border-b border-[#EAECEF] px-5">
          <Link href="/app" className="flex items-center gap-2.5">
            <div className="relative grid h-8 w-8 place-items-center rounded-xl bg-[#0284C7] shadow-xs">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#FFFFFF">
                <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
              </svg>
            </div>
            <div className="leading-tight">
              <div className="font-display flex items-center gap-1.5 text-[15px] font-bold tracking-tight text-slate-900">
                <span>Ballast</span>
                <span className="font-mono rounded border border-sky-200 bg-sky-50 px-1 py-0.2 text-[9px] font-bold text-sky-700">
                  PRO
                </span>
              </div>
              <div className="font-mono text-[9px] font-medium tracking-wider text-slate-400">
                COMPLIANCE OS
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Categories */}
        <nav className="flex-1 overflow-y-auto py-3">
          {navGroups.map((group) => (
            <div key={group.section} className="mb-3">
              <div className="nav-section">{group.section}</div>
              {group.items.map((item) => {
                const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`nav-link ${active ? "active" : ""}`}
                  >
                    <NavIcon name={item.icon} active={active} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.hasDot ? (
                      <span className="nav-red-dot" title="Active item" />
                    ) : item.badge ? (
                      <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.2 font-mono text-[9.5px] font-bold text-slate-700 border border-slate-200">
                        {item.badge}
                      </span>
                    ) : item.hotkey ? (
                      <kbd className="hidden group-hover:inline font-mono text-[9px] text-slate-400">
                        {item.hotkey}
                      </kbd>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sunset Texture Upgrade to Pro Card */}
        <Link href="/app/settings" className="sunset-card block text-left">
          <div className="sunset-card-header" />
          <div className="sunset-card-body">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span>Upgrade to Pro</span>
              <span className="text-[12px] opacity-80">↗</span>
            </div>
            <div className="mt-1 text-[11px] leading-relaxed text-[#A1A1AA]">
              Access to higher limits, pro models, premium analytics &amp; 5 year history.
            </div>
          </div>
        </Link>

        {/* User Footer Panel */}
        <div className="relative border-t border-[#EAECEF] p-3">
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-100"
          >
            <div className="grid h-8 w-8 flex-none place-items-center rounded-full bg-[#F3F4F6] border border-[#E5E7EB] font-sans text-xs font-bold text-slate-800 shadow-2xs">
              {user ? initials(user.name, user.email) : "JD"}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-xs font-bold text-slate-900 group-hover:text-rose-600 transition">
                {org?.name ?? "Acme Inc."}
              </div>
              <div className="truncate font-mono text-[10.5px] text-slate-500">
                {user ? roleLabel(user.role) : "Growth"}
              </div>
            </div>
            <svg
              className="h-3.5 w-3.5 flex-none text-slate-400 transition group-hover:text-slate-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {/* User Dropdown Flyout */}
          {userMenuOpen ? (
            <div className="absolute bottom-full left-3 mb-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 text-xs shadow-xl z-50">
              <div className="border-b border-slate-100 px-3 py-2 text-slate-600">
                <div className="text-[12px] font-bold text-slate-900">{org?.name ?? "Acme Inc."}</div>
                <div className="font-mono text-[10.5px] text-slate-400">CRN: 14829104 · Manchester</div>
              </div>
              <Link
                href="/app/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <NavIcon name="settings" />
                <span>Workspace &amp; Sites</span>
              </Link>
              <Link
                href="/staff"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <NavIcon name="team" />
                <span>Staff Mobile Terminal</span>
              </Link>
              <div className="my-1 border-t border-slate-100" />
              <div className="px-2 py-1">
                <SignOutButton variant="ghost" />
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Frosted Topbar with macOS Frame Controls */}
      <header className="app-topbar flex items-center gap-3 px-4 md:px-7">
        {/* macOS Window Control Dots & Navigation Controls (from reference mockup) */}
        <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-slate-200">
          <div className="flex items-center gap-1.5 mr-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]/50" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]/50" />
          </div>
          <div className="flex items-center gap-0.5 text-slate-400">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-1 rounded hover:bg-slate-100 hover:text-slate-700 transition"
              title="Back"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => router.forward()}
              className="p-1 rounded hover:bg-slate-100 hover:text-slate-700 transition"
              title="Forward"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="menu-btn btn btn-quiet btn-sm btn-icon md:hidden"
          aria-label="Open navigation"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Multi-Site Switcher Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSiteDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-lg border hairline bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-xs transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
            <span>{org?.name ?? "The Copper Kettle"}</span>
            <span className="font-mono text-[10.5px] text-slate-400">· {activeSite}</span>
            <svg className="h-3 w-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {/* Site Selector Dropdown */}
          {siteDropdownOpen ? (
            <div className="absolute left-0 top-full mt-2 w-80 rounded-xl border hairline bg-white p-2 text-xs shadow-xl z-50">
              <div className="mb-1 border-b hairline px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Select Active Operating Location
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveSite("Central Manchester (HQ)");
                  setSiteDropdownOpen(false);
                  setToast("Active location: Central Manchester (HQ)");
                }}
                className={`w-full mb-1 flex items-center justify-between rounded-xl p-2.5 text-left transition ${
                  activeSite.includes("Central")
                    ? "bg-sky-50/70 border border-sky-200/80 text-sky-950 font-semibold"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  <div>
                    <div className="text-xs font-bold">Central Manchester (HQ)</div>
                    <div className="font-mono text-[10.5px] text-sky-700 mt-0.5">
                      M1 4BT · 14 staff · Commercial kitchen
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSite("Ancoats Prep Kitchen");
                  setSiteDropdownOpen(false);
                  setToast("Active location: Ancoats Prep Kitchen");
                }}
                className={`w-full flex items-center justify-between rounded-xl p-2.5 text-left transition ${
                  activeSite.includes("Ancoats")
                    ? "bg-sky-50/70 border border-sky-200/80 text-sky-950 font-semibold"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-1 h-2 w-2 rounded-full bg-slate-300" />
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Ancoats Prep Kitchen</div>
                    <div className="font-mono text-[10.5px] text-slate-400 mt-0.5">
                      M4 5BD · 4 staff · Bakery &amp; storage
                    </div>
                  </div>
                </div>
              </button>
              <div className="my-1.5 border-t hairline" />
              <Link
                href="/app/settings"
                onClick={() => setSiteDropdownOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50 transition"
              >
                + Manage or provision site…
              </Link>
            </div>
          ) : null}
        </div>

        {/* Engine Live Sync Status */}
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Statutory rules synced</span>
        </div>

        {/* Quick Search Trigger (⌘K) */}
        <div className="relative ml-auto hidden md:block max-w-sm flex-1">
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-100/80 px-3.5 py-1.5 text-left text-xs text-slate-500 transition hover:border-slate-300 hover:bg-slate-100"
          >
            <span className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span className="font-medium">Quick search...</span>
            </span>
            <kbd className="flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500 shadow-xs">
              <span>⌘K</span>
            </kbd>
          </button>
        </div>

        {/* Topbar Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="btn btn-quiet btn-sm btn-icon md:hidden"
            aria-label="Search"
          >
            <svg className="h-4 w-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>

          <NotificationsPanel obligations={obligations} logs={logs} invites={org?.invites ?? []} />

          <button
            type="button"
            onClick={() => setQuickLogOpen(true)}
            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Record Entry</span>
          </button>

          <Link
            href="/app/profile"
            className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-tr from-sky-600 to-sky-400 font-sans text-xs font-bold text-white shadow-xs transition hover:scale-105"
            title="Account & Workspace"
          >
            {user ? initials(user.name, user.email) : "OO"}
          </Link>
        </div>
      </header>

      {/* Main App Content Area */}
      <main className="content">
        <div className="content-inner">
          {toast ? (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-xs font-semibold text-emerald-800 animate-in fade-in">
              {toast}
            </div>
          ) : null}
          {children}
        </div>
      </main>

      {/* Raycast-Style Command Palette (Cmd+K) */}
      <div className={`overlay ${cmdOpen ? "open" : ""}`} onClick={() => setCmdOpen(false)}>
        <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 border-b hairline bg-white px-4 py-3.5">
            <svg className="h-4 w-4 flex-none text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={cmdInputRef}
              value={cmdQuery}
              onChange={(e) => setCmdQuery(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-ink placeholder-slate-400 outline-none"
              placeholder="Search duties, documents, tasks or jump to page..."
            />
            <kbd className="rounded border hairline bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-400">
              ESC
            </kbd>
          </div>

          <div className="max-h-80 space-y-1 overflow-y-auto p-2">
            <div className="px-3 pt-2 pb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation
            </div>
            {filteredNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setCmdOpen(false)}
                className="cmd-item"
              >
                <span className="grid h-6 w-6 flex-none place-items-center rounded bg-sky-50 text-sky-600">
                  <NavIcon name={item.icon} />
                </span>
                <span className="flex-1 text-xs font-semibold">{item.label}</span>
                {item.hotkey ? (
                  <kbd className="font-mono text-[10px] text-slate-400">{item.hotkey}</kbd>
                ) : null}
              </Link>
            ))}

            {filteredDuties.length > 0 ? (
              <>
                <div className="px-3 pt-3 pb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Matching Obligations
                </div>
                {filteredDuties.slice(0, 5).map((d) => (
                  <Link
                    key={d.id}
                    href={`/app/obligations`}
                    onClick={() => setCmdOpen(false)}
                    className="cmd-item"
                  >
                    <span className="grid h-6 w-6 flex-none place-items-center rounded bg-emerald-50 text-emerald-600">
                      <NavIcon name="obligations" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{d.title}</div>
                      <div className="font-mono text-[10.5px] text-slate-400">{d.definitionId || d.id}</div>
                    </div>
                  </Link>
                ))}
              </>
            ) : null}

            <div className="px-3 pt-3 pb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Quick Actions
            </div>
            <button
              type="button"
              onClick={() => {
                setCmdOpen(false);
                setQuickLogOpen(true);
              }}
              className="cmd-item w-full text-left"
            >
              <span className="grid h-6 w-6 flex-none place-items-center rounded bg-emerald-50 text-emerald-600">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
              <span className="flex-1 text-xs font-semibold">Log Operational Entry (Fridge / Cleaning)</span>
              <kbd className="rounded bg-emerald-50 px-1 font-mono text-[10px] text-emerald-700">N L</kbd>
            </button>
            <Link
              href="/app/vault"
              onClick={() => setCmdOpen(false)}
              className="cmd-item"
            >
              <span className="grid h-6 w-6 flex-none place-items-center rounded bg-sky-50 text-sky-600">
                <NavIcon name="vault" />
              </span>
              <span className="flex-1 text-xs font-semibold">Upload Statutory Certificate (Gas / Fire)</span>
              <kbd className="rounded bg-sky-50 px-1 font-mono text-[10px] text-sky-700">U E</kbd>
            </Link>
            <Link
              href="/app/reports"
              onClick={() => setCmdOpen(false)}
              className="cmd-item"
            >
              <span className="grid h-6 w-6 flex-none place-items-center rounded bg-purple-50 text-purple-600">
                <NavIcon name="reports" />
              </span>
              <span className="flex-1 text-xs font-semibold">Generate Inspection Dossier</span>
              <span className="rounded bg-purple-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-purple-700">
                Audit Pack
              </span>
            </Link>
          </div>

          <div className="flex items-center justify-between border-t hairline bg-slate-50 px-4 py-2 font-mono text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span>
                <strong className="text-slate-700">ESC</strong> to close
              </span>
            </div>
            <span>Ballast Intelligent Navigator</span>
          </div>
        </div>
      </div>

      {/* Quick Log Modal */}
      <QuickLogModal
        open={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
        onSaved={() => {
          setToast("Log entry saved to statutory audit ledger.");
          refreshShellData().catch(() => undefined);
        }}
      />
    </div>
  );
}

