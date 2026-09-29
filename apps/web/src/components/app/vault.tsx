"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PageHead, StatTile } from "@/components/app/app-ui";
import { ApiError, client, type EvidenceRecord, type Obligation, type Organisation } from "@/lib/api";
import { filterByQuery } from "@/lib/search";

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function Vault() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [org, setOrg] = useState<Organisation | null>(null);
  const [items, setItems] = useState<EvidenceRecord[]>([]);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [obligationId, setObligationId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function reload() {
    const [organisation, evidence, register] = await Promise.all([
      client.organisation(),
      client.listEvidence(),
      client.listObligations(),
    ]);
    setOrg(organisation);
    setItems(evidence);
    setObligations(register);
    if (!obligationId && register[0]) setObligationId(register[0].id);
    if (!siteId && organisation.sites[0]) setSiteId(organisation.sites[0].id);
  }

  useEffect(() => {
    reload().catch(() => setError("Could not load the vault."));
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file || !obligationId) {
      setError("Choose a duty and attach a file.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("obligationId", obligationId);
      if (siteId) form.set("siteId", siteId);
      if (expiresAt) form.set("expiresAt", expiresAt);
      await client.uploadEvidence(form);
      setFile(null);
      setExpiresAt("");
      setOpen(false);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload evidence");
    } finally {
      setPending(false);
    }
  }

  const visibleItems = useMemo(
    () =>
      filterByQuery(items, searchQuery, (item) => [
        item.name,
        item.obligation?.title ?? "",
        item.createdByName,
        item.site?.name ?? "",
      ]),
    [items, searchQuery],
  );

  const expiring = visibleItems.filter((item) => {
    if (!item.expiresAt) return false;
    const days = (new Date(item.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    return days < 45;
  }).length;

  const linkedCount = visibleItems.filter((item) => item.obligation).length;

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <PageHead
        breadcrumbs={[
          { label: org?.name ?? "The Copper Kettle Ltd" },
          { label: "Compliance" },
          { label: "Evidence Vault" },
        ]}
        title="Statutory Evidence Vault"
        subtitle="Every file is cryptographically linked to the statutory obligation it satisfies. Upload certificates, CP12 gas records, and inspection photos to maintain verified status."
        actions={
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{open ? "Close Upload Form" : "Upload Evidence"}</span>
          </button>
        }
      />

      {/* 4-Column Executive Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Vault Records"
          value={visibleItems.length}
          tone="brand"
          hint="Certificates & audit proofs"
        />
        <StatTile
          label="Linked to Duties"
          value={`${linkedCount}/${visibleItems.length || 0}`}
          tone="ok"
          hint={`${visibleItems.length ? Math.round((linkedCount / visibleItems.length) * 100) : 0}% attached to statutory duties`}
          hintTone="up"
        />
        <StatTile
          label="Expiring Soon"
          value={expiring}
          tone={expiring > 0 ? "due" : "ok"}
          hint={expiring > 0 ? "Renew within 45 days" : "Zero upcoming expirations"}
          hintTone={expiring > 0 ? "down" : "up"}
        />
        <StatTile
          label="Operating Sites"
          value={org?.siteCount ?? 0}
          tone="teal"
          hint="Covered locations"
        />
      </div>

      {/* Upload Form Modal/Section */}
      {open ? (
        <form className="card p-5 space-y-4 animate-in fade-in" onSubmit={onSubmit}>
          <div className="border-b hairline pb-3">
            <h3 className="text-sm font-bold text-slate-900">Upload &amp; Link Statutory Evidence</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the obligation this file satisfies so the compliance engine automatically updates its status.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Duty this proves</span>
              <select
                className="field text-xs"
                value={obligationId}
                onChange={(e) => setObligationId(e.target.value)}
                required
              >
                {obligations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Operating Site</span>
              <select className="field text-xs" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                {org?.sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">
                Certificate Expiry Date <span className="font-normal text-slate-400">(optional)</span>
              </span>
              <input
                type="date"
                className="field text-xs"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Select file (PDF or Image)</span>
              <input
                type="file"
                accept="image/*,.pdf"
                required
                className="field !py-1 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-300"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t hairline">
            <button
              type="submit"
              disabled={pending}
              className="btn btn-primary btn-sm flex items-center gap-1.5"
            >
              <span>{pending ? "Uploading…" : "Upload and Link to Duty"}</span>
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

      {/* Filter / Search Bar */}
      <div className="card p-3 flex items-center gap-3">
        <div className="relative flex-1">
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
            placeholder="Search vault documents by file name, linked duty, or uploader..."
          />
        </div>
        <span className="text-xs font-mono text-slate-400 pr-2">
          {visibleItems.length} file{visibleItems.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Document Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.length === 0 ? (
          <div className="col-span-full card p-10 text-center text-xs text-slate-500">
            {searchQuery
              ? `No vault files match “${searchQuery}”.`
              : "Nothing in the vault yet. Upload a certificate or inspection photo to satisfy obligations."}
          </div>
        ) : (
          visibleItems.map((item) => {
            const isPdf = item.name.toLowerCase().endsWith(".pdf");
            return (
              <a
                key={item.id}
                href={`/api/evidence/${item.id}/file`}
                target="_blank"
                rel="noreferrer"
                className="card p-4 block transition hover:border-slate-300 hover:shadow-xs group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-700 font-mono text-[10px] font-bold">
                      {isPdf ? "PDF" : "IMG"}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 text-xs truncate group-hover:text-sky-600 transition">
                        {item.name}
                      </div>
                      <div className="mt-0.5 text-[11.5px] font-medium text-sky-700 truncate">
                        {item.obligation?.title ?? "Unlinked Document"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t hairline flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{formatBytes(item.sizeBytes)}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString("en-GB")}</span>
                </div>

                {item.expiresAt ? (
                  <div className="mt-2 text-[10.5px] font-mono text-amber-700 bg-amber-50 rounded px-2 py-0.5">
                    Expires: {new Date(item.expiresAt).toLocaleDateString("en-GB")}
                  </div>
                ) : null}
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}
