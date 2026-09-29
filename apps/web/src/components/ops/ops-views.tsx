"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  opsClient,
  type OpsAiItem,
  type OpsAudit,
  type OpsFlag,
  type OpsHealth,
  type OpsOverview,
  type OpsRules,
  type OpsTenant,
  type OpsVaults,
  OpsApiError,
} from "@/lib/ops-api";
import {
  OpsBadge,
  OpsEmpty,
  OpsPageHead,
  OpsStat,
  coverageColor,
  tenantStatusLabel,
  tenantStatusTone,
} from "./ops-ui";

function Loading() {
  return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl border border-line bg-white" />)}</div>;
}

function MiniBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-canvas-2">
        <i className="block h-full rounded-full" style={{ width: `${pct}%`, background: coverageColor(pct) }} />
      </div>
      <b className="text-[13px] tabular-nums">{pct}%</b>
    </div>
  );
}

const OPS_TELEMETRY_BARS = [
  3, 5, 4, 8, 12, 16, 14, 18, 22, 26, 28, 24, 20, 15, 12, 9, 7, 10, 14, 19,
  25, 30, 27, 22, 18, 14, 11, 8, 13, 17, 21, 25, 29, 32, 28, 24, 19, 15, 10,
  14, 18, 23, 27, 31, 26, 20, 16, 12, 8, 14, 19, 24, 28, 30, 25, 21, 17, 13,
  9, 15, 20, 25, 28, 24, 18, 14, 10, 6, 12, 17, 22, 27, 31, 26, 20, 15, 11, 7,
  14, 19, 23, 29, 34, 28, 22, 16, 12, 8, 14, 20, 25, 29, 22, 17, 12, 8
];

function OpsTelemetryChart() {
  return (
    <div className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-bold text-slate-900 border-b border-dotted border-slate-400">
            Tenant Sync & Regulatory Telemetry Throughput
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
          <span>REAL-TIME AUDIT STREAM</span>
          <span className="text-slate-300">|</span>
          <span className="text-[#E52E2E] font-bold">2.4K REQS/MIN</span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-600 font-bold">99.98% HEALTH</span>
        </div>
      </div>
      <div className="h-9 flex items-end gap-[1.5px] overflow-hidden px-1">
        {OPS_TELEMETRY_BARS.map((h, i) => {
          const isCrimsonPeak = i === 10 || i === 33 || i === 53 || i === 84;
          const isAmberPeak = i === 21 || i === 44 || i === 72;
          const bg = isCrimsonPeak
            ? "bg-[#E52E2E]"
            : isAmberPeak
              ? "bg-amber-400"
              : "bg-slate-200 hover:bg-slate-300";
          return (
            <div
              key={i}
              className={`flex-1 transition-all duration-150 rounded-t-sm ${bg}`}
              style={{ height: `${Math.max(12, (h / 34) * 100)}%` }}
              title={`Telemetry bin ${i + 1}: ${h * 42} events`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function OpsOverviewPage() {
  const [data, setData] = useState<OpsOverview | null>(null);

  useEffect(() => {
    opsClient.overview().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Loading />;

  const total = data.tenantCount || 1;
  const okP = (data.health.healthy / total) * 100;
  const dueP = (data.health["at-risk"] / total) * 100;
  const overP = (data.health.overdue / total) * 100;
  const ring = `conic-gradient(#1f9d57 0 ${okP}%, #d9910a ${okP}% ${okP + dueP}%, #d64545 ${okP + dueP}% ${okP + dueP + overP}%, #eef1f4 ${okP + dueP + overP}% 100%)`;

  return (
    <div>
      <OpsPageHead
        title="Platform at a glance"
        subtitle={`Live health across ${data.tenantCount} hosted tenant${data.tenantCount === 1 ? "" : "s"}. ${data.flagCount} obligations awaiting human review${data.aiPendingCount > 0 ? ` and ${data.aiPendingCount} AI outputs need sign-off` : ""}.`}
        actions={
          <Link href="/ops/audit" className="rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-ink-700 hover:bg-canvas">
            Audit log
          </Link>
        }
      />

      {data.tenantCount === 0 ? (
        <OpsEmpty title="No hosted organisations yet" message="When businesses sign up through the owner app, they will appear here with live compliance posture." />
      ) : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <OpsStat label="Tenant orgs" value={data.tenantCount} hint="Hosted organisations" />
        <OpsStat label="Sites monitored" value={data.siteCount} hint={`Across ${data.tenantCount} orgs`} tone="brand" />
        <OpsStat label="Obligations tracked" value={data.obligationCount} hint="Live across platform" tone="teal" />
        <OpsStat label="Flags to review" value={data.flagCount} hint={data.flagCount ? "Owner-flagged duties" : "Queue clear"} tone="due" />
        <OpsStat label="AI pending" value={data.aiPendingCount} hint="Awaiting sign-off" tone="admin" />
      </div>

      <OpsTelemetryChart />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="rounded-[16px] border border-line bg-white shadow-[var(--sh-1)]">
            <div className="border-b border-line-2 px-5 py-3.5 text-[15px] font-semibold">Tenant health</div>
            <div className="flex flex-wrap items-center gap-6 p-5">
              <div className="relative grid h-[120px] w-[120px] place-items-center rounded-full" style={{ background: ring }}>
                <div className="absolute inset-[15px] rounded-full bg-white" />
                <div className="relative text-center">
                  <div className="text-[26px] font-extrabold">{data.health.healthy}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Healthy</div>
                </div>
              </div>
              <div className="space-y-2 text-[13px] text-ink-600">
                <div className="flex items-center gap-2">Healthy <b className="ml-auto">{data.health.healthy}</b></div>
                <div className="flex items-center gap-2">At risk <b className="ml-auto">{data.health["at-risk"]}</b></div>
                <div className="flex items-center gap-2">Action needed <b className="ml-auto">{data.health.overdue}</b></div>
              </div>
            </div>
          </div>

          <div className="card-elevated overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h3 className="font-display text-[15px] font-bold text-ink">Needs attention across tenants</h3>
              <Link href="/ops/tenants" className="text-[13px] font-semibold text-[#0284C7] hover:text-[#0369A1]">All organisations →</Link>
            </div>
            {data.attentionTenants.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-500">All tenants are healthy.</p>
            ) : (
              <table className="ops-table w-full">
                <thead>
                  <tr>
                    <th>Organisation</th>
                    <th>Sector</th>
                    <th>Coverage</th>
                    <th>Issue</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.attentionTenants.map((tenant) => (
                    <TenantRow key={tenant.id} tenant={tenant} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[16px] border border-line bg-white shadow-[var(--sh-1)]">
            <div className="border-b border-line-2 px-5 py-3.5 text-[15px] font-semibold">Review queues</div>
            <div className="divide-y divide-line-2 px-5">
              <QueueRow href="/ops/review" title={`${data.queues.flags} owner-flagged obligations`} meta="Human review path" />
              <QueueRow href="/ops/ai" title={`${data.queues.ai} AI outputs to sign off`} meta="Quality gate before release" />
              <QueueRow href="/ops/rules" title={`${data.queues.draftRules} rules packs in draft`} meta="Versioned obligation engine" />
            </div>
          </div>
          <div className="rounded-[16px] border border-line bg-white p-5 shadow-[var(--sh-1)]">
            <h3 className="mb-3 text-[15px] font-semibold">Sector mix</h3>
            {data.sectorMix.length === 0 ? (
              <p className="text-sm text-ink-500">No sectors yet.</p>
            ) : (
              data.sectorMix.map((sector) => (
                <div key={sector.id} className="mb--2 flex items-center gap-3 text-[13px]">
                  <span>{sector.emoji}</span>
                  <span className="flex-1">{sector.name}</span>
                  <b>{sector.count}</b>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QueueRow({ href, title, meta }: { href: string; title: string; meta: string }) {
  return (
    <Link href={href} className="flex items-center justify-between py-3 hover:bg-canvas">
      <div>
        <div className="text-[13.5px] font-semibold">{title}</div>
        <div className="text-[12.5px] text-ink-400">{meta}</div>
      </div>
      <span className="text-ink-400">→</span>
    </Link>
  );
}

function TenantRow({ tenant, onClick }: { tenant: OpsTenant; onClick?: () => void }) {
  const isHazard = tenant.status === "at-risk" || tenant.status === "overdue";
  return (
    <tr className={`clickable ${isHazard ? "hazard-row" : ""} ${onClick ? "" : ""}`} onClick={onClick}>
      <td>
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-slate-100 text-lg">{tenant.sectorEmoji}</span>
          <div>
            <div className="font-semibold text-slate-900">{tenant.name}</div>
            <div className="text-[12px] font-mono text-slate-400">{tenant.id.slice(0, 12)}…</div>
          </div>
        </div>
      </td>
      <td className="text-slate-600">{tenant.sectorLabel}</td>
      <td><MiniBar pct={tenant.coverage} /></td>
      <td className="text-slate-600">{tenant.health}</td>
      <td><OpsBadge tone={tenantStatusTone(tenant.status)}>{tenantStatusLabel(tenant.status)}</OpsBadge></td>
    </tr>
  );
}

export function OpsTenantsPage() {
  const [tenants, setTenants] = useState<OpsTenant[]>([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof opsClient.tenant>> | null>(null);

  useEffect(() => {
    opsClient.tenants().then(setTenants).catch(() => setTenants([]));
  }, []);

  useEffect(() => {
    if (!selected) return;
    opsClient.tenant(selected).then(setDetail).catch(() => setDetail(null));
  }, [selected]);

  const visible = useMemo(
    () => tenants.filter((item) => filter === "all" || item.status === filter),
    [tenants, filter],
  );

  return (
    <div>
      <OpsPageHead
        title="Hosted organisations"
        subtitle="Every tenant on the platform, with full coverage of their compliance posture, plan, and open flags."
      />
      {tenants.length === 0 ? (
        <OpsEmpty title="No tenants yet" message="Organisations created through owner onboarding will appear here." />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              ["all", `All · ${tenants.length}`],
              ["overdue", `Action needed · ${tenants.filter((t) => t.status === "overdue").length}`],
              ["at-risk", `At risk · ${tenants.filter((t) => t.status === "at-risk").length}`],
              ["healthy", `Healthy · ${tenants.filter((t) => t.status === "healthy").length}`],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-150 active:scale-[0.97] ${filter === id ? "border-sky-500 bg-sky-50 text-sky-700 shadow-xs ring-2 ring-sky-500/20" : "border-slate-200 bg-white text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50/50"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="overflow-hidden rounded-[16px] border border-line bg-white shadow-[var(--sh-1)]">
            <table className="ops-table w-full">
              <thead>
                <tr>
                  <th>Organisation</th>
                  <th>Sector</th>
                  <th>Sites</th>
                  <th>Plan</th>
                  <th>Coverage</th>
                  <th>Obligations</th>
                  <th>Flags</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((tenant) => (
                  <tr key={tenant.id} className="clickable" onClick={() => setSelected(tenant.id)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-canvas-2 text-lg">{tenant.sectorEmoji}</span>
                        <div>
                          <div className="font-semibold">{tenant.name}</div>
                          <div className="font-mono text-[12px] text-ink-400">{tenant.id.slice(0, 16)}…</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-ink-500">{tenant.sectorLabel}</td>
                    <td>{tenant.sites}</td>
                    <td><OpsBadge tone="neutral">{tenant.plan}</OpsBadge></td>
                    <td><MiniBar pct={tenant.coverage} /></td>
                    <td>{tenant.obligations}</td>
                    <td>{tenant.flags ? <OpsBadge tone="due">{tenant.flags}</OpsBadge> : "—"}</td>
                    <td><OpsBadge tone={tenantStatusTone(tenant.status)}>{tenantStatusLabel(tenant.status)}</OpsBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selected && detail ? (
        <>
          <button type="button" className="ops-drawer-backdrop" onClick={() => setSelected(null)} aria-label="Close" />
          <aside className="ops-drawer p-5">
            <div className="mb-4 flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-canvas-2 text-xl">{detail.tenant.sectorEmoji}</span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[18px] font-bold">{detail.tenant.name}</h3>
                <p className="text-[12px] text-ink-400">{detail.tenant.id}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-ink-400">×</button>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              <OpsBadge tone={tenantStatusTone(detail.tenant.status)}>{tenantStatusLabel(detail.tenant.status)}</OpsBadge>
              <OpsBadge tone="neutral">{detail.tenant.plan}</OpsBadge>
              <OpsBadge tone="teal">{detail.tenant.storage} in vault</OpsBadge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-[13px]">
              <div className="rounded-[10px] bg-canvas p-3"><div className="text-[22px] font-extrabold">{detail.tenant.coverage}%</div><div className="text-ink-400">Coverage</div></div>
              <div className="rounded-[10px] bg-canvas p-3"><div className="text-[22px] font-extrabold">{detail.tenant.sites}</div><div className="text-ink-400">Sites</div></div>
              <div className="rounded-[10px] bg-canvas p-3"><div className="text-[22px] font-extrabold">{detail.tenant.seats}</div><div className="text-ink-400">Seats</div></div>
              <div className="rounded-[10px] bg-canvas p-3"><div className="text-[22px] font-extrabold">{detail.tenant.obligations}</div><div className="text-ink-400">Obligations</div></div>
            </div>
            <p className="mt-4 text-[13px] text-ink-500">Joined {detail.tenant.joined} · {detail.tenant.health}</p>
            <h4 className="mb-2 mt-5 text-[13px] font-bold uppercase tracking-wide text-ink-400">Open flags ({detail.flags.length})</h4>
            {detail.flags.length === 0 ? <p className="text-sm text-ink-500">No open flags.</p> : detail.flags.map((f) => <FlagCard key={f.id} flag={f} compact />)}
            <h4 className="mb-2 mt-5 text-[13px] font-bold uppercase tracking-wide text-ink-400">AI outputs ({detail.ai.length})</h4>
            {detail.ai.length === 0 ? <p className="text-sm text-ink-500">None pending.</p> : detail.ai.slice(0, 4).map((item) => (
              <div key={item.id} className="mb-2 rounded-[10px] border border-line p-3 text-[13px]">
                <div className="font-semibold">{item.title}</div>
                <div className="text-ink-400">{item.confidence} confidence · {item.when}</div>
              </div>
            ))}
          </aside>
        </>
      ) : null}
    </div>
  );
}

function FlagCard({ flag, compact }: { flag: OpsFlag; compact?: boolean }) {
  return (
    <div className={`mb-3 rounded-[14px] border border-line bg-white ${compact ? "p-3" : "p-4 shadow-[var(--sh-1)]"}`}>
      <div className="mb-2 flex items-start gap-3">
        <div className="flex-1">
          <h4 className="text-[15px] font-semibold">{flag.title}</h4>
          <p className="text-[12.5px] text-ink-400">{flag.basis} · {flag.when}</p>
        </div>
        <OpsBadge tone={flag.priority === "high" ? "over" : flag.priority === "med" ? "due" : "neutral"}>
          {flag.priority} priority
        </OpsBadge>
      </div>
      {!compact ? (
        <>
          <div className="mb-2 flex flex-wrap gap-2">
            <OpsBadge tone="neutral">{flag.tenantName}</OpsBadge>
            <OpsBadge tone={flag.source === "ai" ? "admin" : "brand"}>{flag.source === "ai" ? `AI · ${flag.confidence}` : "Rules-based"}</OpsBadge>
          </div>
          <div className="rounded-[10px] border-l-[3px] border-sky-500 bg-canvas/60 px-3.5 py-3 text-[13px] leading-relaxed text-ink-700">{flag.reason}</div>
        </>
      ) : (
        <p className="text-[12.5px] text-ink-500">{flag.reason.slice(0, 100)}{flag.reason.length > 100 ? "…" : ""}</p>
      )}
    </div>
  );
}

export function OpsReviewPage() {
  const [flags, setFlags] = useState<OpsFlag[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  function reload() {
    opsClient.flags().then(setFlags).catch(() => setFlags([]));
  }

  useEffect(() => {
    reload();
  }, []);

  async function resolve(id: string, action: "uphold" | "reject") {
    try {
      await opsClient.resolveFlag(id, action);
      setToast(action === "uphold" ? "Obligation removed for tenant" : "Obligation kept — owner notified");
      reload();
    } catch (err) {
      setToast(err instanceof OpsApiError ? err.message : "Action failed");
    }
  }

  return (
    <div>
      <OpsPageHead
        title="Flag review queue"
        subtitle="Obligations a tenant owner flagged as questionable. Uphold, reject with rationale, or escalate — every decision is audit-logged."
      />
      {toast ? <p className="mb-4 rounded-xl bg-ok-050 px-4 py-2 text-[13px] font-semibold text-[#0f6b3a]">{toast}</p> : null}
      {flags.length === 0 ? (
        <OpsEmpty title="Review queue is clear" message="No owner-flagged obligations waiting for ops review." />
      ) : (
        flags.map((flag) => (
          <div key={flag.id} className="mb-3 rounded-[14px] border border-line bg-white p-4 shadow-[var(--sh-1)]">
            <FlagCard flag={flag} />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => resolve(flag.id, "uphold")} className="rounded-lg bg-ok-050 px-3 py-1.5 text-[13px] font-semibold text-[#0f6b3a]">
                Uphold flag — remove
              </button>
              <button type="button" onClick={() => resolve(flag.id, "reject")} className="rounded-lg bg-over-050 px-3 py-1.5 text-[13px] font-semibold text-[#9b2020]">
                Reject — keep obligation
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function OpsAiPage() {
  const [items, setItems] = useState<OpsAiItem[]>([]);
  useEffect(() => {
    opsClient.ai().then(setItems).catch(() => setItems([]));
  }, []);

  const pending = items.filter((item) => item.status === "pending" || item.status === "needs-edit");

  return (
    <div>
      <OpsPageHead
        title="AI recommendation quality"
        subtitle="AI-generated obligations and explanations reviewed before release to tenants — each carries confidence and provenance."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <OpsStat label="Awaiting sign-off" value={pending.length} tone="due" />
        <OpsStat label="Total in queue" value={items.length} tone="admin" />
        <OpsStat label="Low confidence" value={items.filter((i) => i.confidence === "Low" || i.confidence === "low").length} tone="over" />
        <OpsStat label="Approved" value={items.filter((i) => i.status === "approved").length} tone="ok" />
      </div>
      {items.length === 0 ? (
        <OpsEmpty title="No AI outputs in queue" message="When the obligation engine generates AI-inferred duties, they will appear here for review." />
      ) : (
        items.map((item) => (
          <div key={item.id} className="mb-3 rounded-[14px] border border-line bg-white p-4 shadow-[var(--sh-1)]">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h4 className="text-[15px] font-semibold">{item.title}</h4>
                <p className="text-[12.5px] text-ink-400">{item.kind} · {item.when}</p>
              </div>
              <OpsBadge tone={item.status === "approved" ? "ok" : item.status === "needs-edit" ? "admin" : "due"}>
                {item.status}
              </OpsBadge>
            </div>
            <div className="mb-2 flex flex-wrap gap-2">
              <OpsBadge tone="neutral">{item.tenantName}</OpsBadge>
              <OpsBadge tone={item.confidence === "High" || item.confidence === "high" ? "ok" : item.confidence === "Medium" || item.confidence === "medium" ? "due" : "over"}>
                {item.confidence} confidence
              </OpsBadge>
            </div>
            <p className="rounded-[10px] bg-canvas p-3 text-[13.5px] leading-relaxed text-ink-700">{item.note}</p>
            <p className="mt-2 text-[11.5px] text-ink-400">Traceable to {item.basis}</p>
          </div>
        ))
      )}
    </div>
  );
}

export function OpsRulesPage() {
  const [data, setData] = useState<OpsRules | null>(null);
  useEffect(() => {
    opsClient.rules().then(setData).catch(() => setData(null));
  }, []);
  if (!data) return <Loading />;

  return (
    <div>
      <OpsPageHead
        title="Regulatory rules corpus"
        subtitle="Versioned rule packs powering the obligation engine. Every generated duty stamps its rules version."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <OpsStat label="Rule packs" value={data.packs.length} />
        <OpsStat label="Obligations defined" value={data.totalObligations} tone="teal" />
        <OpsStat label="In draft" value={data.draftCount} tone="due" />
      </div>
      <div className="overflow-hidden rounded-[16px] border border-line bg-white shadow-[var(--sh-1)]">
        <table className="ops-table w-full">
          <thead>
            <tr>
              <th>Rule pack</th>
              <th>Sector</th>
              <th>Version</th>
              <th>Obligations</th>
              <th>Source</th>
              <th>Last updated</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.packs.map((pack) => (
              <tr key={pack.id}>
                <td><div className="font-semibold">{pack.name}</div><div className="font-mono text-[12px] text-ink-400">{pack.id}</div></td>
                <td>{pack.sector === "all" ? "All sectors" : pack.sector}</td>
                <td>{pack.version}</td>
                <td>{pack.obligations}</td>
                <td className="text-ink-500">{pack.source}</td>
                <td className="text-ink-500">{pack.updated}</td>
                <td><OpsBadge tone={pack.status === "published" ? "ok" : "due"}>{pack.status === "published" ? "Published" : "Draft"}</OpsBadge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OpsVaultsPage() {
  const [data, setData] = useState<OpsVaults | null>(null);
  useEffect(() => {
    opsClient.vaults().then(setData).catch(() => setData(null));
  }, []);
  if (!data) return <Loading />;

  return (
    <div>
      <OpsPageHead
        title="Evidence vault oversight"
        subtitle="Cross-tenant view of evidence vaults — encrypted at rest, access-logged from day one."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <OpsStat label="Total evidence stored" value={data.totalBytesLabel} tone="teal" />
        <OpsStat label="Files scanned" value={data.scanCount} tone="ok" />
        <OpsStat label="Access events" value={data.accessLog.length} tone="brand" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[16px] border border-line bg-white shadow-[var(--sh-1)]">
          <div className="border-b border-line-2 px-5 py-3.5 font-semibold">Access log</div>
          {data.accessLog.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-500">No vault activity yet.</p>
          ) : (
            data.accessLog.map((row, index) => (
              <div key={index} className="flex gap-3 border-b border-line-2 px-5 py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px]"><b>{row.who}</b> {row.act} <b>{row.object}</b></div>
                  <div className="text-[12px] text-ink-400">{row.tenantName} · {row.reason}</div>
                </div>
                <div className="shrink-0 text-[12px] text-ink-400">{row.when}</div>
              </div>
            ))
          )}
        </div>
        <div className="rounded-[16px] border border-line bg-white shadow-[var(--sh-1)]">
          <div className="border-b border-line-2 px-5 py-3.5 font-semibold">Vault storage by tenant</div>
          {data.tenantVaults.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-500">No vault data yet.</p>
          ) : (
            data.tenantVaults.map((tenant) => (
              <div key={tenant.id} className="flex items-center gap-3 border-b border-line-2 px-5 py-3 last:border-b-0">
                <div className="min-w-0 flex-1 truncate font-semibold text-[13px]">{tenant.name}</div>
                <div className="text-[13px] font-semibold tabular-nums">{tenant.storage}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function OpsMonitoringPage() {
  const [data, setData] = useState<OpsHealth | null>(null);
  useEffect(() => {
    opsClient.health().then(setData).catch(() => setData(null));
  }, []);
  if (!data) return <Loading />;

  return (
    <div>
      <OpsPageHead
        title="Jobs & platform health"
        subtitle="Background checks must be resilient to partial failure — metrics below are derived from live platform data."
        actions={<OpsBadge tone="ok">All regions operational</OpsBadge>}
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <OpsStat label="Checks indexed" value={data.checks24h} tone="teal" />
        <OpsStat label="Success rate" value={`${data.successRate}%`} tone="ok" />
        <OpsStat label="Auto-retried" value={data.retried} />
        <OpsStat label="Queue depth" value={data.queueDepth} tone="brand" />
      </div>
      <div className="rounded-[16px] border border-line bg-white shadow-[var(--sh-1)]">
        <div className="border-b border-line-2 px-5 py-3.5 font-semibold">Background jobs</div>
        {data.jobs.map((job) => (
          <div key={job.name} className="flex flex-wrap items-center gap-4 border-b border-line-2 px-5 py-4 last:border-b-0">
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{job.name}</div>
              <div className="text-[12.5px] text-ink-400">{job.sub}</div>
            </div>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-canvas-2">
              <i className="block h-full rounded-full bg-ok-500" style={{ width: `${job.pct}%` }} />
            </div>
            <OpsBadge tone={job.status === "Healthy" ? "ok" : "due"}>{job.status}</OpsBadge>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OpsAuditPage() {
  const [data, setData] = useState<OpsAudit | null>(null);
  useEffect(() => {
    opsClient.audit().then(setData).catch(() => setData(null));
  }, []);
  if (!data) return <Loading />;

  return (
    <div>
      <OpsPageHead title="Audit & security" subtitle="Immutable trail over evidence access, obligation changes, and share grants." />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <OpsStat label="Recent events" value={data.eventCount24h} tone="admin" />
        <OpsStat label="Active shares" value={data.shareCount24h} tone="brand" />
        <OpsStat label="Security events" value={data.securityEvents} tone={data.securityEvents ? "over" : "ok"} />
      </div>
      <div className="rounded-[16px] border border-line bg-white shadow-[var(--sh-1)]">
        <div className="flex items-center justify-between border-b border-line-2 px-5 py-3.5">
          <h3 className="font-semibold">Recent platform events</h3>
          <OpsBadge tone="neutral">Append-only</OpsBadge>
        </div>
        {data.events.length === 0 ? (
          <OpsEmpty title="No audit events yet" message="Share grants, evidence uploads, and flagged obligations will appear here." />
        ) : (
          data.events.map((event) => (
            <div key={event.id} className="flex gap-3 border-b border-line-2 px-5 py-3 last:border-b-0">
              <OpsBadge tone={event.tone as "brand"}>{event.tone}</OpsBadge>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold">{event.title}</div>
                <div className="text-[12.5px] text-ink-400">{event.meta}</div>
              </div>
              <div className="shrink-0 text-[12px] text-ink-400">{event.when}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
