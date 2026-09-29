import type { OnboardingStep, SessionUser } from "@/lib/api";
import { onboardingPath } from "@/lib/onboarding";

export function isFieldRole(role: string | undefined) {
  return role === "staff" || role === "site_manager";
}

export function postAuthPath(
  user: SessionUser,
  org: { profileComplete: boolean; onboardingStep: OnboardingStep },
) {
  if (user.role === "owner") {
    if (org.onboardingStep !== "done") return onboardingPath(org.onboardingStep);
    if (!org.profileComplete) return "/onboarding/profile";
    return "/app";
  }
  if (isFieldRole(user.role)) return "/staff";
  return "/app";
}
