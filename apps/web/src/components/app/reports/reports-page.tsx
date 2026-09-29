"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppBadge, PageHead, StatTile } from "@/components/app/app-ui";
import {
  ApiError,
  client,
  type GeneratedReport,
  type Organisation,
  type ReportLibrary,
  type ReportLibraryItem,
} from "@/lib/api";
import { reportsBlockerCopy, reportsBlockerTitle, reportsFooter } from "@/lib/reports";

function statusBadge(status: ReportLibraryItem["status"]) {
  if (status === "ready") {
    return (
      <span className="pill st-ok">
        <span className="dot" /> READY
      </span>
    );
  }
  if (status === "draft") {
    return (
      <span className="pill st-due">
        <span className="dot" /> DRAFT
      </span>
    );
  }
  return (
    <span className="pill st-bad">
      <span className="dot" /> BLOCKED
    </span>
  );
}

function barColor(status: ReportLibraryItem["status"]) {
  if (status === "ready") return "#10b981";
  if (status === "blocked") return "#f43f5e";
  return "#f59e0b";
}

function EmptyRegisterBanner() {
  return (
    <div className="card p-8 text-center space-y-3">
      <div className="w-10 h-10 mx-auto rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <div className="text-sm font-bold text-slate-900">No obligations to build reports from yet</div>
      <p className="max-w-md mx-auto text-xs text-slate-500 leading-relaxed">
        Statutory packs auto-fill from your duty register, evidence vault, and logbook. Generate your register first,
        then upload evidence to unlock ready status.
      </p>
      <Link href="/onboarding/review" className="btn btn-primary btn-sm inline-flex">
        Generate duty set &rarr;
      </Link>
    </div>
  );
}

function EmptyGeneratedPacks({ library }: { library: ReportLibrary }) {
  return (
    <div className="card p-8 text-center space-y-3">
      <div className="text-sm font-bold text-slate-900">No generated packs yet</div>
      <p className="max-w-md mx-auto text-xs text-slate-500 leading-relaxed">
        {library.readyCount > 0
          ? `${library.readyCount} report${library.readyCount === 1 ? " is" : "s are"} ready — generate one from the library above to create your first pack.`
          : library.obligationCount === 0
            ? "Once your register exists and packs reach ready status, generated PDFs will appear here."
            : "Build coverage with evidence and logbook entries, then generate a ready pack from the library above."}
      </p>
    </div>
  );
}

export function ReportsPage() {
  const [org, setOrg] = useState<Organisation | null>(null);
  const [library, setLibrary] = useState<ReportLibrary | null>(null);
  const [generated, setGenerated] = useState<GeneratedReport[]>([]);
  const [active, setActive] = useState<GeneratedReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [lib, gen, organisation] = await Promise.all([
      client.reportLibrary(),
      client.listGeneratedReports(),
      client.organisation(),
    ]);
    setLibrary(lib);
    setGenerated(gen);
    setOrg(organisation);
  }, []);

  useEffect(() => {
    load().catch(() => setError("Could not load reports."));
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function generate(item: ReportLibraryItem) {
    if (item.status === "blocked") return;
    setError(null);
    setPendingId(item.id);
    try {
      const report = await client.generateReport(item.id);
      setToast(`Generated “${report.title.slice(0, 36)}${report.title.length > 36 ? "…" : ""}”`);
      setActive(report);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not generate that report");
    } finally {
      setPendingId(null);
    }
  }

  if (error && !library) {
    return <p className="text-sm font-medium text-rose-600">{error}</p>;
  }

  if (!library) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse card" />
        <div className="h-48 animate-pulse card" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <PageHead
        breadcrumbs={[
          { label: org?.name ?? "The Copper Kettle Ltd" },
          { label: "Compliance" },
          { label: "Inspection Dossiers" },
        ]}
        title="Inspection Reports &amp; Statutory Dossiers"
        subtitle="Pre-compiled compliance packs auto-filled from your active duty register, evidence vault, and logbook. Scheduled packs prepare ahead of regulator deadlines for rapid inspection sign-off."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/app/share" className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>Create Share Link</span>
            </Link>
          </div>
        }
      />

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      {toast ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800">
          {toast}
        </div>
      ) : null}

      {library.obligationCount === 0 ? <EmptyRegisterBanner /> : null}

      {/* 3-Column Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatTile
          label="Ready to Generate"
          value={library.readyCount}
          tone="ok"
          hint={`${library.evidenceCount} vault files auto-mapped`}
          hintTone="up"
        />
        <StatTile
          label="Draft Packs"
          value={library.items.filter((i) => i.status === "draft").length}
          tone="due"
          hint="Requires supplementary evidence"
          hintTone="muted"
        />
        <StatTile
          label="Blocked by Gaps"
          value={library.blockedCount}
          tone={library.blockedCount > 0 ? "over" : "teal"}
          hint={library.blockedCount > 0 ? reportsBlockerCopy(library) : "No active blockers"}
          hintTone={library.blockedCount > 0 ? "down" : "up"}
        />
      </div>

      {/* Report Library Table Card */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b hairline px-5 py-3.5">
          <h3 className="text-sm font-bold text-slate-900">Statutory Dossier Library</h3>
          <span className="font-mono text-[11px] text-slate-400">
            {library.obligationCount > 0
              ? `${library.obligationCount} duties · ${library.evidenceCount} files in vault`
              : "Waiting for register data"}
          </span>
        </div>
        <div className="divide-y hairline">
          {library.items.map((item) => {
            const cta =
              item.status === "ready" ? (
                <button
                  type="button"
                  disabled={pendingId === item.id}
                  onClick={() => generate(item)}
                  className="btn btn-primary btn-sm shrink-0"
                >
                  {pendingId === item.id ? "Generating…" : "Generate Dossier"}
                </button>
              ) : item.status === "blocked" ? (
                <Link
                  href="/app/obligations"
                  className="btn btn-ghost btn-sm shrink-0 text-slate-700"
                >
                  Resolve Blocker &rarr;
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={pendingId === item.id || item.obligationCount === 0}
                  onClick={() => generate(item)}
                  className="btn btn-ghost btn-sm shrink-0 text-slate-600 disabled:opacity-60"
                >
                  {pendingId === item.id
                    ? "Saving…"
                    : item.obligationCount === 0
                      ? "Needs register"
                      : "Generate draft"}
                </button>
              );

            return (
              <div key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-4 transition hover:bg-slate-50/60">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-700 font-mono text-xs font-bold">
                  PDF
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900">{item.title}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                    {item.authority} · {item.kind}
                    {item.obligationCount > 0
                      ? ` · ${item.coveredCount}/${item.obligationCount} duties covered`
                      : ""}
                  </div>
                </div>
                <div className="w-full max-w-[160px] sm:w-[160px]">
                  <div className="mb-1 text-[11px] font-mono text-slate-500">{item.dueLabel}</div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.progress}%`, background: barColor(item.status) }}
                    />
                  </div>
                </div>
                {statusBadge(item.status)}
                {cta}
              </div>
            );
          })}
        </div>
      </div>

      {/* Generated Packs Card */}
      {generated.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="border-b hairline px-5 py-3.5">
            <h3 className="text-sm font-bold text-slate-900">Generated Inspection Packs</h3>
          </div>
          <div className="divide-y hairline">
            {generated.map((report) => (
              <div key={report.id} className="flex w-full items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition">
                <button type="button" onClick={() => setActive(report)} className="min-w-0 flex-1 text-left">
                  <div className="text-xs font-bold text-slate-900">{report.title}</div>
                  <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                    {report.authority} ·{" "}
                    {report.generatedAt
                      ? new Date(report.generatedAt).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Saved"}
                    {report.progress > 0 ? ` · ${report.progress}% complete` : ""}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActive(report)}
                  className="btn btn-ghost btn-sm text-sky-700"
                >
                  View Details
                </button>
                <a
                  href={`/api/reports/generated/${report.id}/pdf`}
                  className="btn btn-primary btn-sm"
                >
                  Download PDF
                </a>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyGeneratedPacks library={library} />
      )}
      <p className="mt-4 text-[12.5px] text-ink-400">{reportsFooter(library, generated.length)}</p>

      {active ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-navy-900/55 p-4" onClick={() => setActive(null)}>
          <div
            className="mx-auto my-8 max-w-[760px] rounded-2xl border border-line bg-white shadow-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 border-b border-line-2 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-ink-400">Statutory pack</div>
                <h3 className="mt-1 text-[18px] font-bold tracking-tight">{active.title}</h3>
                <p className="mt-1 text-[13px] text-ink-500">
                  {active.authority} · {active.kind}
                  {active.dueLabel ? ` · ${active.dueLabel}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-canvas"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="space-y-5 px-5 py-5">
              {active.blocker ? (
                <div className="rounded-xl bg-over-050 px-4 py-3 text-[13px] text-[#9b2020]">{active.blocker}</div>
              ) : null}
              <div>
                <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.05em] text-ink-400">Duties included</p>
                <div className="space-y-2">
                  {(active.content?.obligations ?? []).map((ob) => (
                    <div key={ob.title} className="rounded-xl border border-line-2 px-3.5 py-3">
                      <div className="text-[13.5px] font-semibold">{ob.title}</div>
                      <div className="mt-0.5 text-[12.5px] text-ink-400">
                        {ob.category} · {ob.cadence} · {ob.status.replace(/_/g, " ")}
                      </div>
                    </div>
                  ))}
                  {(active.content?.obligations ?? []).length === 0 ? (
                    <p className="text-[13px] text-ink-400">No matching obligations were included in this pack.</p>
                  ) : null}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.05em] text-ink-400">Evidence pulled</p>
                <div className="space-y-2">
                  {(active.content?.evidence ?? []).map((ev) => (
                    <div key={`${ev.name}-${ev.createdAt}`} className="flex justify-between gap-3 text-[13px]">
                      <span className="font-medium">{ev.name}</span>
                      <span className="shrink-0 text-ink-400">
                        {ev.obligation ?? "Unlinked"} · {new Date(ev.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  ))}
                  {(active.content?.evidence ?? []).length === 0 ? (
                    <p className="text-[13px] text-ink-400">No vault files matched this pack yet.</p>
                  ) : null}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.05em] text-ink-400">Recent logbook</p>
                <div className="space-y-2">
                  {(active.content?.recentLogs ?? []).map((log) => (
                    <div key={`${log.type}-${log.createdAt}`} className="rounded-xl border border-line-2 px-3.5 py-3">
                      <div className="text-[13.5px] font-semibold">{log.type}</div>
                      <div className="mt-0.5 text-[12.5px] text-ink-400">
                        {log.site}
                        {log.obligation ? ` · ${log.obligation}` : ""} ·{" "}
                        {new Date(log.createdAt).toLocaleDateString("en-GB")}
                      </div>
                      {log.description ? (
                        <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{log.description}</p>
                      ) : null}
                    </div>
                  ))}
                  {(active.content?.recentLogs ?? []).length === 0 ? (
                    <p className="text-[13px] text-ink-400">No logbook entries were included in this pack.</p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/api/reports/generated/${active.id}/pdf`}
                  className="rounded-lg bg-brand-500 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-brand-600"
                >
                  Download PDF
                </a>
                <Link
                  href="/app/share"
                  className="rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-ink-700 hover:bg-canvas"
                >
                  Share compliance pack
                </Link>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-ink-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
