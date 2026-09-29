"use client";

import { LOG_TYPES } from "@ballast/domain";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiError, client, type Obligation, type Organisation } from "@/lib/api";
import { suggestedObligations } from "@/lib/logbook";
import { IconPlus } from "./nav-icons";

export function QuickLogModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [org, setOrg] = useState<Organisation | null>(null);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [typeId, setTypeId] = useState(LOG_TYPES[0]?.id ?? "fridge_check");
  const [siteId, setSiteId] = useState("");
  const [obligationId, setObligationId] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = LOG_TYPES.find((t) => t.id === typeId) ?? LOG_TYPES[0];
  const suggested = useMemo(
    () => (selectedType ? suggestedObligations(obligations, selectedType.category) : obligations),
    [obligations, selectedType],
  );

  useEffect(() => {
    if (!open) return;
    setError(null);
    Promise.all([client.organisation(), client.listObligations()])
      .then(([organisation, register]) => {
        setOrg(organisation);
        setObligations(register);
        if (organisation.sites[0]) setSiteId(organisation.sites[0].id);
      })
      .catch(() => setError("Could not load form"));
  }, [open]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedType || !siteId) return;
    setPending(true);
    setError(null);
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
      setObligationId("");
      setFile(null);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save entry");
    } finally {
      setPending(false);
    }
  }

  if (!open) return null;

  const noSites = (org?.sites.length ?? 0) === 0;

  return (
    <>
      <button type="button" className="fixed inset-0 z-[60] bg-[rgba(16,24,40,.5)] backdrop-blur-[3px]" onClick={onClose} aria-label="Close" />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-6">
        <form
          onSubmit={submit}
          className="max-h-[90vh] w-full max-w-[520px] overflow-auto rounded-[20px] bg-white shadow-[var(--sh-3)]"
        >
          <div className="flex items-center gap-3 border-b border-line-2 px-5 py-4">
            <h3 className="flex-1 text-[17px] font-semibold">New logbook entry</h3>
            <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-ink-400 hover:bg-canvas">
              ×
            </button>
          </div>
          <div className="space-y-4 px-5 py-4">
            {error ? <p className="text-[13px] text-over-500">{error}</p> : null}
            {noSites ? (
              <div className="rounded-xl bg-canvas px-4 py-3 text-[13px] text-ink-600">
                Add a site in your{" "}
                <Link href="/onboarding/profile" className="font-semibold text-brand-600">
                  business profile
                </Link>{" "}
                before logging entries.
              </div>
            ) : null}
            <label className="block">
              <span className="mb-1.5 block text-[13.5px] font-semibold text-ink-700">Entry type</span>
              <select
                className="w-full rounded-[14px] border border-line px-[15px] py-3.5 text-[16px]"
                value={typeId}
                onChange={(e) => {
                  setTypeId(e.target.value);
                  setObligationId("");
                }}
                disabled={noSites}
              >
                {LOG_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13.5px] font-semibold text-ink-700">Site</span>
              <select
                className="w-full rounded-[14px] border border-line px-[15px] py-3.5 text-[16px]"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                disabled={noSites}
                required
              >
                {org?.sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13.5px] font-semibold text-ink-700">What happened?</span>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Guided prompt: describe the check, reading, or event…"
                className="w-full rounded-[14px] border border-line px-[15px] py-3.5 text-[16px]"
                disabled={noSites}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13.5px] font-semibold text-ink-700">
                Link to obligation <span className="font-normal text-ink-400">— suggested</span>
              </span>
              <select
                className="w-full rounded-[14px] border border-line px-[15px] py-3.5 text-[16px]"
                value={obligationId}
                onChange={(e) => setObligationId(e.target.value)}
                disabled={noSites}
              >
                <option value="">Optional — link to close an evidence gap</option>
                {suggested.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </select>
              {obligations.length === 0 ? (
                <p className="mt-1.5 text-[12.5px] text-ink-400">
                  No obligations on your register yet.{" "}
                  <Link href="/onboarding/review" className="font-semibold text-brand-600">
                    Generate your duty set
                  </Link>
                </p>
              ) : null}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13.5px] font-semibold text-ink-700">
                Photo <span className="font-normal text-ink-400">optional</span>
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="w-full text-[14px]"
                disabled={noSites}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <div className="flex gap-2.5 border-t border-line-2 px-5 py-4">
            <button type="button" onClick={onClose} className="flex-1 rounded-[14px] border border-line px-4 py-3 text-[15px] font-semibold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || noSites}
              className="flex-[2] rounded-[14px] bg-brand-500 px-4 py-3 text-[15px] font-semibold text-white shadow-[0_6px_16px_rgba(31,111,235,.28)] disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save entry"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export function QuickLogButton({ onClick, compact }: { onClick: () => void; compact?: boolean }) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-brand-500 text-white shadow-[0_6px_16px_rgba(31,111,235,.28)] sm:hidden"
        aria-label="Quick log"
      >
        <IconPlus className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden items-center gap-2 rounded-[14px] bg-brand-500 px-4 py-2 text-[14px] font-semibold text-white shadow-[0_6px_16px_rgba(31,111,235,.28)] sm:inline-flex"
    >
      <IconPlus /> Quick log
    </button>
  );
}
