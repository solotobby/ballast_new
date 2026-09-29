"use client";

import { SECTORS, SIZE_BANDS, type Sector, type SizeBand } from "@ballast/domain";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Chip, ChipRow, Field, FormError, OnboardingActions, PrimaryButton, SelectControl } from "@/components/onboarding/ui";
import { ApiError, client } from "@/lib/api";

export function ProfileForm({ mode }: { mode: "wizard" | "edit" }) {
  const router = useRouter();
  const [sector, setSector] = useState<Sector | null>(null);
  const [sizeBand, setSizeBand] = useState<SizeBand>("2_10");
  const [siteCount, setSiteCount] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    client
      .organisation()
      .then((org) => {
        if (cancelled) return;
        if (org.sector && SECTORS.some((item) => item.id === org.sector)) {
          setSector(org.sector as Sector);
        }
        if (org.sizeBand && SIZE_BANDS.some((item) => item.id === org.sizeBand)) {
          setSizeBand(org.sizeBand as SizeBand);
        }
        if (org.siteCount) setSiteCount(org.siteCount);
      })
      .catch(() => {
        /* first-time profile */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!sector) {
      setError("Pick a sector to continue");
      return;
    }
    setPending(true);
    try {
      await client.updateProfile({
        sector,
        sizeBand,
        siteCount,
        ...(mode === "wizard" ? { onboardingStep: "activities" } : {}),
      });
      router.push(mode === "wizard" ? "/onboarding/activities" : "/app");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your business profile");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Field label="Sector">
        <ChipRow>
          {SECTORS.map((item) => (
            <Chip key={item.id} active={sector === item.id} onClick={() => setSector(item.id)}>
              <span className="text-[15px] leading-none">{item.emoji}</span>
              {item.label}
            </Chip>
          ))}
        </ChipRow>
      </Field>

      <Field label="Team size">
        <ChipRow>
          {SIZE_BANDS.map((item) => (
            <Chip key={item.id} active={sizeBand === item.id} onClick={() => setSizeBand(item.id)}>
              {item.label}
            </Chip>
          ))}
        </ChipRow>
      </Field>

      <Field label="Number of sites" hint="— you can add addresses later">
        <SelectControl value={siteCount} onChange={(e) => setSiteCount(Number(e.target.value))}>
          <option value={1}>1 site</option>
          <option value={2}>2 sites</option>
          <option value={3}>3 sites</option>
          <option value={4}>4+ sites</option>
        </SelectControl>
      </Field>

      <FormError>{error}</FormError>

      <OnboardingActions backHref={mode === "edit" ? "/app" : undefined}>
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Saving…" : mode === "wizard" ? "Continue" : "Save & return to dashboard"}
        </PrimaryButton>
      </OnboardingActions>
    </form>
  );
}
