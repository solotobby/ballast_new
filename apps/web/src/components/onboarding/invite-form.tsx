"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconPlus } from "@/components/onboarding/icons";
import {
  Badge,
  Control,
  Field,
  FormError,
  LegalNote,
  OnboardingActions,
  PrimaryButton,
  SelectControl,
  SubtleButton,
} from "@/components/onboarding/ui";
import { ApiError, client, type Invite } from "@/lib/api";

const ROLE_LABEL: Record<string, string> = {
  site_manager: "Site Manager",
  staff: "Staff",
};

const AVATAR_COLORS = ["#1f6feb", "#0f9e8e", "#7b5bd6", "#d9910a"];

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"site_manager" | "staff">("site_manager");
  const [siteId, setSiteId] = useState("");
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    client
      .organisation()
      .then((org) => {
        setSites(org.sites);
        setInvites(org.invites ?? []);
        setSiteId(org.sites[0]?.id ?? "");
      })
      .catch(() => router.replace("/signin"));
  }, [router]);

  async function addInvite(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setError(null);
    setPending(true);
    try {
      const created = await client.createInvite({
        email: trimmed,
        role,
        ...(siteId ? { siteId } : {}),
      });
      setInvites((current) => [...current, created]);
      setEmail("");
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add that invite");
    } finally {
      setPending(false);
    }
  }

  async function finish() {
    setFinishing(true);
    setError(null);
    try {
      await client.setOnboardingStep("done");
      router.push("/app");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not open your dashboard");
      setFinishing(false);
    }
  }

  return (
    <div>
      <form className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-end" onSubmit={addInvite}>
        <Field label="Email" className="mb-0 min-w-0 flex-1">
          <Control
            placeholder="name@copperkettle.co.uk"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Role" className="mb-0 sm:w-[140px]">
          <SelectControl value={role} onChange={(e) => setRole(e.target.value as "site_manager" | "staff")}>
            <option value="site_manager">Site Manager</option>
            <option value="staff">Staff</option>
          </SelectControl>
        </Field>
        {sites.length > 0 ? (
          <Field label="Site" className="mb-0 sm:w-[132px]">
            <SelectControl value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </SelectControl>
          </Field>
        ) : null}
        <SubtleButton type="submit" disabled={pending} className="h-[42px] px-4 sm:mb-px">
          <IconPlus size={14} />
          {pending ? "Adding…" : "Add"}
        </SubtleButton>
      </form>

      <div className="flex flex-col gap-2">
        {invites.length === 0 ? (
          <p className="px-0.5 py-1.5 text-[12.5px] text-ink-400">No invites yet — you can always add people later.</p>
        ) : (
          invites.map((invite, index) => (
            <div key={invite.id} className="flex items-center gap-[11px] rounded-lg border border-line bg-white px-[13px] py-2.5">
              <div
                className="grid h-[34px] w-[34px] place-items-center rounded-full text-[13px] font-bold text-white"
                style={{ background: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
              >
                {initials(invite.email)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold">{invite.email}</div>
                <div className="text-[12px] text-ink-400">
                  {ROLE_LABEL[invite.role] ?? invite.role}
                  {invite.site ? ` · ${invite.site.name}` : ""}
                </div>
              </div>
              <Badge tone="due">Invite ready</Badge>
            </div>
          ))
        )}
      </div>

      <FormError>{error}</FormError>

      <OnboardingActions backHref="/onboarding/review">
        <PrimaryButton type="button" onClick={finish} disabled={finishing}>
          {finishing ? (
            "Opening your dashboard…"
          ) : (
            <>
              <IconCheck size={16} />
              Finish & open dashboard
            </>
          )}
        </PrimaryButton>
      </OnboardingActions>

      <LegalNote>
        Buyers and insurers never get an account like this — you’ll share a scoped, read-only link with them when the
        time comes.
      </LegalNote>
    </div>
  );
}
