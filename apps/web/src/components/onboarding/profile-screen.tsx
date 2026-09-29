"use client";

import { useEffect, useState } from "react";
import { OnboardingShell } from "@/components/onboarding/shell";
import { ProfileForm } from "@/components/onboarding/profile-form";
import { client } from "@/lib/api";

export function ProfileScreen() {
  const [mode, setMode] = useState<"loading" | "wizard" | "edit">("loading");

  useEffect(() => {
    client
      .organisation()
      .then((org) => setMode(org.onboardingStep === "done" ? "edit" : "wizard"))
      .catch(() => setMode("wizard"));
  }, []);

  if (mode === "loading") {
    return (
      <OnboardingShell
        step={1}
        requireAuth={false}
        pill="Business profile"
        pillIcon="loc"
        title="What does your business do?"
        lead="This is the single input to your obligation engine — the more accurate, the sharper your list."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {["w-36", "w-40", "w-28", "w-32"].map((width) => (
              <span key={width} className={`h-9 animate-pulse rounded-full bg-canvas-2 ${width}`} />
            ))}
          </div>
          <div className="h-[42px] animate-pulse rounded-lg bg-canvas-2" />
        </div>
      </OnboardingShell>
    );
  }

  if (mode === "edit") {
    return (
      <OnboardingShell
        step={1}
        showProgress={false}
        requireAuth={false}
        pill="Business profile"
        pillIcon="loc"
        title="Edit what your business does"
        lead="Sector and size stay the single input to your obligation engine. Saving here returns you to the dashboard."
      >
        <ProfileForm mode="edit" />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      step={1}
      pill="Business profile"
      pillIcon="loc"
      title="What does your business do?"
      lead="This is the single input to your obligation engine — the more accurate, the sharper your list."
    >
      <ProfileForm mode="wizard" />
    </OnboardingShell>
  );
}
