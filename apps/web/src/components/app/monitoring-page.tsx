"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppBadge, PageHead, StatTile } from "@/components/app/app-ui";
import { client, type LogEntry, type Obligation, type Organisation } from "@/lib/api";
import {
  buildMonitoringInsights,
  monitoringFooter,
  monitoringStats,
  monitoringStatusLabel,
  type MonitoringInsight,
} from "@/lib/monitoring";

function InsightCard({ insight }: { insight: MonitoringInsight }) {
  const isOver = insight.severity === "over";
  return (
    <div className="card p-5 space-y-3.5 transition hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${
              isOver ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isOver ? (
                <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01" strokeLinecap="round" />
              ) : (
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" strokeLinecap="round" />
                </>
              )}
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{insight.title}</h4>
            <p className="font-mono text-[11px] text-slate-400 mt-0.5">{insight.meta}</p>
          </div>
        </div>
        <AppBadge tone="brand">{insight.confidence} confidence</AppBadge>
      </div>

      <p className="text-xs leading-relaxed text-slate-600">{insight.body}</p>

      {/* Root cause attribution banner */}
      <div className="rounded-lg border-l-2 border-sky-500 bg-slate-50 px-3.5 py-2.5">
        <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-700">
          {insight.rootLabel}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-700">{insight.rootBody}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Link href={insight.primaryHref} className="btn btn-primary btn-sm">
          {insight.primaryLabel}
        </Link>
        <Link href={insight.secondaryHref} className="btn btn-ghost btn-sm text-slate-600">
          {insight.secondaryLabel}
        </Link>
      </div>
    </div>
  );
}

function EmptyInvestigations({
  obligations,
  logs,
}: {
  obligations: Obligation[];
  logs: LogEntry[];
}) {
  if (obligations.length === 0) {
    return (
      <div className="card p-8 text-center space-y-3">
        <div className="w-10 h-10 mx-auto rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="m10 15 5-3-5-3v6z" />
          </svg>
        </div>
        <div className="text-sm font-bold text-slate-900">No obligations to monitor yet</div>
        <p className="max-w-md mx-auto text-xs text-slate-500 leading-relaxed">
          Ballast continuously watches your duty register and operational logbook for recurring non-compliance.
          Generate your statutory register first to activate monitoring.
        </p>
        <Link href="/onboarding/review" className="btn btn-primary btn-sm inline-flex">
          Generate duty set &rarr;
        </Link>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="card p-8 text-center space-y-3">
        <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="text-sm font-bold text-slate-900">
          Continuous monitoring active — awaiting logbook entries
        </div>
        <p className="max-w-md mx-auto text-xs text-slate-500 leading-relaxed">
          {obligations.length} statutory duties are under continuous background surveillance. Record operational checks
          in the logbook — when recurring patterns or gaps emerge within 30 days, root-cause investigations surface here.
        </p>
        <Link href="/app/logbook" className="btn btn-primary btn-sm inline-flex">
          Record First Log &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-8 text-center space-y-3">
      <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div className="text-sm font-bold text-slate-900">No active compliance patterns detected</div>
      <p className="max-w-md mx-auto text-xs text-slate-500 leading-relaxed">
        Zero recurring breaches or clustered evidence gaps in the last 30 operating days. Continuous background rules
        continue to watch all statutory obligations.
      </p>
      <Link href="/app/obligations" className="btn btn-ghost btn-sm inline-flex text-slate-700">
        View Duty Register &rarr;
      </Link>
    </div>
  );
}

export function MonitoringPage() {
  const [org, setOrg] = useState<Organisation | null>(null);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([client.organisation(), client.listObligations(), client.listLogs()])
      .then(([organisation, obs, logItems]) => {
        setOrg(organisation);
        setObligations(obs);
        setLogs(logItems);
      })
      .catch(() => setError("Could not load monitoring."));
  }, []);

  const insights = useMemo(() => buildMonitoringInsights(obligations, logs), [obligations, logs]);
  const stats = useMemo(() => monitoringStats(obligations, logs, insights), [obligations, logs, insights]);
  const status = org ? monitoringStatusLabel(org, obligations, logs) : null;

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead
        breadcrumbs={[
          { label: org?.name ?? "The Copper Kettle Ltd" },
          { label: "Compliance" },
          { label: "Continuous Monitoring" },
        ]}
        title="Continuous Statutory Monitoring"
        subtitle="Autonomous background evaluation of statutory duties, operational logs, and sensor streams. When recurring issues or evidence gaps appear, Ballast investigates root causes to prevent enforcement action."
        actions={
          status ? (
            <AppBadge tone={status.tone === "ok" ? "ok" : "neutral"}>
              {status.label}
            </AppBadge>
          ) : null
        }
      />

      {/* 3-Column Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatTile
          label="Obligations Monitored"
          value={stats.watched}
          tone="brand"
          hint={stats.checksHint}
          hintTone={stats.watched > 0 && stats.attention === 0 ? "up" : "muted"}
        />
        <StatTile
          label="Active Investigations"
          value={stats.patterns}
          tone="gap"
          hint={stats.patternsHint}
          hintTone="muted"
        />
        <StatTile
          label="Resolved with Evidence"
          value={stats.resolved}
          tone="ok"
          hint={stats.resolvedHint}
          hintTone={stats.resolved > 0 ? "up" : "muted"}
        />
      </div>

      {/* 2-Column Main Workspace */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Investigations Stream (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Root-Cause Investigations ({insights.length})
            </h2>
            <span className="font-mono text-[11px] text-slate-400">
              Evaluated every 15 mins
            </span>
          </div>

          {insights.length === 0 ? (
            <EmptyInvestigations obligations={obligations} logs={logs} />
          ) : (
            <div className="space-y-3.5">
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          )}

          <div className="text-[11px] font-mono text-slate-400 pt-2">
            {org ? monitoringFooter(org, obligations, logs) : null}
          </div>
        </div>

        {/* Right Column: Telemetry & Monitoring Audit (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b hairline">
              <span className="text-xs font-bold text-slate-900">Monitoring Engine Status</span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ACTIVE
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Evaluation Interval</span>
                <span className="font-mono font-semibold text-slate-800">15 min continuous</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Pattern Detection Window</span>
                <span className="font-mono font-semibold text-slate-800">30 calendar days</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Evidence Vault Cross-Check</span>
                <span className="font-mono font-semibold text-emerald-700">Automated</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Statutory Threshold</span>
                <span className="font-mono font-semibold text-slate-800">&gt;2 recurrences</span>
              </div>
            </div>

            <div className="pt-2 border-t hairline">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
                Active Statutory Listeners
              </div>
              <div className="space-y-1.5">
                {[
                  { name: "Food Hygiene & HACCP (FSA)", ok: true },
                  { name: "Fire Safety Order 2005 (RRO)", ok: true },
                  { name: "Gas Safety (Installation & Use)", ok: true },
                  { name: "Licensing Act 2003 (DPS Authorisation)", ok: true },
                  { name: "Health & Safety at Work (HSE)", ok: true },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-[11.5px] text-slate-600">
                    <span className="truncate pr-2">{s.name}</span>
                    <span className="font-mono text-[10px] text-emerald-600 font-semibold">ON WATCH</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-4 space-y-2.5 bg-gradient-to-b from-sky-50/50 to-white">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-sky-600 text-white flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <span className="text-xs font-bold text-slate-900">Enforcement Shield</span>
            </div>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              When an inspection occurs, your continuous monitoring log serves as statutory evidence of proactive due
              diligence under UK law.
            </p>
            <Link
              href="/app/reports"
              className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-sky-700 hover:underline"
            >
              Generate inspection dossier &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
