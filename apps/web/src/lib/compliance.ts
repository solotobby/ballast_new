import { SECTORS, type Sector } from "@ballast/domain";
import type { Obligation, Organisation } from "@/lib/api";

export const CATEGORIES: Record<string, { name: string; emoji: string; bg: string; color: string }> = {
  food: { name: "Food Safety & Hygiene", emoji: "🍽️", bg: "bg-due-050", color: "#d9910a" },
  fire: { name: "Fire Safety", emoji: "🔥", bg: "bg-over-050", color: "#d64545" },
  hs: { name: "Health & Safety", emoji: "🦺", bg: "bg-brand-050", color: "#1f6feb" },
  licence: { name: "Licensing", emoji: "📜", bg: "bg-gap-050", color: "#7b5bd6" },
  employ: { name: "Employment", emoji: "👥", bg: "bg-teal-050", color: "#0f9e8e" },
  data: { name: "Data & Cyber", emoji: "🔒", bg: "bg-canvas-2", color: "#475467" },
  care: { name: "Care & safeguarding", emoji: "🧑‍⚕️", bg: "bg-brand-050", color: "#1f6feb" },
  construction: { name: "Construction & CDM", emoji: "🏗️", bg: "bg-due-050", color: "#d9910a" },
  property: { name: "Property & facilities", emoji: "🏢", bg: "bg-canvas-2", color: "#475467" },
  other: { name: "Other duties", emoji: "•", bg: "bg-canvas-2", color: "#667085" },
};

export function categoryMeta(id: string) {
  return CATEGORIES[id] ?? { name: id, emoji: "•", bg: "bg-canvas-2", color: "#667085" };
}

export function statusTone(status: string): "ok" | "due" | "over" | "gap" {
  if (status === "on_track") return "ok";
  if (status === "due_soon") return "due";
  if (status === "overdue") return "over";
  return "gap";
}

export function statusLabel(status: string): string {
  if (status === "on_track") return "On track";
  if (status === "due_soon") return "Due soon";
  if (status === "overdue") return "Overdue";
  return "Evidence gap";
}

export function countByStatus(items: Obligation[]) {
  return {
    ok: items.filter((item) => item.status === "on_track").length,
    due: items.filter((item) => item.status === "due_soon").length,
    over: items.filter((item) => item.status === "overdue").length,
    gap: items.filter((item) => item.status === "evidence_gap").length,
  };
}

export function coverageByCategory(items: Obligation[]) {
  const groups = new Map<string, { total: number; ok: number }>();
  for (const item of items) {
    const current = groups.get(item.category) ?? { total: 0, ok: 0 };
    current.total += 1;
    if (item.status === "on_track") current.ok += 1;
    groups.set(item.category, current);
  }
  return [...groups.entries()].map(([id, stats]) => ({
    id,
    ...categoryMeta(id),
    ...stats,
    pct: stats.total === 0 ? 0 : Math.round((stats.ok / stats.total) * 100),
  }));
}

export function sectorLabel(sector: string | null): string {
  return SECTORS.find((item) => item.id === sector)?.label ?? "your sector";
}

export function sectorEmoji(sector: string | null): string {
  return SECTORS.find((item) => item.id === sector)?.emoji ?? "•";
}

export function greetingName(name: string | null, email: string): string {
  if (name?.trim()) return name.trim().split(" ")[0] ?? name;
  const local = email.split("@")[0] ?? "there";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function timeOfDay(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function sectorStory(org: Organisation) {
  const sector = (org.sector ?? "") as Sector | "";
  const sites = org.siteCount === 1 ? "your site" : `your ${org.siteCount} sites`;
  const label = sectorLabel(org.sector);

  const stories: Record<string, { headline: string; sub: string; focus: string }> = {
    hospitality: {
      headline: `Here’s where ${org.name} stands`,
      sub: `Food, fire, licensing and employment duties across ${sites} — generated from your hospitality profile.`,
      focus: "Food hygiene, fire and premises licensing",
    },
    construction: {
      headline: `Site duties for ${org.name}`,
      sub: `CDM, HSE and trade-specific obligations across ${sites} — scoped to the works you said apply.`,
      focus: "CDM, working at height and competency",
    },
    care: {
      headline: `Safeguarding picture for ${org.name}`,
      sub: `CQC, Ofsted/EYFS and workforce duties across ${sites} — only what follows from this care setting.`,
      focus: "Regulation, medication and safeguarding",
    },
    retail: {
      headline: `Licensed retail status for ${org.name}`,
      sub: `Age-restricted sales, premises conditions and employment duties across ${sites}.`,
      focus: "Challenge 25, licensing and payments",
    },
    property: {
      headline: `Facilities duties for ${org.name}`,
      sub: `Fire, asbestos, gas and communal-systems obligations across ${sites}.`,
      focus: "Fire strategy, asbestos and gas safety",
    },
  };

  return (
    stories[sector] ?? {
      headline: `Compliance status for ${org.name}`,
      sub: `A live duty set for ${label.toLowerCase()} across ${sites}.`,
      focus: label,
    }
  );
}

export function siteScopeLabel(org: Organisation): string {
  if (org.siteCount <= 1) return "your site";
  if (org.sites.length >= 2) {
    const names = org.sites.slice(0, 2).map((site) => site.name);
    return `${names.join(" and ")}${org.siteCount > 2 ? ` and ${org.siteCount - 2} more` : ""}`;
  }
  return `your ${org.siteCount} sites`;
}

export function dashboardSubtitle(org: Organisation, items: Obligation[]): string {
  const scope = siteScopeLabel(org);
  if (items.length === 0) {
    return `Set up ${org.name}'s duty register to see live coverage across ${scope}.`;
  }

  const pending = items.filter((item) => item.reviewState === "pending").length;
  const attention = items.filter(
    (item) => item.reviewState === "pending" || item.status !== "on_track",
  ).length;

  if (pending > 0) {
    return `${pending} ${pending === 1 ? "duty needs" : "duties need"} your confirmation before the register goes live.`;
  }
  if (attention === 1) {
    return `Here's where ${org.name} stands right now across ${scope}. One item needs your attention.`;
  }
  if (attention > 1) {
    return `Here's where ${org.name} stands across ${scope}. ${attention} items need attention.`;
  }
  return `Here's where ${org.name} stands right now across ${scope}. Everything on the register is on track.`;
}

export function dashboardStatHints(items: Obligation[]) {
  const counts = countByStatus(items);
  const due = items.find((item) => item.status === "due_soon");
  const over = items.find((item) => item.status === "overdue");
  const gaps = items.filter((item) => item.status === "evidence_gap");

  const gapHint =
    gaps.length === 0
      ? "Vault is complete"
      : gaps.length === 1
        ? gaps[0]!.title
        : `${gaps[0]!.title}, +${gaps.length - 1} more`;

  return {
    ok: counts.ok ? `${counts.ok} with evidence on file` : "Nothing covered yet",
    due: due
      ? `Next: ${due.title}${due.nextDueAt ? ` · ${new Date(due.nextDueAt).toLocaleDateString("en-GB")}` : ""}`
      : "No upcoming deadlines",
    over: over ? over.title : "Nothing overdue",
    gap: gapHint,
  };
}

export function intelligenceFor(org: Organisation, items: Obligation[]) {
  const pending = items.filter((item) => item.reviewState === "pending").length;
  const flagged = items.filter((item) => item.reviewState === "flagged").length;
  const gaps = items.filter((item) => item.status === "evidence_gap");
  const activities = org.activities.slice(0, 3).join(", ");
  const story = sectorStory(org);
  const topGap = gaps[0];

  if (items.length === 0) {
    return {
      body: `Your ${sectorLabel(org.sector).toLowerCase()} duty register is empty. Ballast builds it from the activities and sites on your profile — nothing is treated as fact until you confirm it.`,
      rec: "Generate your duty set from the review step, then confirm or flag each obligation.",
      source: `Profile · ${org.activities.length} activities · ${org.siteCount} sites`,
    };
  }

  if (pending > 0) {
    return {
      body: `${pending} ${sectorLabel(org.sector).toLowerCase()} duties were generated from this profile and still need an owner to confirm or flag them. Ballast will not treat them as fact until you do.`,
      rec: `Review the register first — especially anything tied to ${activities || story.focus}.`,
      source: `Profile · ${org.activities.length} activities selected · ${items.length} duties`,
    };
  }

  if (flagged > 0) {
    return {
      body: `${flagged} ${flagged === 1 ? "duty was" : "duties were"} flagged as possibly wrong for ${org.name}. Those stay out of the live register until Ballast ops reviews them.`,
      rec: "Add a note on the next flag if the legal basis does not match how you actually operate.",
      source: `Owner flags · ${sectorLabel(org.sector)}`,
    };
  }

  if (topGap) {
    return {
      body: `The register is live for ${sectorLabel(org.sector).toLowerCase()}, but ${gaps.length} ${gaps.length === 1 ? "duty still has" : "duties still have"} no evidence. First gap: ${topGap.title}.`,
      rec: `Upload ${topGap.evidence} to start closing ${story.focus.toLowerCase()}.`,
      source: `${topGap.definitionId} · ${topGap.basis}`,
    };
  }

  return {
    body: `${org.name} has a ${sectorLabel(org.sector).toLowerCase()} duty set with nothing outstanding in the register right now.`,
    rec: "Keep logging checks so coverage stays current as the profile changes.",
    source: `${items.length} duties · ${sectorLabel(org.sector)}`,
  };
}
