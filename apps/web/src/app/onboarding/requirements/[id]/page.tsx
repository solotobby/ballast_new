"use client";

import { useParams } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/shell";
import { ObligationQuestionnaire } from "@/components/forms/obligation-questionnaire";

export default function OnboardingRequirementPage() {
  const params = useParams<{ id: string }>();

  return (
    <OnboardingShell
      step={3}
      pill="Requirements"
      pillIcon="check"
      title="What Ballast needs from you"
      lead="Complete this questionnaire so we can approve and confirm the duty for your business."
      wide
    >
      <ObligationQuestionnaire obligationId={params.id} backHref="/onboarding/review" />
    </OnboardingShell>
  );
}
