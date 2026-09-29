import type { ReactNode } from "react";
import type { StaffTaskStatus } from "./types";

const CAT_EMOJI: Record<string, string> = {
  food: "🌡️",
  fire: "🧯",
  hs: "🦺",
  licence: "🪪",
  lic: "🪪",
  clean: "🧼",
  allergen: "🥜",
};

const CAT_IC: Record<string, string> = {
  food: "staff-ic-food",
  fire: "staff-ic-fire",
  hs: "staff-ic-hs",
  licence: "staff-ic-lic",
  lic: "staff-ic-lic",
  clean: "staff-ic-food",
  allergen: "staff-ic-food",
};

const LOG_BG: Record<string, string> = {
  food: "var(--due-050)",
  fire: "var(--over-050)",
  hs: "var(--brand-050)",
  licence: "var(--gap-050)",
  lic: "var(--gap-050)",
  clean: "var(--due-050)",
  allergen: "var(--due-050)",
};

export function catEmoji(category: string) {
  return CAT_EMOJI[category] ?? "📋";
}

export function catIc(category: string) {
  return CAT_IC[category] ?? "staff-ic-hs";
}

export function logBg(category: string) {
  return LOG_BG[category] ?? "var(--brand-050)";
}

export function statusBadge(status: StaffTaskStatus) {
  const map = {
    done: { cls: "staff-b-ok", label: "Done" },
    due: { cls: "staff-b-due", label: "Due now" },
    upcoming: { cls: "staff-b-neutral", label: "Later" },
    overdue: { cls: "staff-b-over", label: "Overdue" },
  }[status];
  return (
    <span className={`staff-badge ${map.cls}`}>
      <span className="dot" />
      {map.label}
    </span>
  );
}

export function BrandBadge({ children }: { children: ReactNode }) {
  return (
    <span className="staff-badge staff-b-brand">
      <span className="dot" />
      {children}
    </span>
  );
}

export function StaffButton({
  children,
  variant = "primary",
  className = "",
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "teal" | "ghost" | "subtle";
}) {
  const variants = {
    primary: "staff-btn-primary",
    teal: "staff-btn-teal",
    ghost: "staff-btn-ghost",
    subtle: "staff-btn-subtle",
  };
  return (
    <button type="button" {...props} className={`staff-btn ${variants[variant]} ${className}`} style={style}>
      {children}
    </button>
  );
}

export function GuidedHint({ children }: { children: ReactNode }) {
  return (
    <div className="staff-guided-hint">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" strokeLinejoin="round" />
      </svg>
      <div>{children}</div>
    </div>
  );
}

export function formatWhen(date: string) {
  const d = new Date(date);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });

  if (d >= startOfToday) {
    const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (mins < 2) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `Today · ${time}`;
  }
  if (d >= startOfYesterday) return `Yesterday · ${time}`;
  const days = Math.floor((startOfToday.getTime() - d.getTime()) / 86400000);
  if (days < 7) return `${days} days ago · ${time}`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function evidenceMeta(obligationTitle: string | undefined, by: string, when: string) {
  const label = obligationTitle ?? "General";
  const who = by === "You" ? "uploaded by you" : `uploaded by ${by}`;
  return `${label} · ${who} · ${when}`;
}
