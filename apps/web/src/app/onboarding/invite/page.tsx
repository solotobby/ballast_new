import type { Metadata } from "next";
import { OnboardingShell } from "@/components/onboarding/shell";
import { InviteForm } from "@/components/onboarding/invite-form";

export const metadata: Metadata = {
  title: "Invite your team",
};

export default function InvitePage() {
  return (
    <OnboardingShell
      step={4}
      pill="Invite your team"
      pillIcon="user"
      title="Who logs the day-to-day?"
      lead="Give site managers and staff scoped access. They get a guided walkthrough — no account setup, just their first real task."
    >
      <InviteForm />
    </OnboardingShell>
  );
}
