import type { Invite, LogEntry, Obligation } from "@/lib/api";
import { categoryMeta, statusLabel } from "@/lib/compliance";

export type AppNotification = {
  id: string;
  tone: "over" | "due" | "gap" | "brand" | "ok";
  title: string;
  body: string;
  href: string;
  timeLabel?: string;
};

function withinDays(iso: string, days: number) {
  return Date.now() - new Date(iso).getTime() <= days * 24 * 60 * 60 * 1000;
}

export function buildNotifications(
  obligations: Obligation[],
  logs: LogEntry[],
  invites: Invite[],
): AppNotification[] {
  const items: AppNotification[] = [];

  for (const obligation of obligations.filter((item) => item.reviewState === "pending")) {
    items.push({
      id: `pending-${obligation.id}`,
      tone: "due",
      title: "Duty needs confirmation",
      body: obligation.title,
      href: "/app/obligations",
    });
  }

  for (const obligation of obligations.filter((item) => item.status === "overdue")) {
    items.push({
      id: `overdue-${obligation.id}`,
      tone: "over",
      title: "Overdue obligation",
      body: obligation.title,
      href: "/app/obligations",
      timeLabel: obligation.nextDueAt
        ? new Date(obligation.nextDueAt).toLocaleDateString("en-GB")
        : undefined,
    });
  }

  for (const obligation of obligations.filter((item) => item.status === "due_soon")) {
    items.push({
      id: `due-${obligation.id}`,
      tone: "due",
      title: "Due soon",
      body: `${obligation.title} · ${categoryMeta(obligation.category).name}`,
      href: "/app/obligations",
      timeLabel: obligation.nextDueAt
        ? new Date(obligation.nextDueAt).toLocaleDateString("en-GB")
        : undefined,
    });
  }

  for (const obligation of obligations.filter((item) => item.status === "evidence_gap").slice(0, 3)) {
    items.push({
      id: `gap-${obligation.id}`,
      tone: "gap",
      title: "Evidence gap",
      body: `${obligation.title} — upload ${obligation.evidence || "evidence"}`,
      href: "/app/vault",
    });
  }

  for (const invite of invites.filter((item) => item.status === "pending" || item.status === "sent")) {
    items.push({
      id: `invite-${invite.id}`,
      tone: "brand",
      title: "Team invite pending",
      body: `${invite.email} · ${invite.role.replace(/_/g, " ")}`,
      href: "/app/team",
    });
  }

  const recent = logs[0];
  if (recent && withinDays(recent.createdAt, 1)) {
    items.push({
      id: `log-${recent.id}`,
      tone: "ok",
      title: "Latest logbook activity",
      body: `${recent.type} at ${recent.site.name}`,
      href: "/app/logbook",
      timeLabel: new Date(recent.createdAt).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  }

  return items.slice(0, 12);
}

export function notificationToneClass(tone: AppNotification["tone"]) {
  const map = {
    over: "bg-over-050 text-over-500",
    due: "bg-due-050 text-due-500",
    gap: "bg-gap-050 text-gap-500",
    brand: "bg-brand-050 text-brand-500",
    ok: "bg-ok-050 text-ok-500",
  };
  return map[tone];
}
