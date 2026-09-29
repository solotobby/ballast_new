"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHead, StatTile } from "@/components/app/app-ui";
import {
  ApiError,
  client,
  type Organisation,
  type TeamInviteRow,
  type TeamMember,
  type TeamOverview,
  type TeamSite,
  type SessionUser,
} from "@/lib/api";
import { canManageTeam } from "@/lib/nav";
import { initials, roleLabel } from "@/lib/user";

function coverageBadge(tone: TeamSite["coverageTone"], coverage: number) {
  if (tone === "ok") {
    return (
      <span className="pill st-ok">
        <span className="dot" /> {coverage}% COVERED
      </span>
    );
  }
  if (tone === "due") {
    return (
      <span className="pill st-due">
        <span className="dot" /> {coverage}% COVERED
      </span>
    );
  }
  return (
    <span className="pill st-bad">
      <span className="dot" /> {coverage}% COVERED
    </span>
  );
}

function roleBadge(role: string) {
  const owner = role === "owner";
  return (
    <span
      className={`pill ${owner ? "st-brand" : "st-neutral"}`}
    >
      <span className="dot" />
      {roleLabel(role).toUpperCase()}
    </span>
  );
}

export function TeamPage() {
  const [data, setData] = useState<TeamOverview | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [org, setOrg] = useState<Organisation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [siteOpen, setSiteOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"site_manager" | "staff">("site_manager");
  const [inviteSiteId, setInviteSiteId] = useState("");

  const [siteName, setSiteName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [siteKind, setSiteKind] = useState("");

  const load = useCallback(async () => {
    const [overview, me, organisation] = await Promise.all([
      client.team(),
      client.me(),
      client.organisation().catch(() => null),
    ]);
    setData(overview);
    setUser(me.user);
    setOrg(organisation);
    setInviteSiteId((current) => current || overview.sites[0]?.id || "");
  }, []);

  useEffect(() => {
    load().catch(() => {
      window.location.href = "/signin";
    });
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function submitInvite(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await client.createInvite({
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        ...(inviteSiteId ? { siteId: inviteSiteId } : {}),
      });
      setInviteEmail("");
      setInviteOpen(false);
      setToast("Invite sent by email");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send invite");
    } finally {
      setPending(false);
    }
  }

  async function submitSite(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await client.createSite({
        name: siteName.trim(),
        ...(siteAddress.trim() ? { address: siteAddress.trim() } : {}),
        ...(siteKind.trim() ? { kind: siteKind.trim() } : {}),
      });
      setSiteName("");
      setSiteAddress("");
      setSiteKind("");
      setSiteOpen(false);
      setToast("Site added");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add site");
    } finally {
      setPending(false);
    }
  }

  async function revoke(id: string) {
    setError(null);
    try {
      await client.revokeInvite(id);
      setToast("Invite revoked");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not revoke invite");
    }
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse card" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-32 animate-pulse card" />
          <div className="h-32 animate-pulse card" />
        </div>
      </div>
    );
  }

  const rows: Array<
    | { kind: "member"; row: TeamMember }
    | { kind: "invite"; row: TeamInviteRow }
  > = [
    ...data.members.map((row) => ({ kind: "member" as const, row })),
    ...data.invites.map((row) => ({ kind: "invite" as const, row })),
  ];

  const manageTeam = canManageTeam(user);
  const avgCoverage = Math.round(
    data.sites.reduce((acc, s) => acc + s.coverage, 0) / (data.sites.length || 1),
  );

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <PageHead
        breadcrumbs={[
          { label: org?.name ?? user?.organisationName ?? "The Copper Kettle Ltd" },
          { label: "Workspace" },
          { label: "Team & Access" },
        ]}
        title="Team Members &amp; Operating Sites"
        subtitle="Role-based statutory access — workspace owners hold full authority, site managers oversee their premise compliance, and staff log shift duties."
        actions={
          manageTeam ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSiteOpen(true)}
                className="btn btn-ghost btn-sm"
              >
                + Add Site
              </button>
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                <span>Invite Member</span>
              </button>
            </div>
          ) : null
        }
      />

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      {toast ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800">
          {toast}
        </div>
      ) : null}

      {/* 4-Column Executive Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Team Personnel"
          value={data.members.length}
          tone="brand"
          hint="Active staff & managers"
        />
        <StatTile
          label="Operating Sites"
          value={data.sites.length}
          tone="teal"
          hint="Physical premises"
        />
        <StatTile
          label="Pending Invites"
          value={data.invites.length}
          tone={data.invites.length > 0 ? "due" : "ok"}
          hint={data.invites.length > 0 ? "Awaiting activation" : "All invites accepted"}
          hintTone={data.invites.length > 0 ? "down" : "up"}
        />
        <StatTile
          label="Statutory Coverage"
          value={`${avgCoverage}%`}
          tone="ok"
          hint="Premises duty completion"
          hintTone="up"
        />
      </div>

      {/* Operating Sites Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Operating Sites &amp; Premises</h2>
          <span className="font-mono text-[11px] text-slate-400">{data.sites.length} locations</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {data.sites.map((site) => (
            <article key={site.id} className="card p-4 space-y-2.5 transition hover:border-slate-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm" aria-hidden>📍</span>
                  <h3 className="text-xs font-bold text-slate-900">
                    {site.name}
                    {site.kind ? <span className="font-normal text-slate-500"> — {site.kind}</span> : null}
                  </h3>
                </div>
                {coverageBadge(site.coverageTone, site.coverage)}
              </div>

              <div className="font-mono text-[11px] text-slate-500 pt-1 border-t hairline flex items-center justify-between">
                <span>{site.address || "Address registered"} · {site.staffCount} staff</span>
                <span>
                  Lead:{" "}
                  {site.leadPending ? (
                    <span className="text-amber-700 font-semibold">invite pending</span>
                  ) : (
                    <span className="font-semibold text-slate-800">{site.leadName ?? "Unassigned"}</span>
                  )}
                </span>
              </div>
            </article>
          ))}
          {data.sites.length === 0 ? (
            <div className="card p-8 text-center text-xs text-slate-500 md:col-span-2">
              No sites yet. Add your first location to scope managers and staff.
            </div>
          ) : null}
        </div>
      </div>

      {/* Team Members Card Table */}
      <div className="card overflow-hidden">
        <div className="border-b hairline px-5 py-3.5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Team Personnel &amp; Pending Invites</h3>
          <span className="font-mono text-[11px] text-slate-400">{rows.length} total users</span>
        </div>
        <div className="overflow-x-auto">
          <table className="dtable w-full">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Scope</th>
                <th>Last active</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => {
                if (entry.kind === "member") {
                  const m = entry.row;
                  return (
                    <tr key={`m-${m.id}`} className="border-b border-line-2 last:border-0">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="grid h-9 w-9 place-items-center rounded-full text-[12px] font-bold text-white"
                            style={{ background: m.avatarColor }}
                          >
                            {initials(m.name, m.email)}
                          </div>
                          <div>
                            <div className="font-semibold text-ink-900">{m.name ?? m.email}</div>
                            <div className="text-[12.5px] text-ink-400">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">{roleBadge(m.role)}</td>
                      <td className="px-3 py-3.5 text-ink-500">{m.scope}</td>
                      <td className="px-3 py-3.5 text-ink-500">{m.lastActiveLabel}</td>
                      <td className="px-5 py-3.5 text-right text-ink-400">—</td>
                    </tr>
                  );
                }
                const inv = entry.row;
                return (
                  <tr key={`i-${inv.id}`} className="border-b border-line-2 bg-[#fcfcfd] last:border-0">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="grid h-9 w-9 place-items-center rounded-full text-[12px] font-bold text-white"
                          style={{ background: inv.avatarColor }}
                        >
                          {initials(null, inv.email)}
                        </div>
                        <div>
                          <div className="font-semibold text-ink-900">{inv.name}</div>
                          <div className="text-[12.5px] text-ink-400">{inv.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">{roleBadge(inv.role)}</td>
                    <td className="px-3 py-3.5 text-ink-500">{inv.scope}</td>
                    <td className="px-3 py-3.5 text-ink-500">{inv.lastActiveLabel}</td>
                    <td className="px-5 py-3.5 text-right">
                      {manageTeam ? (
                        <button
                          type="button"
                          onClick={() => revoke(inv.id)}
                          className="text-[13px] font-semibold text-over-500 hover:underline"
                        >
                          Revoke
                        </button>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {inviteOpen ? (
        <div className="overlay open" onClick={() => setInviteOpen(false)}>
          <form
            className="w-full max-w-[440px] rounded-xl border hairline bg-white p-5 shadow-xl space-y-4 animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitInvite}
          >
            <div className="flex items-center justify-between border-b hairline pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Invite Team Member</h3>
                <p className="text-xs text-slate-500 mt-0.5">Send a workspace invitation by email.</p>
              </div>
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Email address</span>
                <input
                  required
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@business.co.uk"
                  className="field text-xs"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Access role</span>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "site_manager" | "staff")}
                  className="field text-xs"
                >
                  <option value="site_manager">Site Manager — manage site duties &amp; staff</option>
                  <option value="staff">Staff — log routine operational tasks</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Operating premise</span>
                <select
                  value={inviteSiteId}
                  onChange={(e) => setInviteSiteId(e.target.value)}
                  className="field text-xs"
                >
                  {data.sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t hairline pt-3">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="btn btn-ghost btn-sm text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="btn btn-primary btn-sm"
              >
                {pending ? "Sending…" : "Send Invitation"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {siteOpen ? (
        <div className="overlay open" onClick={() => setSiteOpen(false)}>
          <form
            className="w-full max-w-[440px] rounded-xl border hairline bg-white p-5 shadow-xl space-y-4 animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitSite}
          >
            <div className="flex items-center justify-between border-b hairline pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add Operating Site</h3>
                <p className="text-xs text-slate-500 mt-0.5">Register a premises to isolate duty scope.</p>
              </div>
              <button
                type="button"
                onClick={() => setSiteOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Site name</span>
                <input
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Central Kitchen (HQ)"
                  className="field text-xs"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Address</span>
                <input
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  placeholder="14 King St, Manchester M2 6AW"
                  className="field text-xs"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Premise type / kind</span>
                <input
                  value={siteKind}
                  onChange={(e) => setSiteKind(e.target.value)}
                  placeholder="Commercial kitchen, retail bar, warehouse..."
                  className="field text-xs"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t hairline pt-3">
              <button
                type="button"
                onClick={() => setSiteOpen(false)}
                className="btn btn-ghost btn-sm text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="btn btn-primary btn-sm"
              >
                {pending ? "Saving…" : "Add Site"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="font-mono text-[11px] text-slate-400 pt-2">
        Need a verifiable share link for a buyer or auditor?{" "}
        <Link href="/app/share" className="font-semibold text-sky-700 hover:underline">
          Create share link &rarr;
        </Link>
      </div>

    </div>
  );
}
