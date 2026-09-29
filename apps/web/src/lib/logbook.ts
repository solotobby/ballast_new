import { LOG_TYPES } from "@ballast/domain";
import type { LogEntry, Obligation, Organisation } from "@/lib/api";
import { categoryMeta } from "@/lib/compliance";

export type LogbookTimeFilter = "all" | "7d" | "30d";

export function logbookSubtitle(org: Organisation, items: LogEntry[]): string {
  const sites = org.sites.length || org.siteCount;
  if (items.length === 0) {
    return `Structured checks captured on site across ${sites} site${sites === 1 ? "" : "s"} — log fridge checks, inspections and incidents to close evidence gaps.`;
  }
  const linked = items.filter((item) => item.obligation).length;
  const today = items.filter((item) => withinDays(item.createdAt, 1)).length;
  if (today > 0) {
    return `${today} ${today === 1 ? "entry" : "entries"} logged today · ${linked} linked to obligations on your register.`;
  }
  return `${items.length} ${items.length === 1 ? "entry" : "entries"} on record · ${linked} linked to obligations across ${sites} site${sites === 1 ? "" : "s"}.`;
}

export function logbookStats(items: LogEntry[]) {
  const today = items.filter((item) => withinDays(item.createdAt, 1)).length;
  const linked = items.filter((item) => item.obligation).length;
  const attachments = items.filter((item) => item.evidence.length > 0).length;

  return {
    total: items.length,
    today,
    linked,
    attachments,
  };
}

export function logbookCategoryFilters(items: LogEntry[]): string[] {
  const fromItems = [...new Set(items.map((item) => item.category))];
  if (fromItems.length > 0) return fromItems;
  return [...new Set(LOG_TYPES.map((item) => item.category))];
}

export function filterLogEntries(
  items: LogEntry[],
  category: string,
  siteId: string,
  time: LogbookTimeFilter,
): LogEntry[] {
  return items.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (siteId !== "all" && item.site.id !== siteId) return false;
    if (time === "7d" && !withinDays(item.createdAt, 7)) return false;
    if (time === "30d" && !withinDays(item.createdAt, 30)) return false;
    return true;
  });
}

export function suggestedObligations(obligations: Obligation[], category: string) {
  const matched = obligations.filter((item) => item.category === category);
  return matched.length > 0 ? matched : obligations;
}

function withinDays(iso: string, days: number) {
  return Date.now() - new Date(iso).getTime() <= days * 24 * 60 * 60 * 1000;
}

export function emptyLogbookMessage(
  items: LogEntry[],
  category: string,
  siteId: string,
  time: LogbookTimeFilter,
): { title: string; message: string; actionLabel?: string } {
  if (items.length === 0) {
    return {
      title: "No logbook entries yet",
      message: "Log a fridge check, site inspection or incident to start building your operational record.",
      actionLabel: "Log first entry",
    };
  }

  const parts: string[] = [];
  if (category !== "all") parts.push(categoryMeta(category).name.toLowerCase());
  if (siteId !== "all") parts.push("this site");
  if (time === "7d") parts.push("the last 7 days");
  if (time === "30d") parts.push("the last 30 days");

  const scope = parts.length > 0 ? parts.join(" · ") : "this filter";
  return {
    title: "No entries match",
    message: `Nothing logged for ${scope}. Try a different filter or record a new entry.`,
    actionLabel: "New entry",
  };
}
