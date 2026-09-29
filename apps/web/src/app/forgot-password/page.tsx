import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OnboardingShell } from "@/components/onboarding/shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <OnboardingShell
      step={0}
      requireAuth={false}
      showProgress={false}
      pill="Account recovery"
      pillIcon="shield"
      title="Forgot your password?"
      lead="Enter your registered work email and we will issue a secure reset link."
      footer={
        <p className="mt-5 text-sm text-ink-500">
          Need urgent help?{" "}
          <Link href="/signin" className="font-semibold text-[#E52E2E] hover:text-[#DC2626]">
            Contact Ballast Support
          </Link>
        </p>
      }
    >
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-canvas-2" />}>
        <ForgotPasswordForm />
      </Suspense>
    </OnboardingShell>
  );
}
