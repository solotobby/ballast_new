"use client";

import type { ReactNode } from "react";

const BADGE: Record<string, { cls: string; dot: string }> = {
  ok: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  due: { cls: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  over: { cls: "bg-rose-50 text-rose-800 border-rose-200", dot: "bg-rose-500" },
  gap: { cls: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  neutral: { cls: "bg-slate-50 text-slate-700 border-slate-200", dot: "bg-slate-400" },
  brand: { cls: "bg-rose-50 text-[#E52E2E] border-rose-200", dot: "bg-[#E52E2E]" },
  admin: { cls: "bg-rose-50 text-[#E52E2E] border-rose-200", dot: "bg-[#E52E2E]" },
  teal: { cls: "bg-slate-100 text-slate-800 border-slate-200", dot: "bg-slate-600" },
};

export function OpsBadge({ tone, children }: { tone: keyof typeof BADGE; children: ReactNode }) {
  const item = BADGE[tone] ?? BADGE.neutral;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold tracking-wide ${item.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
      {children}
    </span>
  );
}

export function OpsStat({
  label,
  value,
  hint,
  tone = "admin",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "admin" | "brand" | "ok" | "due" | "over" | "teal";
}) {
  const ic = {
    admin: "bg-rose-50 text-[#E52E2E] border border-rose-200",
    brand: "bg-rose-50 text-[#E52E2E] border border-rose-200",
    ok: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    due: "bg-amber-50 text-amber-600 border border-amber-200",
    over: "bg-rose-50 text-rose-600 border border-rose-200",
    teal: "bg-slate-50 text-slate-700 border border-slate-200",
  }[tone];
  return (
    <div className="ops-stat">
      <div className="mb-3.5 flex items-center justify-between gap-2.5">
        <span className="text-[13px] font-medium text-ink-500">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${ic}`}>
          <span className="h-2 w-2 rounded-full bg-current" />
        </span>
      </div>
      <div className="font-display tnum text-[30px] font-extrabold leading-none tracking-tight text-ink">{value}</div>
      {hint ? <div className="mt-2 text-[12px] font-medium text-ink-400">{hint}</div> : null}
    </div>
  );
}

export function OpsPageHead({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start gap-4">
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-[24px] font-bold tracking-tight text-ink">{title}</h2>
        <p className="mt-1 max-w-[680px] text-[14px] leading-relaxed text-ink-500">{subtitle}</p>
      </div>
      {actions ? <div className="ml-auto flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}

export function tenantStatusTone(status: string): keyof typeof BADGE {
  if (status === "healthy") return "ok";
  if (status === "at-risk") return "due";
  return "over";
}

export function tenantStatusLabel(status: string) {
  if (status === "healthy") return "Healthy";
  if (status === "at-risk") return "At risk";
  return "Action needed";
}

export function coverageColor(pct: number) {
  if (pct >= 85) return "#059669";
  if (pct >= 65) return "#d97706";
  return "#e11d48";
}

export function OpsEmpty({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-[18px] border border-dashed border-slate-300 bg-canvas/60 px-6 py-12 text-center">
      <p className="font-display text-[15px] font-bold text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-ink-500">{message}</p>
    </div>
  );
}
