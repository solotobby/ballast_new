import type { Metadata } from "next";
import { Suspense } from "react";
import { OnboardingShell } from "@/components/onboarding/shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Set new password",
};

export default function ResetPasswordPage() {
  return (
    <OnboardingShell
      step={0}
      requireAuth={false}
      showProgress={false}
      pill="Credentials update"
      pillIcon="shield"
      title="Set a new password"
      lead="Protecting your compliance records and statutory logs."
    >
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-canvas-2" />}>
        <ResetPasswordForm />
      </Suspense>
    </OnboardingShell>
  );
}
