"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHead } from "@/components/app/app-ui";
import { SignOutButton } from "@/components/app/sign-out-button";
import { ApiError, client, type Organisation, type SessionUser } from "@/lib/api";
import { SIZE_BANDS } from "@ballast/domain";
import { sectorEmoji, sectorLabel } from "@/lib/compliance";
import { initials, roleLabel } from "@/lib/user";

export function UserProfile() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [org, setOrg] = useState<Organisation | null>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    Promise.all([client.me(), client.organisation()])
      .then(([me, organisation]) => {
        setUser(me.user);
        setOrg(organisation);
        setName(me.user.name ?? "");
      })
      .catch(() => {
        window.location.href = "/signin";
      });
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(null);
    if (newPassword && newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword && !currentPassword) {
      setError("Enter your current password to change it.");
      return;
    }
    setPending(true);
    try {
      const result = await client.updateMe({
        name: name.trim(),
        ...(newPassword ? { currentPassword, newPassword } : {}),
      });
      setUser(result.user);
      setName(result.user.name ?? "");
      setCurrentPassword("");
      setNewPassword("");
      setSaved(newPassword ? "Profile and password saved." : "Profile saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update your profile");
    } finally {
      setPending(false);
    }
  }

  if (!user || !org) return <p className="text-sm text-slate-500">Loading your profile…</p>;

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHead
        breadcrumbs={[
          { label: org.name },
          { label: "Account" },
          { label: "User Profile" },
        ]}
        title="Personal &amp; Workspace Account"
        subtitle="Manage your personal profile, credentials, security session, and view statutory business scope."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
        <form className="card p-6 space-y-4" onSubmit={onSubmit}>
          <div className="flex items-center gap-3 border-b hairline pb-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-tr from-sky-600 to-sky-400 text-sm font-bold text-white shadow-xs">
              {initials(name || user.name, user.email)}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Personal Details</h2>
              <p className="text-xs text-slate-500">Your account identity within this organisation.</p>
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-700">Full name</span>
            <input
              className="field text-xs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rachel Adeyemi"
              minLength={2}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-700">Work email</span>
            <input
              className="field text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
              value={user.email}
              readOnly
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t hairline">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Current password</span>
              <input
                className="field text-xs"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Current password"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">New password</span>
              <input
                className="field text-xs"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                autoComplete="new-password"
                placeholder="Leave blank to keep"
              />
            </label>
          </div>

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-800">
              {error}
            </div>
          ) : null}
          {saved ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800">
              {saved}
            </div>
          ) : null}

          <div className="pt-2">
            <button
              type="submit"
              disabled={pending}
              className="btn btn-primary btn-sm"
            >
              {pending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <div className="border-b hairline pb-3">
              <h2 className="text-sm font-bold text-slate-900">Organisation Scope</h2>
              <p className="text-xs text-slate-500 mt-0.5">Parameters driving your compliance obligations.</p>
            </div>

            <dl className="space-y-3 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Business Entity</dt>
                <dd className="font-semibold text-slate-900">{org.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Your Role</dt>
                <dd className="font-semibold text-slate-900">{roleLabel(user.role)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Industry Sector</dt>
                <dd className="font-semibold text-slate-900">
                  {sectorEmoji(org.sector)} {sectorLabel(org.sector)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Team Size</dt>
                <dd className="font-semibold text-slate-900">
                  {SIZE_BANDS.find((item) => item.id === org.sizeBand)?.label ?? org.sizeBand ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Operating Premises</dt>
                <dd className="text-right font-semibold text-slate-900">
                  {org.sites.length > 0
                    ? org.sites.map((site) => site.name).join(", ")
                    : org.siteCount === 1
                      ? "1 site"
                      : `${org.siteCount} sites`}
                </dd>
              </div>
            </dl>

            <div className="pt-3 border-t hairline">
              <Link
                href="/app/settings"
                className="font-mono text-[11px] font-semibold text-sky-700 hover:underline"
              >
                Manage business profile &amp; premises &rarr;
              </Link>
            </div>
          </div>

          <div className="card p-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Session &amp; Security</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Terminate active authentication tokens on this workstation. You will need your email and password to log
              back in.
            </p>
            <div className="pt-2">
              <SignOutButton variant="danger" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
