"use client";

import { LOG_TYPES } from "@ballast/domain";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHead, StatTile } from "@/components/app/app-ui";
import { ApiError, client, type LogEntry, type Obligation, type Organisation } from "@/lib/api";
import { categoryMeta } from "@/lib/compliance";
import {
  emptyLogbookMessage,
  filterLogEntries,
  logbookCategoryFilters,
  logbookStats,
  logbookSubtitle,
  suggestedObligations,
  type LogbookTimeFilter,
} from "@/lib/logbook";
import { filterByQuery } from "@/lib/search";

export function Logbook() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [org, setOrg] = useState<Organisation | null>(null);
  const [items, setItems] = useState<LogEntry[]>([]);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState<LogbookTimeFilter>("all");
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [typeId, setTypeId] = useState(LOG_TYPES[0]?.id ?? "fridge_check");
  const [siteId, setSiteId] = useState("");
  const [obligationId, setObligationId] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const reload = useCallback(async () => {
    const [organisation, logs, register] = await Promise.all([
      client.organisation(),
      client.listLogs(),
      client.listObligations(),
    ]);
    setOrg(organisation);
    setItems(logs);
    setObligations(register);
  }, []);

  useEffect(() => {
    reload().catch(() => setError("Could not load the logbook."));
  }, [reload]);

  useEffect(() => {
    if (!siteId && org?.sites[0]) setSiteId(org.sites[0].id);
  }, [org, siteId]);

  const selectedType = LOG_TYPES.find((item) => item.id === typeId) ?? LOG_TYPES[0];
  const suggested = useMemo(
    () => (selectedType ? suggestedObligations(obligations, selectedType.category) : obligations),
    [obligations, selectedType],
  );

  const stats = useMemo(() => logbookStats(items), [items]);
  const categoryFilters = useMemo(() => logbookCategoryFilters(items), [items]);
  const visible = useMemo(() => {
    const filtered = filterLogEntries(items, categoryFilter, siteFilter, timeFilter);
    return filterByQuery(filtered, searchQuery, (item) => [
      item.type,
      item.description,
      item.category,
      item.createdByName,
      item.site.name,
      item.obligation?.title ?? "",
    ]);
  }, [items, categoryFilter, siteFilter, timeFilter, searchQuery]);

  const emptyMessage =
    searchQuery && visible.length === 0
      ? {
          title: "No entries match",
          message: `Nothing in the logbook matches “${searchQuery}”. Try a different search or filter.`,
          actionLabel: undefined,
        }
      : emptyLogbookMessage(items, categoryFilter, siteFilter, timeFilter);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedType || !siteId) return;
    setError(null);
    setPending(true);
    try {
      const form = new FormData();
      form.set("type", selectedType.label);
      form.set("category", selectedType.category);
      form.set("description", description);
      form.set("siteId", siteId);
      if (obligationId) form.set("obligationId", obligationId);
      if (file) form.set("file", file);
      await client.createLog(form);
      setDescription("");
      setFile(null);
      setObligationId("");
      setOpen(false);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this entry");
    } finally {
      setPending(false);
    }
  }

  if (error && !org) {
    return <p className="text-sm font-medium text-rose-600">{error}</p>;
  }

  if (!org) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse card" />
        <div className="h-64 animate-pulse card" />
      </div>
    );
  }

  const noSites = org.sites.length === 0;

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <PageHead
        breadcrumbs={[
          { label: org?.name ?? "The Copper Kettle Ltd" },
          { label: "Operations" },
          { label: "Compliance Logbook" },
        ]}
        title="Operational Compliance Logbook"
        subtitle="Timestamped operational audit trail of daily fridge checks, fire alarm tests, probe calibrations, and supervisor sign-offs. Closes statutory evidence gaps automatically."
        actions={
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            disabled={noSites}
            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{open ? "Close Entry Form" : "Record Entry"}</span>
          </button>
        }
      />

      {noSites ? (
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-6 text-center">
          <p className="text-xs font-bold text-amber-900">No operating sites registered</p>
          <p className="mt-1 text-xs text-amber-700">
            Add your operating locations before logging daily checks.
          </p>
          <Link href="/app/settings" className="btn btn-primary btn-sm mt-3 inline-flex">
            Add Operating Site &rarr;
          </Link>
        </div>
      ) : null}

      {/* 4-Column Executive Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total Logbook Records"
          value={stats.total}
          tone="brand"
          hint="All operational entries"
        />
        <StatTile
          label="Logged Today"
          value={stats.today}
          tone={stats.today > 0 ? "ok" : "due"}
          hint={stats.today > 0 ? "Active shift records" : "No checks logged yet today"}
          hintTone={stats.today > 0 ? "up" : "muted"}
        />
        <StatTile
          label="Linked to Statutory Duties"
          value={stats.linked}
          tone="teal"
          hint={`${stats.total ? Math.round((stats.linked / stats.total) * 100) : 0}% attached to obligations`}
          hintTone="up"
        />
        <StatTile
          label="With Photographic Proof"
          value={stats.attachments}
          tone="ok"
          hint="Verified attachments"
        />
      </div>

      {open ? (
        <form className="card p-5 space-y-4 animate-in fade-in" onSubmit={onSubmit}>
          <div className="border-b hairline pb-3">
            <h3 className="text-sm font-bold text-slate-900">Record Operational Log Entry</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Record a routine inspection, sensor check, or maintenance task to automatically prove statutory compliance.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Check / Entry Type</span>
              <select
                className="field text-xs"
                value={typeId}
                onChange={(e) => {
                  setTypeId(e.target.value);
                  setObligationId("");
                }}
              >
                {LOG_TYPES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Operating Site</span>
              <select
                className="field text-xs"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                required
              >
                {org.sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-700">Link to Statutory Obligation</span>
            <select
              className="field text-xs"
              value={obligationId}
              onChange={(e) => setObligationId(e.target.value)}
            >
              <option value="">Optional — link to close an evidence gap</option>
              {suggested.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            {obligations.length === 0 ? (
              <p className="mt-1 font-mono text-[11px] text-slate-400">
                No obligations on your register yet.{" "}
                <Link href="/onboarding/review" className="font-semibold text-sky-700 hover:underline">
                  Generate your duty set
                </Link>{" "}
                to link entries.
              </p>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-700">Operational Observations &amp; Readings</span>
            <textarea
              className="field min-h-[90px] text-xs"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Walk-in chiller: 2.8°C, prep fridge: 4.1°C. Probe sanitized and calibrated."
              required
              minLength={3}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-700">
              Photographic / Signature Proof <span className="font-normal text-slate-400">(optional)</span>
            </span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="field !py-1 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-300"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <div className="flex items-center gap-2 pt-2 border-t hairline">
            <button
              type="submit"
              disabled={pending}
              className="btn btn-primary btn-sm"
            >
              {pending ? "Saving…" : "Save Entry to Audit Log"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-ghost btn-sm text-slate-600"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      {/* Filter and Search Bar */}
      <div className="card p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                categoryFilter === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              All Types
            </button>
            {categoryFilters.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setCategoryFilter(id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  categoryFilter === id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {categoryMeta(id).name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              className="field !py-1 !text-xs !w-auto"
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
            >
              <option value="all">All sites</option>
              {org.sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
            <select
              className="field !py-1 !text-xs !w-auto"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as LogbookTimeFilter)}
            >
              <option value="all">All time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
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
            placeholder="Filter logbook by operator, duty, check type, or observation details..."
          />
        </div>
      </div>

      {/* Log Entries Audit Feed */}
      <div className="card overflow-hidden">
        {visible.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-bold text-slate-900">{emptyMessage.title}</p>
            <p className="max-w-md mx-auto text-xs text-slate-500 leading-relaxed">{emptyMessage.message}</p>
            {emptyMessage.actionLabel && !noSites ? (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="btn btn-primary btn-sm mt-3 inline-flex"
              >
                {emptyMessage.actionLabel} &rarr;
              </button>
            ) : null}
          </div>
        ) : (
          <div className="divide-y hairline">
            {visible.map((item) => {
              const cat = categoryMeta(item.category);
              return (
                <article key={item.id} className="flex gap-4 p-4 transition hover:bg-slate-50/60">
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-base ${cat.bg}`}>
                    {cat.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-xs font-bold text-slate-900">{item.type}</div>
                      <span className="pill st-neutral !text-[10px] !py-0.2">
                        {cat.name}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-700">{item.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-600">{item.createdByName}</span>
                      <span>·</span>
                      <span>{item.site.name}</span>
                      <span>·</span>
                      <span>{new Date(item.createdAt).toLocaleString("en-GB")}</span>
                      {item.obligation ? (
                        <>
                          <span>·</span>
                          <span className="font-semibold text-sky-700">{item.obligation.title}</span>
                        </>
                      ) : (
                        <>
                          <span>·</span>
                          <span>Unlinked</span>
                        </>
                      )}
                      {item.evidence.length > 0 ? (
                        <>
                          <span>·</span>
                          <span className="rounded bg-sky-50 px-1.5 py-0.5 font-semibold text-sky-700">
                            {item.evidence.length} attachment{item.evidence.length === 1 ? "" : "s"}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="font-mono text-[11px] text-slate-400">
        {items.length === 0
          ? "Entries save to your organisation logbook and feed continuous monitoring and statutory dossiers."
          : `Showing ${visible.length} of ${items.length} records · ${obligations.length} statutory duties active on register.`}
      </div>
    </div>
  );
}
