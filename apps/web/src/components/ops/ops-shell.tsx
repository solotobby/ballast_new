"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { opsClient, type OpsSession } from "@/lib/ops-api";
import "@/components/ops/ops.css";

const NAV = [
  { href: "/ops", label: "Ops Overview", exact: true },
  { href: "/ops/tenants", label: "Organisations", badge: "tenants" as const },
  { href: "/ops/vaults", label: "Evidence Vaults" },
  { href: "/ops/review", label: "Flag Review", section: "Quality & Review", badge: "flags" as const },
  { href: "/ops/ai", label: "AI Quality", badge: "ai" as const },
  { href: "/ops/rules", label: "Rules Corpus", section: "Quality & Review" },
  { href: "/ops/crawler", label: "Web Crawler", section: "Quality & Review" },
  { href: "/ops/monitoring", label: "Jobs & Health", section: "Platform" },
  { href: "/ops/audit", label: "Audit & Security", section: "Platform" },
];

const TITLES: Record<string, [string, string]> = {
  "/ops": ["Platform", "Ops Overview"],
  "/ops/tenants": ["Customers", "Organisations"],
  "/ops/vaults": ["Oversight", "Evidence Vaults"],
  "/ops/review": ["Quality & Review", "Flag Review Queue"],
  "/ops/ai": ["Quality & Review", "AI Recommendation Quality"],
  "/ops/rules": ["Quality & Review", "Regulatory Rules Corpus"],
  "/ops/crawler": ["Quality & Review", "Regulatory Web Crawler"],
  "/ops/monitoring": ["Platform", "Jobs & Health"],
  "/ops/audit": ["Platform", "Audit & Security"],
};

export function OpsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<OpsSession | null>(null);
  const [counts, setCounts] = useState({ tenants: 0, flags: 0, ai: 0 });
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ id: string; kind: string; title: string; subtitle: string }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    opsClient
      .me()
      .then(({ session: s }) => {
        if (!s) {
          router.replace("/ops/signin");
          return;
        }
        setSession(s);
      })
      .catch(() => router.replace("/ops/signin"));
  }, [router]);

  useEffect(() => {
    if (!session) return;
    opsClient
      .overview()
      .then((data) => {
        setCounts({
          tenants: data.tenantCount,
          flags: data.flagCount,
          ai: data.aiPendingCount,
        });
      })
      .catch(() => undefined);
  }, [session]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      opsClient
        .search(search)
        .then((data) => {
          setResults(data.results);
          setSearchOpen(true);
        })
        .catch(() => setResults([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const [crumb, title] = TITLES[pathname] ?? ["Platform", "Ops Console"];

  const sections = useMemo(() => {
    const seen = new Set<string>();
    return NAV.map((item) => {
      const showSection = item.section && !seen.has(item.section);
      if (item.section) seen.add(item.section);
      return { ...item, showSection: Boolean(showSection) };
    });
  }, []);

  async function signOut() {
    await opsClient.signOut();
    router.replace("/ops/signin");
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111318] text-sm text-slate-400">
        <div className="flex items-center gap-2.5">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
          <span>Verifying ops credentials…</span>
        </div>
      </div>
    );
  }

  function badgeFor(key?: "tenants" | "flags" | "ai") {
    if (key === "tenants" && counts.tenants > 0) return counts.tenants;
    if (key === "flags" && counts.flags > 0) return counts.flags;
    if (key === "ai" && counts.ai > 0) return counts.ai;
    return 0;
  }

  return (
    <div className="ops-root grid min-h-screen lg:grid-cols-[255px_1fr]">
      {/* Sidebar with Crisp White & Reference Mockup Aesthetics */}
      <aside className="ops-sidebar hidden h-screen flex-col px-3.5 py-4 lg:sticky lg:top-0 lg:flex select-none">
        {/* macOS Traffic Lights */}
        <div className="flex items-center gap-1.5 px-2 pt-0.5 pb-3">
          <div className="h-3 w-3 rounded-full bg-[#FF5F56] shadow-sm" />
          <div className="h-3 w-3 rounded-full bg-[#FFBD2E] shadow-sm" />
          <div className="h-3 w-3 rounded-full bg-[#27C93F] shadow-sm" />
        </div>

        {/* Brand App Icon & Name */}
        <div className="mb-2 flex items-center gap-2.5 px-2 py-1">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0284C7] shadow-sm">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" className="text-white">
              <path
                d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[16px] font-bold tracking-tight text-slate-900 font-sans">Ballast Ops</span>
            <span className="rounded bg-sky-50 border border-sky-200 px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider text-sky-700 uppercase">
              ADMIN
            </span>
          </div>
        </div>

        {/* Tier-3 Console Indicator */}
        <div className="mx-2 mb-3.5 inline-flex items-center gap-1.5 rounded-lg border border-sky-200/80 bg-sky-50/70 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-sky-700">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0284C7] animate-pulse" />
          Internal Console · Tier 3
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-0.5 overflow-y-auto pr-1">
          {sections.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const badge = badgeFor(item.badge);
            return (
              <div key={item.href}>
                {item.showSection ? (
                  <p className="px-3 pb-1 pt-3 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    {item.section}
                  </p>
                ) : null}
                <Link
                  href={item.href}
                  className={`ops-nav-item ${active ? "active text-sky-600 bg-sky-50/80" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}
                >
                  <span className="truncate">{item.label}</span>
                  {badge > 0 ? (
                    <span
                      className={`ml-auto font-mono rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                        active
                          ? "bg-[#0284C7] text-white"
                          : "bg-sky-50 border border-sky-200 text-sky-700"
                      }`}
                    >
                      {badge}
                    </span>
                  ) : null}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Signature Sunset Gradient Texture Card at Bottom of Sidebar */}
        <div className="mt-auto pt-3">
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#18181B] shadow-md">
            {/* Organic warm sunset header */}
            <div
              className="p-3 text-white"
              style={{
                background: "linear-gradient(135deg, #FF453A 0%, #FF6B35 45%, #FFA336 100%)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/90">
                  Telemetry Active
                </span>
                <span className="text-[12px]">↗</span>
              </div>
              <div className="mt-1 text-[13px] font-bold leading-tight text-white drop-shadow-sm">
                Ballast Ops Pro
              </div>
            </div>

            {/* Dark carbon base */}
            <div className="p-3 text-[11px] text-slate-300 space-y-2">
              <div className="truncate font-semibold text-white">{session.username}</div>
              <div className="text-[10.5px] text-slate-400 font-mono">Role: Statutory Admin</div>
              <div className="flex items-center justify-end pt-1 border-t border-white/10">
                <button
                  type="button"
                  onClick={signOut}
                  className="font-medium text-slate-400 hover:text-white transition"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-col bg-[#F8FAFC]">
        {/* Environment Banner */}
        <div className="ops-env-banner flex items-center justify-between px-5 lg:px-7">
          <div className="flex items-center gap-2">
            <span className="text-[#E52E2E]">🛡️</span>
            <span>
              <strong>RESTRICTED ENVIRONMENT</strong> — All tenant data access is logged and audited under UK GDPR / DPA 2018.
            </span>
          </div>
          <span className="hidden sm:inline font-mono text-[10px] text-slate-400">SESSION: 8H TTL</span>
        </div>

        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-[62px] items-center gap-4 border-b border-[#EAECEF] bg-white/90 px-5 backdrop-blur-md lg:px-7">
          <div className="min-w-0">
            <div className="font-mono text-[10.5px] text-slate-400 uppercase tracking-wider">{crumb}</div>
            <h1 className="truncate text-[19px] font-bold tracking-tight text-slate-900 font-sans">{title}</h1>
          </div>

          <div className="relative ml-auto hidden w-[320px] md:block">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search tenants, obligations, evidence…"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-[13px] outline-none transition placeholder:text-slate-400 focus:border-[#0284C7] focus:bg-white focus:ring-2 focus:ring-[#0284C7]/15"
            />
            {searchOpen && search.trim().length >= 2 ? (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                {results.length === 0 ? (
                  <p className="px-4 py-3 text-[13px] text-slate-500">No matches found.</p>
                ) : (
                  <ul className="max-h-[280px] overflow-y-auto py-1">
                    {results.map((item) => (
                      <li key={`${item.kind}-${item.id}`}>
                        <Link
                          href={item.kind === "tenant" ? `/ops/tenants?focus=${item.id}` : "/ops/tenants"}
                          onClick={() => setSearchOpen(false)}
                          className="block px-4 py-2.5 hover:bg-slate-50 transition border-b border-slate-100 last:border-0"
                        >
                          <div className="text-[13px] font-semibold text-slate-900">{item.title}</div>
                          <div className="text-[11.5px] text-slate-500 font-mono">
                            {item.kind} · {item.subtitle}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>


        </header>

        {/* Content Body */}
        <main className="mx-auto w-full max-w-[1360px] flex-1 px-5 py-6 lg:px-7 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
