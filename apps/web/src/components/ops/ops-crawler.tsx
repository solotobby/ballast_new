"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  opsClient,
  OpsScraperSource,
  OpsCrawlResult,
  UrlValidationResult,
} from "@/lib/ops-api";
import { OpsBadge, OpsPageHead, OpsStat } from "./ops-ui";

// ─── helpers ──────────────────────────────────────────────────────────────────

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

// ─── sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  if (status === "active")
    return <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Active" />;
  if (status === "inactive")
    return <span className="inline-block h-2 w-2 rounded-full bg-slate-400 shrink-0" title="Inactive" />;
  if (status === "error")
    return <span className="inline-block h-2 w-2 rounded-full bg-red-500 shrink-0" title="Error" />;
  return <span className="inline-block h-2 w-2 rounded-full bg-slate-300 shrink-0" />;
}

function CrawlResultBanner({
  result,
  onClose,
}: {
  result: OpsCrawlResult;
  onClose: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border px-5 py-4 flex items-start gap-4 transition-all ${
        result.failed > 0
          ? "border-amber-200 bg-amber-50/80"
          : "border-emerald-200 bg-emerald-50/80"
      }`}
    >
      <div className="text-2xl">{result.failed > 0 ? "⚠️" : "✅"}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-900 text-[14px]">
          Crawl complete — {result.count} active source{result.count !== 1 ? "s" : ""} processed
        </div>
        <div className="text-[13px] text-slate-600 mt-0.5">
          {result.succeeded} succeeded · {result.failed} failed ·{" "}
          {result.results.reduce((a, r) => a + r.itemsFound, 0)} phrases extracted ·{" "}
          {result.results.reduce((a, r) => a + r.itemsNew, 0)} new obligation hints stored
        </div>
        {result.failed > 0 && (
          <ul className="mt-2 text-[12px] text-amber-700 space-y-0.5">
            {result.results
              .filter((r) => r.status !== "success")
              .map((r) => (
                <li key={r.source.code}>
                  ✗ {r.source.name}: {r.error ?? "unknown error"}
                </li>
              ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-slate-400 hover:text-slate-700 transition text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}

// ─── Add Source Modal with Live URL Validation ─────────────────────────────────

function AddSourceModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (source: OpsScraperSource, autoCrawl: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [portalUrl, setPortalUrl] = useState("");
  const [sector, setSector] = useState("hospitality");
  const [frequency, setFrequency] = useState("daily");
  const [autoCrawl, setAutoCrawl] = useState(true);

  // Live URL validation state
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<UrlValidationResult | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleValidateUrl = async (urlToTest?: string) => {
    const target = (urlToTest ?? portalUrl).trim();
    if (!target) return;
    setValidating(true);
    try {
      const res = await opsClient.validateUrl(target);
      setValidation(res);
      if (res.normalizedUrl && res.normalizedUrl !== portalUrl) {
        setPortalUrl(res.normalizedUrl);
      }
    } catch {
      setValidation({
        valid: false,
        reachable: false,
        statusCode: 0,
        durationMs: 0,
        normalizedUrl: target,
        hostname: "",
        message: "Network request failed during validation",
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !portalUrl.trim()) {
      setError("Please provide both a source name and portal URL");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Validate URL first if not already validated
      if (!validation) {
        const val = await opsClient.validateUrl(portalUrl.trim());
        setValidation(val);
        if (!val.valid) {
          setError(val.message);
          setSaving(false);
          return;
        }
      }

      const created = await opsClient.createRegulatorySource({
        name: name.trim(),
        portalUrl: portalUrl.trim(),
        sector,
        frequency,
      });
      setName("");
      setPortalUrl("");
      setValidation(null);
      onCreated(created, autoCrawl);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Failed to save regulatory source");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Add Regulatory Source</h3>
            <p className="text-[12.5px] text-slate-500 mt-0.5">
              Add a statutory or sector portal link to persist in the database and crawl.
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
              Source / Resource Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HSE — Lifting Operations and Lifting Equipment (LOLER)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-[13px] text-slate-900 outline-none transition focus:border-[#0284C7] focus:bg-white focus:ring-2 focus:ring-[#0284C7]/15"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[12px] font-semibold uppercase tracking-wider text-slate-700">
                Portal Link / Web URL *
              </label>
              <button
                type="button"
                onClick={() => handleValidateUrl()}
                disabled={validating || !portalUrl.trim()}
                className="text-[11.5px] font-semibold text-[#0284C7] hover:underline flex items-center gap-1 disabled:opacity-40"
              >
                {validating ? (
                  <>
                    <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                    </svg>
                    Testing link live…
                  </>
                ) : (
                  <>🔍 Validate URL live</>
                )}
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
              onBlur={() => {
                if (portalUrl.trim() && !validation) handleValidateUrl();
              }}
              placeholder="https://www.hse.gov.uk/work-equipment-machinery/loler.htm"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-[12.5px] font-mono text-slate-900 outline-none transition focus:border-[#0284C7] focus:bg-white focus:ring-2 focus:ring-[#0284C7]/15"
            />

            {/* Live URL Validation Feedback */}
            {validation && (
              <div
                className={`mt-2 rounded-xl p-2.5 text-[12px] flex items-center justify-between border ${
                  validation.reachable
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{validation.reachable ? "✓" : "⚠"}</span>
                  <span className="font-medium">{validation.message}</span>
                </div>
                {validation.durationMs > 0 && (
                  <span className="font-mono text-[11px] opacity-75">{validation.durationMs}ms</span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Target Sector *
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-900 outline-none transition focus:border-[#0284C7] focus:bg-white focus:ring-2 focus:ring-[#0284C7]/15"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-900 outline-none transition focus:border-[#0284C7] focus:bg-white focus:ring-2 focus:ring-[#0284C7]/15"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoCrawl}
              onChange={(e) => setAutoCrawl(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#0284C7] focus:ring-[#0284C7]/20"
            />
            <span className="text-[12.5px] text-slate-600">
              Fetch live web data immediately after saving to DB
            </span>
          </label>

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
              className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#0369A1] transition active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving to DB…" : "Save Source to Database"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Source Modal ────────────────────────────────────────────────────────

function EditSourceModal({
  isOpen,
  source,
  onClose,
  onUpdated,
}: {
  isOpen: boolean;
  source: OpsScraperSource | null;
  onClose: () => void;
  onUpdated: (updated: OpsScraperSource) => void;
}) {
  const [name, setName] = useState("");
  const [portalUrl, setPortalUrl] = useState("");
  const [sector, setSector] = useState("hospitality");
  const [frequency, setFrequency] = useState("daily");
  const [status, setStatus] = useState("active");

  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<UrlValidationResult | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (source) {
      setName(source.name);
      setPortalUrl(source.portalUrl);
      setSector(source.sector);
      setFrequency(source.frequency);
      setStatus(source.status);
      setValidation(null);
      setError(null);
    }
  }, [source]);

  if (!isOpen || !source) return null;

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
              Update portal link, metadata, or toggle active/inactive crawler status.
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-[13px] text-slate-900 outline-none transition focus:border-[#0284C7] focus:bg-white focus:ring-2 focus:ring-[#0284C7]/15"
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
                className="text-[11.5px] font-semibold text-[#0284C7] hover:underline flex items-center gap-1"
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-[12.5px] font-mono text-slate-900 outline-none transition focus:border-[#0284C7] focus:bg-white focus:ring-2 focus:ring-[#0284C7]/15"
            />
            {validation && (
              <div
                className={`mt-2 rounded-xl p-2.5 text-[12px] flex items-center justify-between border ${
                  validation.reachable
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-800 border-red-200"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-900 outline-none transition focus:border-[#0284C7] focus:bg-white focus:ring-2 focus:ring-[#0284C7]/15"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-900 outline-none transition focus:border-[#0284C7] focus:bg-white focus:ring-2 focus:ring-[#0284C7]/15"
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-900 outline-none transition focus:border-[#0284C7] focus:bg-white focus:ring-2 focus:ring-[#0284C7]/15"
            >
              <option value="active">Active (Included in bulk & scheduled crawls)</option>
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#0369A1] transition active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving Changes…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Source Table Row ─────────────────────────────────────────────────────────

function SourceRow({
  source,
  crawling,
  onCrawl,
  onEdit,
  onToggleStatus,
}: {
  source: OpsScraperSource;
  crawling: boolean;
  onCrawl: (code: string) => void;
  onEdit: (source: OpsScraperSource) => void;
  onToggleStatus: (source: OpsScraperSource) => void;
}) {
  const router = useRouter();
  const lastCrawl = source.crawls[0];
  const colorClass = SECTOR_COLORS[source.sector] ?? SECTOR_COLORS.all;
  const isInactive = source.status === "inactive";

  return (
    <tr
      onClick={() => router.push(`/ops/crawler/${source.id}`)}
      className={`cursor-pointer hover:bg-sky-50/30 transition group ${
        isInactive ? "opacity-60 bg-slate-50/40" : ""
      }`}
    >
      {/* Status + name */}
      <td className="py-3 pl-5 pr-3">
        <div className="flex items-center gap-2.5">
          <StatusDot status={source.status} />
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 text-[13.5px] leading-tight truncate max-w-[280px] group-hover:text-[#0284C7] transition">
              {source.name}
            </div>
            <span
              className="text-[11.5px] text-slate-400 font-mono truncate block max-w-[280px]"
              title={source.portalUrl}
            >
              {new URL(source.portalUrl).hostname}
            </span>
          </div>
        </div>
      </td>

      {/* Sector */}
      <td className="py-3 px-3 hidden md:table-cell">
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ${colorClass}`}>
          {sectorBadge(source.sector)}
        </span>
      </td>

      {/* Frequency */}
      <td className="py-3 px-3 hidden lg:table-cell">
        <span className="text-[12.5px] text-slate-600 capitalize">{source.frequency}</span>
      </td>

      {/* Last crawl */}
      <td className="py-3 px-3">
        <div className="text-[12.5px] text-slate-700 font-medium">{relativeTime(source.lastCrawlAt)}</div>
        {lastCrawl && (
          <div className="text-[11px] text-slate-400 font-mono">
            {lastCrawl.itemsFound} phrases · {lastCrawl.durationMs ? `${lastCrawl.durationMs}ms` : "—"}
          </div>
        )}
      </td>

      {/* Rules mapped */}
      <td className="py-3 px-3 hidden lg:table-cell text-right">
        <span className="text-[13px] font-mono font-semibold text-slate-800">{source.rulesCount}</span>
      </td>

      {/* Status Badge & Toggle */}
      <td className="py-3 px-3 hidden xl:table-cell" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onToggleStatus(source)}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-semibold transition ${
            source.status === "active"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              : source.status === "inactive"
                ? "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
          }`}
          title="Click to toggle Active / Inactive"
        >
          <span>{source.status === "active" ? "● Active" : source.status === "inactive" ? "⏸ Inactive" : "⚠ Error"}</span>
        </button>
      </td>

      {/* Action Buttons */}
      <td className="py-3 pl-3 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="inline-flex items-center gap-2">
          <Link
            href={`/ops/crawler/${source.id}`}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition"
            title="Open dedicated materials & history page"
          >
            View Materials ↗
          </Link>

          <button
            type="button"
            onClick={() => onEdit(source)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition"
            title="Edit source name, link, or cadence"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onCrawl(source.code)}
            disabled={crawling}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-semibold text-slate-700 shadow-sm hover:border-[#0284C7]/40 hover:text-[#0284C7] hover:bg-sky-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {crawling ? (
              <svg className="h-3 w-3 animate-spin text-[#0284C7]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
              </svg>
            ) : (
              <span>↻</span>
            )}
            Crawl
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Crawler Component ───────────────────────────────────────────────────

export function OpsCrawlerPage() {
  const [sources, setSources] = useState<OpsScraperSource[]>([]);
  const [totalRulesMapped, setTotalRulesMapped] = useState(0);
  const [totalCrawls, setTotalCrawls] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [crawlingAll, setCrawlingAll] = useState(false);
  const [crawlingCode, setCrawlingCode] = useState<string | null>(null);
  const [crawlResult, setCrawlResult] = useState<OpsCrawlResult | null>(null);

  const [filterSector, setFilterSector] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<OpsScraperSource | null>(null);

  const loadSources = useCallback(async () => {
    try {
      const data = await opsClient.scrapers();
      setSources(data.sources);
      setTotalRulesMapped(data.totalRulesMapped);
      setTotalCrawls(data.totalCrawls);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load sources");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  const handleCrawlAll = async () => {
    setCrawlingAll(true);
    setCrawlResult(null);
    try {
      const result = await opsClient.triggerCrawl("all");
      setCrawlResult(result);
      await loadSources();
    } catch (e: any) {
      setError(e?.message ?? "Crawl failed");
    } finally {
      setCrawlingAll(false);
    }
  };

  const handleCrawlOne = async (code: string) => {
    setCrawlingCode(code);
    setCrawlResult(null);
    try {
      const result = await opsClient.triggerCrawl(code);
      setCrawlResult(result);
      await loadSources();
    } catch (e: any) {
      setError(e?.message ?? "Crawl failed");
    } finally {
      setCrawlingCode(null);
    }
  };

  const handleToggleStatus = async (src: OpsScraperSource) => {
    const nextStatus = src.status === "active" ? "inactive" : "active";
    try {
      const updated = await opsClient.updateRegulatorySource(src.id, {
        status: nextStatus,
      });
      setSources((prev) =>
        prev.map((s) => (s.id === src.id ? { ...s, status: updated.status } : s)),
      );
    } catch (e: any) {
      setError(e?.message ?? "Failed to toggle status");
    }
  };

  const handleSourceCreated = async (newSource: OpsScraperSource, autoCrawl: boolean) => {
    await loadSources();
    if (autoCrawl) {
      handleCrawlOne(newSource.code);
    }
  };

  const handleSourceUpdated = (updated: OpsScraperSource) => {
    setSources((prev) =>
      prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
    );
  };

  const filtered = sources.filter((s) => {
    if (filterSector !== "all" && s.sector !== filterSector) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  const sectors = [
    "all",
    ...Array.from(new Set(sources.map((s) => s.sector)))
      .filter((s) => s !== "all")
      .sort(),
  ];

  return (
    <div className="space-y-6">
      <OpsPageHead
        title="Web Crawler"
        subtitle="Live regulatory source registry — crawl statutory UK government and sector portals"
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-800 shadow-sm hover:border-[#0284C7]/40 hover:text-[#0284C7] hover:bg-sky-50/50 transition active:scale-95"
            >
              <span className="text-[#0284C7] text-base leading-none font-bold">+</span>
              <span>Add Resource / Link</span>
            </button>
            <button
              type="button"
              onClick={handleCrawlAll}
              disabled={crawlingAll}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2 text-[13.5px] font-semibold text-white shadow-sm hover:bg-[#0369A1] transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {crawlingAll ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                  </svg>
                  Crawling active sources…
                </>
              ) : (
                <>🕷️ Crawl all active sources</>
              )}
            </button>
          </div>
        }
      />

      {/* Add Resource Banner / Quick CTA */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-bold text-slate-900">Custom Regulatory Feeds & Portal Links</h3>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Add any UK council, departmental, or sector-specific regulation URL with instant live URL validation. All sources are stored in the database.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-slate-800 transition active:scale-95 shrink-0"
        >
          <span>➕</span>
          <span>Add New Source Link</span>
        </button>
      </div>

      {/* Crawl result banner */}
      {crawlResult && (
        <CrawlResultBanner result={crawlResult} onClose={() => setCrawlResult(null)} />
      )}

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-[13px] text-red-700 flex items-center justify-between">
          <span>⚠ {error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-700 transition">
            ×
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <OpsStat label="Sources indexed" value={String(sources.length)} hint="Regulatory portals in DB" tone="admin" />
        <OpsStat
          label="Rules mapped"
          value={String(totalRulesMapped)}
          hint="Obligation hints"
          tone="brand"
        />
        <OpsStat
          label="Total crawls"
          value={String(totalCrawls)}
          hint="All time runs"
          tone="admin"
        />
        <OpsStat
          label="Active sources"
          value={String(sources.filter((s) => s.status === "active").length)}
          hint="Eligible for crawler"
          tone="ok"
        />
      </div>

      {/* Filters & Count */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
          Filter:
        </span>
        <select
          value={filterSector}
          onChange={(e) => setFilterSector(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] text-slate-700 shadow-sm focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20"
        >
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All sectors" : sectorBadge(s)}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] text-slate-700 shadow-sm focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20"
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
          <option value="error">Error only</option>
        </select>

        {(filterSector !== "all" || filterStatus !== "all") && (
          <button
            type="button"
            onClick={() => {
              setFilterSector("all");
              setFilterStatus("all");
            }}
            className="text-[12px] text-[#0284C7] hover:underline"
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto text-[12px] text-slate-400 font-mono">
          Showing {filtered.length} of {sources.length} sources (Click any row or 'View Materials' to open dedicated page)
        </span>
      </div>

      {/* Sources table */}
      <div className="overflow-hidden rounded-2xl border border-[#EAECEF] bg-white shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-[14px]">
            <div className="animate-pulse">Loading regulatory sources…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-[14px]">
            <div className="text-3xl mb-3">🕷️</div>
            No sources match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#EAECEF] bg-[#F8FAFC]">
                  <th className="py-2.5 pl-5 pr-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Source & URL
                  </th>
                  <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hidden md:table-cell">
                    Sector
                  </th>
                  <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hidden lg:table-cell">
                    Cadence
                  </th>
                  <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Last crawl
                  </th>
                  <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hidden lg:table-cell text-right">
                    Hints
                  </th>
                  <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hidden xl:table-cell">
                    Crawler Status
                  </th>
                  <th className="py-2.5 pl-3 pr-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECEF]">
                {filtered.map((source) => (
                  <SourceRow
                    key={source.id}
                    source={source}
                    crawling={crawlingAll || crawlingCode === source.code}
                    onCrawl={handleCrawlOne}
                    onEdit={(src) => setEditingSource(src)}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Crawl Result Log (if recently executed) */}
      {crawlResult && (
        <div className="rounded-2xl border border-[#EAECEF] bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-[#EAECEF] bg-[#F8FAFC] flex items-center gap-2">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">
              Recent Crawl Execution Log
            </span>
            <span className="ml-auto text-[11px] font-mono text-slate-400">
              {new Date().toLocaleTimeString("en-GB")}
            </span>
          </div>
          <div className="divide-y divide-[#EAECEF] max-h-[300px] overflow-y-auto">
            {crawlResult.results.map((r) => (
              <div key={r.source.code} className="px-5 py-2.5 flex items-center gap-3">
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    r.status === "success" ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[13px] font-semibold text-slate-800 truncate">
                    {r.source.name}
                  </span>
                  {r.error && (
                    <span className="text-[11.5px] text-red-600 ml-2">{r.error}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11.5px] font-mono text-slate-500 shrink-0">
                  <span>{r.itemsFound} phrases</span>
                  <span className={`${r.itemsNew > 0 ? "text-emerald-600 font-semibold" : ""}`}>
                    +{r.itemsNew} new
                  </span>
                  <span>{r.durationMs}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Source Modal */}
      <AddSourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleSourceCreated}
      />

      {/* Edit Source Modal */}
      <EditSourceModal
        isOpen={Boolean(editingSource)}
        source={editingSource}
        onClose={() => setEditingSource(null)}
        onUpdated={handleSourceUpdated}
      />
    </div>
  );
}
