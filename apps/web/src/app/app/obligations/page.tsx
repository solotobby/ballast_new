"use client";

import { OBLIGATION_STATUSES, type ObligationStatus } from "@ballast/domain";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { PageHead, StatTile } from "@/components/app/app-ui";
import { ApiError, client, type Obligation, type Organisation, type SessionUser } from "@/lib/api";
import { categoryMeta, statusTone } from "@/lib/compliance";
import { canEditObligationStatus } from "@/lib/nav";
import { filterByQuery } from "@/lib/search";
import { deriveComplianceAction, deriveRegulatoryAuthority } from "@/components/app/dashboard";

const REVIEW: Record<string, string> = {
  pending: "Pending review",
  confirmed: "Confirmed",
  flagged: "Flagged",
};

const STATUS_SELECT: Record<string, string> = {
  ok: "bg-emerald-50 text-emerald-800 border-emerald-200",
  due: "bg-amber-50 text-amber-800 border-amber-200",
  over: "bg-rose-50 text-rose-800 border-rose-200",
  gap: "bg-purple-50 text-purple-800 border-purple-200",
};

type Filter = "all" | "pending" | ObligationStatus;

export default function ObligationsPage() {
  return (
    <Suspense fallback={null}>
      <ObligationsPageInner />
    </Suspense>
  );
}

function ObligationsPageInner() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [items, setItems] = useState<Obligation[]>([]);
  const [org, setOrg] = useState<Organisation | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reevaluating, setReevaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canEditStatus = canEditObligationStatus(user);

  useEffect(() => {
    Promise.all([client.listObligations(), client.organisation(), client.me()])
      .then(([rows, organisation, me]) => {
        setItems(rows);
        setOrg(organisation);
        setUser(me.user);
      })
      .catch(() => {
        window.location.href = "/signin";
      });
  }, []);

  async function updateStatus(id: string, status: ObligationStatus) {
    const previous = items.find((item) => item.id === id);
    setError(null);
    setSavingId(id);
    setItems((rows) =>
      rows.map((row) => (row.id === id ? { ...row, status, statusManual: true } : row)),
    );
    try {
      const updated = await client.updateObligationStatus(id, status);
      setItems((rows) => rows.map((row) => (row.id === id ? updated : row)));
    } catch (err) {
      if (previous) {
        setItems((rows) => rows.map((row) => (row.id === id ? previous : row)));
      }
      setError(err instanceof ApiError ? err.message : "Could not update that status");
    } finally {
      setSavingId(null);
    }
  }

  async function handleReevaluate() {
    setReevaluating(true);
    setError(null);
    try {
      await client.generateObligations();
      const updated = await client.listObligations();
      setItems(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not re-evaluate obligations");
    } finally {
      setReevaluating(false);
    }
  }

  const handleExportCsv = () => {
    const headers = ["ID", "Title", "Category", "Jurisdiction", "Cadence", "Status", "Legal Basis"];
    const rows = items.map((o) => [
      `"${o.definitionId || o.id}"`,
      `"${o.title.replace(/"/g, '""')}"`,
      `"${o.category}"`,
      `"UK Statutory"`,
      `"${o.cadence}"`,
      `"${o.status.toUpperCase()}"`,
      `"${o.basis.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ballast-obligations-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const searched = useMemo(() => {
    return filterByQuery(items, searchQuery, (item) => [
      item.title,
      item.basis,
      item.category,
      item.definitionId,
      item.evidence,
      item.aiWhy ?? "",
    ]);
  }, [items, searchQuery]);

  const visible = useMemo(() => {
    return searched.filter((item) => {
      if (filter === "pending") return item.reviewState === "pending";
      if (filter === "all") return true;
      return item.status === filter;
    });
  }, [searched, filter]);

  const onTrackCount = items.filter((item) => item.status === "on_track").length;
  const overdueCount = items.filter((item) => item.status === "overdue").length;
  const dueSoonCount = items.filter((item) => item.status === "due_soon").length;
  const gapCount = items.filter((item) => item.status === "evidence_gap").length;
  const pendingCount = items.filter((item) => item.reviewState === "pending").length;

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All Duties", count: items.length },
    { id: "overdue", label: "Overdue", count: overdueCount },
    { id: "due_soon", label: "Due Soon", count: dueSoonCount },
    { id: "evidence_gap", label: "Evidence Gaps", count: gapCount },
    { id: "on_track", label: "Verified & On Track", count: onTrackCount },
    { id: "pending", label: "Needs Confirmation", count: pendingCount },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <PageHead
        breadcrumbs={[
          { label: org?.name ?? "The Copper Kettle Ltd" },
          { label: "Compliance" },
          { label: "Statutory Duties Register" },
        ]}
        title="Statutory Duties Register"
        subtitle="Every legal duty automatically derived from your business profile, operating premises, and active activities. Track statutory proof, review cadence, and maintain defensible compliance."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="btn btn-ghost btn-sm flex items-center gap-1.5"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export CSV</span>
            </button>
            {user?.role === "owner" ? (
              <button
                type="button"
                onClick={handleReevaluate}
                disabled={reevaluating}
                className="btn btn-sunset btn-sm flex items-center gap-1.5 shadow-sm"
              >
                <svg
                  className={`w-3.5 h-3.5 ${reevaluating ? "animate-spin" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                <span>{reevaluating ? "Evaluating..." : "Re-evaluate Register"}</span>
              </button>
            ) : null}
          </div>
        }
      />

      {/* 4-Column Executive Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total Statutory Duties"
          value={items.length}
          tone="brand"
          hint="Enforced across 1 site"
        />
        <StatTile
          label="Verified & On Track"
          value={onTrackCount}
          tone="ok"
          hint={`${items.length ? Math.round((onTrackCount / items.length) * 100) : 0}% compliance posture`}
          hintTone="up"
        />
        <StatTile
          label="Action Required"
          value={overdueCount + dueSoonCount}
          tone={overdueCount > 0 ? "over" : "due"}
          hint={overdueCount > 0 ? `${overdueCount} breach / overdue` : "Due within 30 days"}
          hintTone={overdueCount > 0 ? "down" : "muted"}
        />
        <StatTile
          label="Evidence Gaps & Review"
          value={gapCount + pendingCount}
          tone="gap"
          hint={`${gapCount} gaps · ${pendingCount} pending review`}
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      {/* Main Register Card */}
      <div className="card overflow-hidden">
        {/* Filter & Search Toolbar */}
        <div className="p-4 border-b hairline space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {filters.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                    filter === tab.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      filter === tab.id
                        ? "bg-slate-700 text-slate-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="field !pl-9 !py-1.5 !text-xs bg-slate-50 focus:bg-white"
              placeholder="Filter duties by name, statutory act (e.g. Food Safety Act 1990), or category..."
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="dtable w-full">
            <thead>
              <tr>
                <th>Statutory Duty &amp; Authority</th>
                <th>Category</th>
                <th className="hidden md:table-cell">Cadence</th>
                <th>Compliance State</th>
              </tr>
            </thead>
            <tbody>
            {visible.map((item) => {
              const cat = categoryMeta(item.category);
              const tone = statusTone(item.status);
              const defId = item.definitionId || item.id;
              const auth = deriveRegulatoryAuthority(item.title, item.basis || "", item.category || "");
              const actionRequired = deriveComplianceAction(item.title, item.evidence || "", item.category || "", item.status);

              return (
                <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-ink text-[13.5px]">{item.title}</div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-slate-500 flex-wrap">
                      <span>{defId}</span>
                      <span>·</span>
                      <span className={`font-mono font-bold text-[9px] px-1.5 py-0.5 rounded border ${auth.tone}`}>
                        {auth.code}
                      </span>
                      <span>·</span>
                      <span className="truncate max-w-[280px]" title={item.basis}>{item.basis}</span>
                    </div>
                    {/* Plain English Action Required */}
                    <div className="mt-2 text-xs font-semibold text-slate-800 bg-rose-50/50 p-2 rounded-lg border border-rose-100/80">
                      <span className="text-[#E52E2E] font-bold mr-1">Action:</span>
                      {actionRequired}
                    </div>
                    {item.evidence && (
                      <div className="mt-1 text-[11px] font-mono text-slate-500">
                        Proof: <span className="text-slate-700 font-medium">{item.evidence}</span>
                      </div>
                    )}
                    {item.aiWhy ? <div className="mt-1.5 text-[11.5px] text-slate-500 italic">{item.aiWhy}</div> : null}
                    <div className="mt-2.5 flex items-center gap-2">
                      <Link
                        href={`/app/obligations/${item.id}`}
                        className="btn-sunset-sm shadow-2xs"
                      >
                        <span>Fill Questionnaire</span>
                        <span>&rarr;</span>
                      </Link>
                      <Link
                        href="/app/vault"
                        className="btn btn-ghost btn-xs text-xs text-slate-600 hover:text-slate-900 border border-slate-200"
                      >
                        Upload proof &rarr;
                      </Link>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-700">
                    <span className="inline-flex items-center gap-1.5 font-medium text-xs">
                      <span>{cat.emoji}</span>
                      <span>{cat.name}</span>
                    </span>
                  </td>
                  <td className="hidden px-5 py-4 text-slate-600 md:table-cell font-mono text-xs">
                    {item.cadence}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col items-start gap-1.5">
                      {canEditStatus ? (
                        <>
                          <label className="sr-only" htmlFor={`status-${item.id}`}>
                            Status for {item.title}
                          </label>
                          <select
                            id={`status-${item.id}`}
                            value={item.status}
                            disabled={savingId === item.id}
                            onChange={(event) => updateStatus(item.id, event.target.value as ObligationStatus)}
                            className={`cursor-pointer rounded-full border border-current/20 py-1 pl-3 pr-7 font-mono text-[11px] font-semibold outline-none transition duration-150 focus:ring-2 focus:ring-sky-500/30 disabled:opacity-60 ${STATUS_SELECT[tone]}`}
                          >
                            {OBLIGATION_STATUSES.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </>
                      ) : (
                        <span className={`rounded-full border border-current/20 px-3 py-1 font-mono text-[11px] font-semibold ${STATUS_SELECT[tone]}`}>
                          {OBLIGATION_STATUSES.find((option) => option.id === item.status)?.label ?? item.status}
                        </span>
                      )}
                      <span className="font-mono text-[10.5px] text-slate-400">
                        {item.statusManual ? "Manual override" : REVIEW[item.reviewState]}
                      </span>
                      {item.formProgress ? (
                        <span className="font-mono text-[10.5px] text-slate-500">
                          Form {item.formProgress.percent}%
                          {item.formProgress.submissionStatus
                            ? ` · ${item.formProgress.submissionStatus.replace("_", " ")}`
                            : ""}
                        </span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        {visible.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            {searchQuery ? `No obligations match “${searchQuery}”.` : "Nothing in this filter."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
