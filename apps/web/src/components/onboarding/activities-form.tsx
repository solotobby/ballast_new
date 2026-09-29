"use client";

import { SECTORS, type Sector } from "@ballast/domain";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconPlus, IconSpark } from "@/components/onboarding/icons";
import {
  Chip,
  ChipRow,
  Control,
  Field,
  FormError,
  OnboardingActions,
  PrimaryButton,
  SubtleButton,
  TextAreaControl,
} from "@/components/onboarding/ui";
import { ApiError, client } from "@/lib/api";

export function ActivitiesForm() {
  const router = useRouter();
  const [sector, setSector] = useState<Sector | null>(null);
  const [sizeBand, setSizeBand] = useState<string | null>(null);
  const [siteCount, setSiteCount] = useState(1);
  const [options, setOptions] = useState<string[]>([]);
  const [optionSource, setOptionSource] = useState<"ai" | "fallback" | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [activities, setActivities] = useState<string[]>([]);
  const [customActivity, setCustomActivity] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    client
      .organisation()
      .then((org) => {
        if (cancelled) return;
        if (!org.sector || !org.sizeBand) {
          router.replace("/onboarding/profile");
          return;
        }
        setSector(org.sector as Sector);
        setSizeBand(org.sizeBand);
        setSiteCount(org.siteCount);
        if (org.activities.length) setActivities(org.activities);
        if (org.extraNotes) setExtraNotes(org.extraNotes);
        setReady(true);
      })
      .catch(() => router.replace("/signin"));
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!ready || !sector) return;
    let cancelled = false;
    setLoadingOptions(true);
    setError(null);
    client
      .activitiesForSector(sector)
      .then((result) => {
        if (cancelled) return;
        setOptionSource(result.source);
        setActivities((current) => {
          const next =
            current.length > 0 ? current : result.activities.filter((item) => /employ/i.test(item)).slice(0, 1);
          const extras = next.filter((item) => !result.activities.includes(item));
          setOptions([...result.activities, ...extras]);
          return next;
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setOptions([]);
        setOptionSource(null);
        setError(err instanceof ApiError ? err.message : "Could not load what applies for this sector");
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sector, ready]);

  function toggleActivity(activity: string) {
    setActivities((current) =>
      current.includes(activity) ? current.filter((item) => item !== activity) : [...current, activity],
    );
  }

  function addCustomActivity() {
    const label = customActivity.trim().replace(/\s+/g, " ").slice(0, 80);
    if (label.length < 2) return;
    setOptions((current) => (current.includes(label) ? current : [...current, label]));
    setActivities((current) => (current.includes(label) ? current : [...current, label]));
    setCustomActivity("");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!sector || !sizeBand) {
      router.replace("/onboarding/profile");
      return;
    }
    setError(null);
    if (activities.length === 0) {
      setError("Select at least one thing that applies — the duty set is built from these.");
      return;
    }
    setPending(true);
    try {
      await client.updateProfile({
        sector,
        sizeBand,
        siteCount,
        activities,
        extraNotes,
      });
      await client.generateObligations();
      router.push("/onboarding/review");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not generate obligations");
    } finally {
      setPending(false);
    }
  }

  const sectorLabel = SECTORS.find((item) => item.id === sector)?.label ?? sector ?? "your sector";

  return (
    <form onSubmit={onSubmit}>
      <Field>
        <ChipRow>
          {loadingOptions
            ? ["w-28", "w-36", "w-24", "w-40", "w-32", "w-20"].map((width) => (
                <span key={width} className={`h-9 animate-pulse rounded-full bg-canvas-2 ${width}`} />
              ))
            : options.map((activity) => {
                const on = activities.includes(activity);
                return (
                  <Chip key={activity} active={on} onClick={() => toggleActivity(activity)}>
                    {on ? <IconCheck size={13} /> : null}
                    {activity}
                  </Chip>
                );
              })}
        </ChipRow>
        <p className="mt-3 text-[12.5px] text-ink-400">
          {loadingOptions
            ? `Building a ${sectorLabel.toLowerCase()} activity list…`
            : optionSource === "ai"
              ? `Generated for ${sectorLabel} — tap everything that is true for this business.`
              : `Starter list for ${sectorLabel}. Add OPENAI_API_KEY in apps/api/.env for a live, sector-specific set.`}
        </p>
      </Field>

      <div className="mb-4 flex gap-2.5">
        <Control
          className="flex-1"
          placeholder="Something else that applies"
          value={customActivity}
          onChange={(e) => setCustomActivity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustomActivity();
            }
          }}
        />
        <SubtleButton type="button" onClick={addCustomActivity}>
          <IconPlus size={14} />
          Add
        </SubtleButton>
      </div>

      <Field label="Anything else?" hint="— free text, optional">
        <TextAreaControl
          placeholder="e.g. we roast our own coffee on-site and run occasional evening events"
          value={extraNotes}
          onChange={(e) => setExtraNotes(e.target.value)}
        />
      </Field>

      <FormError>{error}</FormError>

      <OnboardingActions backHref="/onboarding/profile">
        <PrimaryButton type="submit" disabled={pending || loadingOptions}>
          {pending ? (
            "Building a duty set for this profile…"
          ) : (
            <>
              <IconSpark size={16} />
              Generate my obligations
            </>
          )}
        </PrimaryButton>
      </OnboardingActions>
    </form>
  );
}
