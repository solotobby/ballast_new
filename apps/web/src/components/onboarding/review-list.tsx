"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconFlag } from "@/components/onboarding/icons";
import Link from "next/link";
import { Badge, FormError, OnboardingActions, PrimaryButton } from "@/components/onboarding/ui";
import { client, type Obligation } from "@/lib/api";
import { categoryMeta } from "@/lib/compliance";

export function ReviewList() {
  const router = useRouter();
  const [items, setItems] = useState<Obligation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    client
      .listObligations()
      .then(setItems)
      .catch(() => setError("Sign in again to review your obligations."))
      .finally(() => setLoading(false));
  }, []);

  async function confirm(id: string) {
    const updated = await client.confirmObligation(id);
    setItems((rows) => rows.map((row) => (row.id === id ? updated : row)));
  }

  async function flag(id: string) {
    const updated = await client.flagObligation(id, "Looks wrong for this business");
    setItems((rows) => rows.map((row) => (row.id === id ? updated : row)));
  }

  async function confirmAll() {
    setPending(true);
    setError(null);
    try {
      const updated = await client.confirmAllObligations();
      setItems(updated);
      const org = await client.organisation();
      if (org.onboardingStep === "done") {
        router.push("/app");
        return;
      }
      await client.setOnboardingStep("invite");
      router.push("/onboarding/invite");
    } catch {
      setError("Could not confirm your obligation set.");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-2.5">
        <div className="h-[72px] animate-pulse rounded-xl bg-gradient-to-r from-teal-050 to-brand-050" />
        {["a", "b", "c", "d"].map((key) => (
          <div key={key} className="h-[88px] animate-pulse rounded-xl border border-line bg-white" />
        ))}
      </div>
    );
  }

  if (error && items.length === 0) return <FormError>{error}</FormError>;
  if (items.length === 0) {
    return (
      <p className="text-sm text-ink-500">
        No obligations generated yet. Complete{" "}
        <button
          type="button"
          className="font-semibold text-[#0284C7] hover:underline"
          onClick={() => router.push("/onboarding/activities")}
        >
          which of these apply
        </button>
        .
      </p>
    );
  }

  const categories = new Set(items.map((item) => item.category)).size;
  const aiReview = items.filter((item) => item.source === "ai" && item.reviewState !== "confirmed").length;

  return (
    <div>
      <div className="mb-[18px] flex items-center justify-between gap-4 rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50/60 via-white to-amber-50/40 p-4 shadow-sm">
        <div>
          <div className="text-[32px] font-extrabold leading-none tracking-tight text-slate-900">{items.length}</div>
          <div className="mt-1 text-[12px] font-medium text-slate-500">
            obligations identified across {categories} {categories === 1 ? "category" : "categories"}
          </div>
        </div>
        {aiReview > 0 ? <Badge>{aiReview} need AI review</Badge> : null}
      </div>

      <div className="flex flex-col gap-2.5">
        {items.map((item) => {
          const cat = categoryMeta(item.category);
          return (
            <article key={item.id} className="flex items-start gap-[13px] rounded-xl border border-line bg-white px-[15px] py-3.5">
              <div className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] text-[19px] ${cat.bg}`}>
                {cat.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[14px] font-semibold leading-snug">{item.title}</h3>
                <p className="mt-[3px] text-[12.5px] leading-[1.45] text-ink-500">{item.basis}</p>
                {item.aiWhy ? <p className="mt-1 text-[12.5px] leading-snug text-ink-400">{item.aiWhy}</p> : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="neutral">{item.cadence}</Badge>
                  {item.source === "ai" ? (
                    <Badge>AI-inferred{item.aiConfidence ? ` · ${item.aiConfidence}` : ""} · review</Badge>
                  ) : null}
                  {item.reviewState === "confirmed" ? <Badge tone="ok">Confirmed</Badge> : null}
                  {item.reviewState === "flagged" ? <Badge tone="due">Flagged for review</Badge> : null}
                </div>
                {item.reviewState === "confirmed" ? (
                  <div className="mt-2.5">
                    <Link
                      href={`/onboarding/requirements/${item.id}`}
                      className="inline-flex items-center rounded-lg border border-[#0284C7]/30 bg-sky-50 px-3 py-1.5 text-[12.5px] font-semibold text-[#0284C7] hover:bg-sky-100 transition"
                    >
                      Complete requirements questionnaire
                    </Link>
                  </div>
                ) : (
                  <p className="mt-2 text-[12px] text-ink-400">Confirm this duty applies, then complete its questionnaire.</p>
                )}
              </div>
              <div className="ml-auto flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => confirm(item.id)}
                  title="Confirm"
                  className={`grid h-8 w-8 place-items-center rounded-lg border transition duration-150 ${
                    item.reviewState === "confirmed"
                      ? "border-[#bfe6cd] bg-ok-050 text-[#0f6b3a]"
                      : "border-line bg-white text-ink-500 hover:bg-canvas hover:text-ink-700"
                  }`}
                >
                  <IconCheck size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => flag(item.id)}
                  title="Flag for review"
                  className={`grid h-8 w-8 place-items-center rounded-lg border transition duration-150 ${
                    item.reviewState === "flagged"
                      ? "border-[#f0dcb0] bg-due-050 text-[#8a5a06]"
                      : "border-line bg-white text-ink-500 hover:bg-canvas hover:text-ink-700"
                  }`}
                >
                  <IconFlag size={16} />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <FormError>{error}</FormError>

      <div className="sticky bottom-0 -mx-1 mt-6 bg-gradient-to-t from-canvas via-canvas to-transparent pt-4 pb-1">
        <OnboardingActions backHref="/onboarding/activities" className="mt-0">
          <PrimaryButton type="button" onClick={confirmAll} disabled={pending}>
            {pending ? "Saving your duty set…" : "Confirm all & continue"}
          </PrimaryButton>
        </OnboardingActions>
      </div>
    </div>
  );
}
