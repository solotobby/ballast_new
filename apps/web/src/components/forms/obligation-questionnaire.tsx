"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { measureFormCompletion, type FormAnswers } from "@ballast/domain";
import { OBLIGATION_STATUSES } from "@ballast/domain";
import { SchemaForm } from "@/components/forms/schema-form";
import {
  Badge,
  FormError,
  PrimaryButton,
  SubtleButton,
} from "@/components/onboarding/ui";
import { ApiError, client, type ObligationFormBundle } from "@/lib/api";

export function ObligationQuestionnaire({
  obligationId,
  backHref,
}: {
  obligationId: string;
  backHref: string;
}) {
  const [bundle, setBundle] = useState<ObligationFormBundle | null>(null);
  const [answers, setAnswers] = useState<FormAnswers>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regen, setRegen] = useState(false);
  const [saveHint, setSaveHint] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    setLoading(true);
    client
      .getObligationForm(obligationId)
      .then((data) => {
        setBundle(data);
        setAnswers(data.submission?.answers ?? {});
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not load questionnaire");
      })
      .finally(() => setLoading(false));
  }, [obligationId]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const locked = bundle?.submission?.status === "submitted" || bundle?.submission?.status === "approved";

  const liveProgress = useMemo(() => {
    if (!bundle) return null;
    return measureFormCompletion(bundle.template.schema, answers);
  }, [bundle, answers]);

  const statusLabel =
    OBLIGATION_STATUSES.find((item) => item.id === bundle?.obligation.status)?.label ??
    bundle?.obligation.status ??
    "—";

  function queueAutosave(nextAnswers: FormAnswers) {
    if (locked) return;
    setAnswers(nextAnswers);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistDraft(nextAnswers, true);
    }, 700);
  }

  async function persistDraft(nextAnswers: FormAnswers = answersRef.current, silent = false) {
    if (locked) return;
    setSaving(true);
    if (!silent) setError(null);
    try {
      const data = await client.saveObligationFormAnswers(obligationId, nextAnswers);
      setBundle(data);
      setAnswers(data.submission?.answers ?? nextAnswers);
      setSaveHint(`Saved · status updated to ${statusLabelFor(data.obligation.status)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save draft");
    } finally {
      setSaving(false);
    }
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const data = await client.submitObligationForm(obligationId, answersRef.current);
      setBundle(data);
      setAnswers(data.submission?.answers ?? answersRef.current);
      setSaveHint(`Submitted · status ${statusLabelFor(data.obligation.status)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit questionnaire");
    } finally {
      setSaving(false);
    }
  }

  async function regenerate() {
    setRegen(true);
    setError(null);
    try {
      const data = await client.generateObligationForm(obligationId, true);
      setBundle(data);
      setAnswers(data.submission?.answers ?? {});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not regenerate form");
    } finally {
      setRegen(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-xl bg-gradient-to-r from-teal-050 to-brand-050" />
        <div className="h-40 animate-pulse rounded-xl border border-line bg-white" />
      </div>
    );
  }

  if (!bundle || !liveProgress) {
    return (
      <div>
        <FormError>{error ?? "Questionnaire unavailable"}</FormError>
        <Link href={backHref} className="mt-4 inline-block text-sm font-semibold text-brand-600">
          Back
        </Link>
      </div>
    );
  }

  const status = bundle.submission?.status ?? "draft";

  return (
    <div>
      <div className="mb-5 rounded-xl border border-line bg-white px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-400">
              {bundle.obligation.definitionId} · {bundle.obligation.category}
            </p>
            <h2 className="mt-1 text-[18px] font-bold text-navy-800">{bundle.template.title}</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">{bundle.template.purpose}</p>
            {bundle.template.aiWhy ? (
              <p className="mt-2 text-[12.5px] text-ink-400">{bundle.template.aiWhy}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={statusTone(bundle.obligation.status)}>{statusLabel}</Badge>
            <Badge tone={status === "approved" ? "ok" : status === "submitted" ? "brand" : "neutral"}>
              Form · {status.replace("_", " ")}
            </Badge>
            <Badge tone="neutral">
              {bundle.template.source === "ai" ? "AI form" : "Curated form"} · v{bundle.template.version}
            </Badge>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
            <span className="font-semibold text-ink-700">
              Requirements filled · {liveProgress.requiredFilled}/{liveProgress.requiredTotal}
            </span>
            <span className="font-semibold text-brand-600">{liveProgress.percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-canvas-2">
            <div
              className="h-full rounded-full bg-brand-500 transition-[width] duration-300"
              style={{ width: `${liveProgress.percent}%` }}
            />
          </div>
          <p className="mt-2 text-[12px] text-ink-400">
            Duty status updates as you fill this questionnaire
            {saving ? " · saving…" : saveHint ? ` · ${saveHint}` : ""}.
          </p>
        </div>

        <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-[12.5px] leading-snug text-ink-500">
          Legal basis: {bundle.obligation.basis}
        </p>
      </div>

      <div className="rounded-xl border border-line bg-white px-4 py-4">
        <SchemaForm
          schema={bundle.template.schema}
          answers={answers}
          onChange={queueAutosave}
          disabled={locked}
        />
        <FormError>{error}</FormError>
        {bundle.submission?.reviewNote ? (
          <p className="mt-3 rounded-lg bg-due-050 px-3 py-2 text-[13px] text-[#8a5a06]">
            Ballast note: {bundle.submission.reviewNote}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          {!locked ? (
            <>
              <SubtleButton type="button" disabled={saving} onClick={() => persistDraft()}>
                {saving ? "Saving…" : "Save draft"}
              </SubtleButton>
              <PrimaryButton
                type="button"
                className="w-auto px-5"
                disabled={saving || !liveProgress.complete}
                onClick={submit}
              >
                {saving ? "Submitting…" : "Submit for Ballast review"}
              </PrimaryButton>
            </>
          ) : (
            <p className="text-[13px] font-medium text-[#0f6b3a]">
              Submitted — Ballast will confirm this duty from your answers.
            </p>
          )}
          {!locked ? (
            <SubtleButton type="button" disabled={regen} onClick={regenerate}>
              {regen ? "Regenerating…" : "Regenerate with AI"}
            </SubtleButton>
          ) : null}
          <Link href={backHref} className="inline-flex items-center px-3 text-[13px] font-semibold text-ink-500">
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}

function statusLabelFor(status: string) {
  return OBLIGATION_STATUSES.find((item) => item.id === status)?.label ?? status;
}

function statusTone(status: string): "brand" | "ok" | "due" | "over" | "neutral" {
  if (status === "on_track") return "ok";
  if (status === "due_soon") return "due";
  if (status === "overdue") return "over";
  if (status === "evidence_gap") return "neutral";
  return "brand";
}
