"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  opsClient,
  OpsScraperSource,
  OpsCrawlItem,
  UrlValidationResult,
} from "@/lib/ops-api";
import { OpsPageHead, OpsStat } from "./ops-ui";

function formatFullDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

function sectorBadge(sector: string) {
  const map: Record<string, string> = {
    all: "All sectors",
    hospitality: "Hospitality & food",
    construction: "Construction & trades",
    care: "Care & childcare",
    retail: "Licensed retail",
    property: "Property & facilities",
  };
  return map[sector] ?? sector;
}

const SECTOR_COLORS: Record<string, string> = {
  all: "bg-slate-100 text-slate-700",
  hospitality: "bg-orange-50 text-orange-700",
  construction: "bg-yellow-50 text-yellow-700",
  care: "bg-blue-50 text-blue-700",
  retail: "bg-purple-50 text-purple-700",
  property: "bg-emerald-50 text-emerald-700",
};

// ─── Edit Source Modal ────────────────────────────────────────────────────────

function EditSourceModal({
  isOpen,
  source,
  onClose,
  onUpdated,
}: {
  isOpen: boolean;
  source: OpsScraperSource;
  onClose: () => void;
  onUpdated: (updated: OpsScraperSource) => void;
}) {
  const [name, setName] = useState(source.name);
  const [portalUrl, setPortalUrl] = useState(source.portalUrl);
  const [sector, setSector] = useState(source.sector);
  const [frequency, setFrequency] = useState(source.frequency);
  const [status, setStatus] = useState(source.status);

  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<UrlValidationResult | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(source.name);
    setPortalUrl(source.portalUrl);
    setSector(source.sector);
    setFrequency(source.frequency);
    setStatus(source.status);
    setValidation(null);
    setError(null);
  }, [source]);

  if (!isOpen) return null;

  const handleValidateUrl = async () => {
    if (!portalUrl.trim()) return;
    setValidating(true);
    try {
      const res = await opsClient.validateUrl(portalUrl.trim());
      setValidation(res);
    } catch {
      setValidation({
        valid: false,
        reachable: false,
        statusCode: 0,
        durationMs: 0,
        normalizedUrl: portalUrl,
        hostname: "",
        message: "Validation request failed",
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await opsClient.updateRegulatorySource(source.id, {
        name: name.trim(),
        portalUrl: portalUrl.trim(),
        sector,
        frequency,
        status,
      });
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Failed to update source");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Edit Regulatory Source</h3>
            <p className="text-[12.5px] text-slate-500 mt-0.5">
              Modify source metadata, portal link, or toggle active status.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[12.5px] text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Source Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-[13px] text-slate-900 outline-none transition focus:border-[#E52E2E] focus:bg-white focus:ring-2 focus:ring-[#E52E2E]/15"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[12px] font-semibold uppercase tracking-wider text-slate-700">
                Portal Link / Web URL *
              </label>
              <button
                type="button"
                onClick={handleValidateUrl}
                disabled={validating}
                className="text-[11.5px] font-semibold text-[#E52E2E] hover:underline flex items-center gap-1"
              >
                {validating ? "Validating live…" : "Validate link live ↗"}
              </button>
            </div>
            <input
              type="text"
              required
              value={portalUrl}
              onChange={(e) => {
                setPortalUrl(e.target.value);
                setValidation(null);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-[12.5px] font-mono text-slate-900 outline-none transition focus:border-[#E52E2E] focus:bg-white focus:ring-2 focus:ring-[#E52E2E]/15"
            />
            {validation && (
              <div
                className={`mt-2 rounded-lg px-3 py-1.5 text-[12px] flex items-center justify-between ${
                  validation.reachable
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                <span>{validation.reachable ? "✓" : "⚠"} {validation.message}</span>
                <span className="font-mono text-[11px] opacity-75">{validation.durationMs}ms</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Target Sector
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-900 outline-none transition focus:border-[#E52E2E] focus:bg-white focus:ring-2 focus:ring-[#E52E2E]/15"
              >
                <option value="hospitality">Hospitality & food</option>
                <option value="construction">Construction & trades</option>
                <option value="care">Care & childcare</option>
                <option value="retail">Licensed retail</option>
                <option value="property">Property & facilities</option>
                <option value="all">Universal / All sectors</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Crawl Cadence
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-900 outline-none transition focus:border-[#E52E2E] focus:bg-white focus:ring-2 focus:ring-[#E52E2E]/15"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Crawler Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-900 outline-none transition focus:border-[#E52E2E] focus:bg-white focus:ring-2 focus:ring-[#E52E2E]/15"
            >
              <option value="active">Active (Included in crawl activities)</option>
              <option value="inactive">Inactive (Paused from crawler activities)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#E52E2E] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#DC2626] transition active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving Changes…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Detailed Material Page Component ─────────────────────────────────────

export function OpsCrawlerDetailPage({ sourceId }: { sourceId?: string }) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = sourceId ?? params?.id;

  const [source, setSource] = useState<OpsScraperSource | null>(null);
  const [crawls, setCrawls] = useState<OpsCrawlItem[]>([]);
  const [selectedCrawlIndex, setSelectedCrawlIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [crawling, setCrawling] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Tabs for visualization
  const [activeTab, setActiveTab] = useState<"duties" | "reader" | "telemetry">("duties");
  const [phraseSearch, setPhraseSearch] = useState("");

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const data = await opsClient.scraperDetails(id);
      setSource(data.source);
      setCrawls(data.crawls);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load source details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCrawlNow = async () => {
    if (!source) return;
    setCrawling(true);
    try {
      await opsClient.triggerCrawl(source.code);
      await loadData();
      setSelectedCrawlIndex(0);
    } catch (e: any) {
      setError(e?.message ?? "Crawl failed");
    } finally {
      setCrawling(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!source) return;
    const nextStatus = source.status === "active" ? "inactive" : "active";
    try {
      const updated = await opsClient.updateRegulatorySource(source.id, {
        status: nextStatus,
      });
      setSource((prev) => (prev ? { ...prev, status: updated.status } : null));
    } catch (e: any) {
      setError(e?.message ?? "Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="animate-pulse text-[15px]">Loading regulatory materials and crawl history…</div>
      </div>
    );
  }

  if (!source) {
    return (
      <div className="space-y-4 py-12 text-center">
        <div className="text-4xl">⚠️</div>
        <div className="text-lg font-bold text-slate-800">Regulatory source not found</div>
        <Link
          href="/ops/crawler"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E52E2E] hover:underline"
        >
          ← Return to Web Crawler Registry
        </Link>
      </div>
    );
  }

  const currentCrawl: OpsCrawlItem | undefined = crawls[selectedCrawlIndex];
  const colorClass = SECTOR_COLORS[source.sector] ?? SECTOR_COLORS.all;

  const filteredPhrases = (currentCrawl?.extractedItems ?? []).filter((p) =>
    p.toLowerCase().includes(phraseSearch.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/ops/crawler"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-600 hover:text-[#E52E2E] transition group"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">←</span>
          <span>Back to Web Crawler Registry</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleStatus}
            className={`rounded-xl border px-3 py-1.5 text-[12.5px] font-semibold transition ${
              source.status === "active"
                ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            {source.status === "active" ? "⏸ Deactivate from Crawls" : "▶ Activate for Crawls"}
          </button>
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition"
          >
            ✏️ Edit Source
          </button>
          <button
            type="button"
            onClick={handleCrawlNow}
            disabled={crawling}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#E52E2E] px-4 py-1.5 text-[12.5px] font-semibold text-white shadow-sm hover:bg-[#DC2626] transition active:scale-95 disabled:opacity-50"
          >
            {crawling ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                </svg>
                Crawling live site…
              </>
            ) : (
              <>↻ Crawl Now</>
            )}
          </button>
        </div>
      </div>

      {/* Main Source Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
                  source.status === "active"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : source.status === "inactive"
                      ? "bg-slate-100 text-slate-600 border border-slate-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                ● {source.status.toUpperCase()}
              </span>
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ${colorClass}`}>
                {sectorBadge(source.sector)}
              </span>
              <span className="text-[12px] text-slate-500 font-mono">
                Code: {source.code}
              </span>
              <span className="text-[12px] text-slate-400">·</span>
              <span className="text-[12px] text-slate-500 capitalize">
                Cadence: {source.frequency}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              {source.name}
            </h1>

            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[12.5px] text-slate-500">Live Regulatory Portal:</span>
              <a
                href={source.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12.5px] text-[#E52E2E] font-mono hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>{source.portalUrl}</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <OpsStat
          label="Total Crawls"
          value={String(crawls.length)}
          hint="Historical runs in DB"
          tone="admin"
        />
        <OpsStat
          label="Rules & Hints Mapped"
          value={String(source.rulesCount)}
          hint="Extracted phrases"
          tone="brand"
        />
        <OpsStat
          label="Latest Status"
          value={currentCrawl?.status === "success" ? "Healthy" : currentCrawl ? "Error" : "Uncrawled"}
          hint={currentCrawl?.durationMs ? `${currentCrawl.durationMs}ms response` : "No runs"}
          tone={currentCrawl?.status === "success" ? "ok" : "over"}
        />
        <OpsStat
          label="Last Crawl Execution"
          value={relativeTime(source.lastCrawlAt)}
          hint={formatFullDate(source.lastCrawlAt)}
          tone="admin"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700 flex items-center justify-between">
          <span>⚠ {error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-700">
            ×
          </button>
        </div>
      )}

      {/* Crawled Material Visualization Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[620px]">
        {/* Left Column: Historical Crawls List */}
        <div className="w-full md:w-80 shrink-0 border-b md:border-b-0 md:border-r border-slate-100 bg-[#F8FAFC]/70 p-4 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500">
              Crawl History ({crawls.length})
            </span>
            <span className="text-[11px] font-mono text-slate-400">Timestamps</span>
          </div>

          {crawls.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-[13px]">
              No crawl executions yet. Click "Crawl Now" above to fetch live data.
            </div>
          ) : (
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {crawls.map((c, idx) => {
                const isSelected = idx === selectedCrawlIndex;
                const isSuccess = c.status === "success";
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCrawlIndex(idx)}
                    className={`w-full text-left rounded-xl p-3.5 border transition ${
                      isSelected
                        ? "border-[#E52E2E]/40 bg-white shadow-sm ring-2 ring-[#E52E2E]/15"
                        : "border-slate-200/80 bg-white/70 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10.5px] font-mono font-semibold ${
                          isSuccess
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {c.status}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {c.durationMs ? `${c.durationMs}ms` : "—"}
                      </span>
                    </div>

                    <div className="text-[13px] font-bold text-slate-900 font-mono leading-tight">
                      {formatFullDate(c.createdAt)}
                    </div>
                    <div className="text-[11.5px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>{relativeTime(c.createdAt)}</span>
                      <span className="font-semibold text-slate-700">
                        {c.itemsFound} phrases · +{c.itemsNew} new
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Deep Visualization */}
        <div className="flex-1 flex flex-col min-w-0 p-6 space-y-6">
          {!currentCrawl ? (
            <div className="py-24 text-center text-slate-400">
              <div className="text-4xl mb-2">📄</div>
              <div className="text-[15px] font-bold text-slate-700">No crawl execution selected</div>
              <p className="text-[13px] text-slate-500 mt-1">
                Trigger a crawl to extract regulatory materials and obligation hints.
              </p>
            </div>
          ) : (
            <>
              {/* Active Crawl Details Banner */}
              <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Selected Execution Timestamp
                  </span>
                  <div className="text-[15px] font-bold text-slate-900 mt-0.5 font-mono">
                    {formatFullDate(currentCrawl.createdAt)}
                  </div>
                  <div className="text-[12px] text-slate-500">
                    Executed {relativeTime(currentCrawl.createdAt)}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Phrases Extracted
                    </span>
                    <div className="text-[18px] font-bold text-slate-900 font-mono">
                      {currentCrawl.itemsFound}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      New Hints
                    </span>
                    <div className="text-[18px] font-bold text-emerald-600 font-mono">
                      +{currentCrawl.itemsNew}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Duration
                    </span>
                    <div className="text-[18px] font-bold text-slate-700 font-mono">
                      {currentCrawl.durationMs ?? 0}ms
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 gap-6">
                <button
                  type="button"
                  onClick={() => setActiveTab("duties")}
                  className={`pb-3 text-[13.5px] font-semibold transition border-b-2 -mb-px flex items-center gap-2 ${
                    activeTab === "duties"
                      ? "border-[#E52E2E] text-[#E52E2E]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span>📌 Statutory Duties & Obligation Hints</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600">
                    {currentCrawl.extractedItems?.length ?? currentCrawl.itemsFound}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("reader")}
                  className={`pb-3 text-[13.5px] font-semibold transition border-b-2 -mb-px flex items-center gap-2 ${
                    activeTab === "reader"
                      ? "border-[#E52E2E] text-[#E52E2E]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span>📜 Document Reader View</span>
                  {currentCrawl.rawSnippet && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600">
                      {currentCrawl.rawSnippet.length.toLocaleString()} chars
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("telemetry")}
                  className={`pb-3 text-[13.5px] font-semibold transition border-b-2 -mb-px flex items-center gap-2 ${
                    activeTab === "telemetry"
                      ? "border-[#E52E2E] text-[#E52E2E]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span>⚙️ Technical Diagnostics</span>
                </button>
              </div>

              {/* Tab 1: Extracted Requirements & Hints */}
              {activeTab === "duties" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[13px] text-slate-600">
                      Statutory statements, headings, and rules extracted from the live portal to generate business obligations.
                    </p>
                    <input
                      type="text"
                      value={phraseSearch}
                      onChange={(e) => setPhraseSearch(e.target.value)}
                      placeholder="Search phrases…"
                      className="w-64 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12.5px] outline-none transition focus:border-[#E52E2E] focus:bg-white focus:ring-2 focus:ring-[#E52E2E]/15"
                    />
                  </div>

                  {filteredPhrases.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
                      {filteredPhrases.map((phrase, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 hover:border-slate-300 hover:shadow-sm transition"
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-50 text-[10.5px] font-mono font-bold text-[#E52E2E]">
                              {i + 1}
                            </span>
                            <span className="text-[13px] font-medium text-slate-800 leading-snug">
                              {phrase}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(phrase)}
                            className="text-[11px] font-medium text-slate-400 hover:text-slate-700 shrink-0 transition"
                            title="Copy phrase"
                          >
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-[13px] text-slate-400">
                      {phraseSearch ? "No phrases match your search query." : "No discrete phrases extracted for this crawl run."}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Document Reader View */}
              {activeTab === "reader" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[12.5px] text-slate-500">
                    <span>Cleaned plain-text extracted from the regulatory HTML source:</span>
                    {currentCrawl.rawSnippet && (
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(currentCrawl.rawSnippet ?? "")}
                        className="text-[12px] font-semibold text-[#E52E2E] hover:underline"
                      >
                        Copy Document Text
                      </button>
                    )}
                  </div>

                  {currentCrawl.rawSnippet ? (
                    <div className="rounded-2xl border border-slate-200 bg-[#0F172A] p-5 text-[12.5px] font-mono text-slate-200 max-h-[460px] overflow-y-auto whitespace-pre-wrap leading-relaxed selection:bg-rose-500 selection:text-white">
                      {currentCrawl.rawSnippet}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-[13px] text-slate-400">
                      No document text snippet captured for this crawl run.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Diagnostics */}
              {activeTab === "telemetry" && (
                <div className="space-y-4">
                  {currentCrawl.errorLog ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
                      <div className="font-semibold text-red-900 text-[13px]">
                        ⚠ Crawl Error Encountered
                      </div>
                      <pre className="text-[12px] font-mono text-red-700 whitespace-pre-wrap bg-white/70 p-3 rounded-lg border border-red-100">
                        {currentCrawl.errorLog}
                      </pre>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-[13px] text-emerald-800">
                      ✓ Execution succeeded with HTTP 200 without network or parsing anomalies.
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-[12px] space-y-2 text-slate-700">
                    <div><strong>Crawl Record ID:</strong> {currentCrawl.id}</div>
                    <div><strong>Source ID:</strong> {source.id}</div>
                    <div><strong>Source Slug:</strong> {source.code}</div>
                    <div><strong>Created At:</strong> {currentCrawl.createdAt}</div>
                    <div><strong>Execution Duration:</strong> {currentCrawl.durationMs ?? 0}ms</div>
                    <div><strong>Phrases Found:</strong> {currentCrawl.itemsFound}</div>
                    <div><strong>New Hints:</strong> {currentCrawl.itemsNew}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditSourceModal
        isOpen={isEditOpen}
        source={source}
        onClose={() => setIsEditOpen(false)}
        onUpdated={(updated) => setSource(updated)}
      />
    </div>
  );
}
