import Link from "next/link";
import type { ReactNode } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function PageHead({
  title,
  subtitle,
  breadcrumbs,
  actions,
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[] | string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        {breadcrumbs ? (
          <div className="mb-1 flex flex-wrap items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-500">
            {typeof breadcrumbs === "string" ? (
              <span>{breadcrumbs}</span>
            ) : (
              breadcrumbs.map((crumb, idx) => (
                <span key={idx} className="flex items-center gap-1.5">
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="font-medium text-slate-600 transition hover:text-slate-900"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={idx === breadcrumbs.length - 1 ? "font-semibold text-slate-800" : ""}>
                      {crumb.label}
                    </span>
                  )}
                  {idx < breadcrumbs.length - 1 ? <span className="text-slate-300">/</span> : null}
                </span>
              ))
            )}
          </div>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle ? (
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AppBadge({
  tone,
  children,
}: {
  tone: "ok" | "due" | "over" | "gap" | "brand" | "neutral";
  children: ReactNode;
}) {
  const map = {
    ok: { cls: "bg-emerald-50 text-emerald-800 border-emerald-200/80", dot: "bg-emerald-500" },
    due: { cls: "bg-amber-50 text-amber-800 border-amber-200/80", dot: "bg-amber-500" },
    over: { cls: "bg-rose-50 text-rose-800 border-rose-200/80", dot: "bg-rose-500" },
    gap: { cls: "bg-purple-50 text-purple-800 border-purple-200/80", dot: "bg-purple-500" },
    brand: { cls: "bg-sky-50 text-sky-800 border-sky-200/80", dot: "bg-sky-500" },
    neutral: { cls: "bg-slate-50 text-slate-700 border-slate-200", dot: "bg-slate-400" },
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide ${map.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${map.dot}`} />
      {children}
    </span>
  );
}

export function StatTile({
  label,
  value,
  tone = "brand",
  hint,
  hintTone = "muted",
}: {
  label: string;
  value: string | number;
  tone?: "ok" | "due" | "over" | "gap" | "brand" | "teal";
  hint?: string;
  hintTone?: "up" | "down" | "muted";
}) {
  const toneMap = {
    ok: { dot: "bg-emerald-500", text: "text-emerald-700" },
    due: { dot: "bg-amber-500", text: "text-amber-700" },
    over: { dot: "bg-rose-500", text: "text-rose-700" },
    gap: { dot: "bg-purple-500", text: "text-purple-700" },
    brand: { dot: "bg-sky-500", text: "text-sky-700" },
    teal: { dot: "bg-teal-500", text: "text-teal-700" },
  }[tone];

  const hintCls =
    hintTone === "up"
      ? "text-emerald-700 font-medium"
      : hintTone === "down"
        ? "text-rose-700 font-medium"
        : "text-slate-500";

  return (
    <div className="card p-4 flex flex-col justify-between transition hover:border-slate-300">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
        <span>{label}</span>
        <span className={`h-2 w-2 rounded-full ${toneMap.dot}`} />
      </div>
      <div className="my-2">
        <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight">{value}</div>
      </div>
      {hint ? <div className={`text-xs ${hintCls}`}>{hint}</div> : null}
    </div>
  );
}

export function SettingsToggle({ defaultOn = true }: { defaultOn?: boolean }) {
  return (
    <div
      className={`relative h-[24px] w-11 shrink-0 cursor-pointer rounded-full transition ${defaultOn ? "bg-sky-600" : "bg-slate-300"}`}
      role="presentation"
    >
      <div
        className={`absolute top-[2px] h-5 w-5 rounded-full bg-white shadow-xs transition ${defaultOn ? "right-[2px]" : "left-[2px]"}`}
      />
    </div>
  );
}

export function SettingsRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 border-b hairline px-5 py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="mt-0.5 text-xs text-slate-500">{description}</div>
      </div>
      {control}
    </div>
  );
}
