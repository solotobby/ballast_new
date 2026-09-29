import type { OnboardingStep } from "@/lib/api";

export function onboardingPath(step: OnboardingStep | string | null | undefined): string {
  switch (step) {
    case "activities":
      return "/onboarding/activities";
    case "review":
      return "/onboarding/review";
    case "invite":
      return "/onboarding/invite";
    case "done":
      return "/app";
    default:
      return "/onboarding";
  }
}
