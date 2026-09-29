import type { Obligation } from "@/lib/api";
import { categoryMeta, statusLabel } from "@/lib/compliance";

export type ShareMethod = "email" | "link" | "badge";

export type ScopeItem = {
  id: string;
  emoji: string;
  name: string;
  description: string;
  locked?: boolean;
  private?: boolean;
  defaultOn?: boolean;
  categories?: string[];
  allRegister?: boolean;
};

export const SHARE_SCOPE_ITEMS: ScopeItem[] = [
  {
    id: "status",
    emoji: "✅",
    name: "Overall compliance status & coverage",
    description: "Your headline verified status and coverage percentage.",
    locked: true,
  },
  {
    id: "food",
    emoji: "🍽️",
    name: "Food safety & hygiene",
    description: "Food hygiene duties, temperature checks and allergen controls.",
    defaultOn: true,
    categories: ["food"],
  },
  {
    id: "fire",
    emoji: "🔥",
    name: "Fire safety",
    description: "Fire risk assessments, alarms and extinguisher servicing.",
    categories: ["fire"],
  },
  {
    id: "hs",
    emoji: "🦺",
    name: "Health & Safety",
    description: "Policies, risk assessments and incident readiness.",
    defaultOn: true,
    categories: ["hs", "construction"],
  },
  {
    id: "licence",
    emoji: "📜",
    name: "Licensing",
    description: "Premises licence, alcohol and age-restricted sales.",
    defaultOn: true,
    categories: ["licence"],
  },
  {
    id: "employ",
    emoji: "👥",
    name: "Employment & insurance",
    description: "Right-to-work, contracts and liability cover.",
    defaultOn: true,
    categories: ["employ"],
  },
  {
    id: "register",
    emoji: "📋",
    name: "Full obligation register",
    description: "Your complete list of duties and their live status.",
    allRegister: true,
  },
  {
    id: "logbook",
    emoji: "📓",
    name: "Incident & logbook history",
    description: "Internal records — never shareable externally.",
    private: true,
  },
];

export function defaultScopeSelection(): Record<string, boolean> {
  return Object.fromEntries(
    SHARE_SCOPE_ITEMS.map((item) => [item.id, Boolean(item.locked || item.defaultOn)]),
  );
}

export function obligationsForScope(
  selection: Record<string, boolean>,
  obligations: Obligation[],
): Obligation[] {
  const picked = new Set<string>();

  if (selection.register) {
    for (const item of obligations) picked.add(item.id);
  } else {
    for (const scope of SHARE_SCOPE_ITEMS) {
      if (!selection[scope.id] || scope.private || scope.locked || !scope.categories) continue;
      for (const item of obligations) {
        if (scope.categories.includes(item.category)) picked.add(item.id);
      }
    }
  }

  if (picked.size === 0) {
    for (const item of obligations) picked.add(item.id);
  }

  return obligations.filter((item) => picked.has(item.id));
}

export type PreviewRow = {
  id: string;
  emoji: string;
  title: string;
  meta: string;
  badge: string;
  tone: "ok" | "due" | "over" | "gap" | "brand";
};

function toneForStatus(status: string): PreviewRow["tone"] {
  if (status === "on_track") return "ok";
  if (status === "due_soon") return "due";
  if (status === "overdue") return "over";
  return "gap";
}

function badgeForStatus(status: string): string {
  if (status === "on_track") return "Verified";
  if (status === "due_soon") return "Due soon";
  if (status === "overdue") return "Overdue";
  return "Evidence gap";
}

export function previewRows(
  selection: Record<string, boolean>,
  obligations: Obligation[],
  coverage: number,
): PreviewRow[] {
  const rows: PreviewRow[] = [
    {
      id: "status",
      emoji: "✅",
      title: "Compliance verified",
      meta: `${coverage}% of shared duties covered · monitored live`,
      badge: coverage >= 80 ? "Verified" : "In review",
      tone: coverage >= 80 ? "ok" : "due",
    },
  ];

  const shared = obligationsForScope(selection, obligations);
  const byCategory = new Map<string, Obligation[]>();
  for (const item of shared) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  for (const scope of SHARE_SCOPE_ITEMS) {
    if (!selection[scope.id] || scope.private || scope.locked || scope.allRegister) continue;
    const cats = scope.categories ?? [];
    const items = shared.filter((item) => cats.includes(item.category));
    if (items.length === 0) continue;

    const worst =
      items.find((item) => item.status === "overdue") ??
      items.find((item) => item.status === "due_soon") ??
      items.find((item) => item.status === "evidence_gap") ??
      items[0];
    const cat = categoryMeta(worst.category);

    rows.push({
      id: scope.id,
      emoji: scope.emoji,
      title: scope.name,
      meta: `${items.length} ${items.length === 1 ? "duty" : "duties"} · ${worst.title}`,
      badge: badgeForStatus(worst.status),
      tone: toneForStatus(worst.status),
    });
  }

  if (selection.register) {
    rows.push({
      id: "register",
      emoji: "📋",
      title: "Full obligation register",
      meta: `${shared.length} duties with live status`,
      badge: "Included",
      tone: "brand",
    });
  }

  return rows;
}

export function coverageFor(obligations: Obligation[]) {
  if (obligations.length === 0) return 0;
  const ok = obligations.filter((item) => item.status === "on_track").length;
  return Math.round((ok / obligations.length) * 100);
}

export function statusSummary(obligations: Obligation[]) {
  const shared = obligations;
  const worst =
    shared.find((item) => item.status === "overdue") ??
    shared.find((item) => item.status === "due_soon") ??
    shared.find((item) => item.status === "evidence_gap");
  return worst ? statusLabel(worst.status) : "On track";
}
