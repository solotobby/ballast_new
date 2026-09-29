"use client";

import { useParams } from "next/navigation";
import { ObligationQuestionnaire } from "@/components/forms/obligation-questionnaire";

export default function ObligationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-400">Requirements questionnaire</p>
      <h1 className="mb-6 text-[26px] font-extrabold tracking-[-0.02em] text-navy-800">Duty evidence pack</h1>
      <ObligationQuestionnaire obligationId={id} backHref="/app/obligations" />
    </div>
  );
}
