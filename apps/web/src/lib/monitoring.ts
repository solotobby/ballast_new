import type { LogEntry, Obligation, Organisation } from "@/lib/api";
import { categoryMeta } from "@/lib/compliance";

export type MonitoringInsight = {
  id: string;
  severity: "over" | "due";
  title: string;
  meta: string;
  body: string;
  rootLabel: string;
  rootBody: string;
  confidence: "High" | "Medium";
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
};

type LogPattern = {
  siteId: string;
  siteName: string;
  type: string;
  category: string;
  count: number;
  entries: LogEntry[];
};

const PATTERN_WINDOW_DAYS = 30;

function withinDays(iso: string, days: number) {
  return Date.now() - new Date(iso).getTime() <= days * 24 * 60 * 60 * 1000;
}

function detectLogPatterns(logs: LogEntry[]): LogPattern[] {
  const recent = logs.filter((log) => withinDays(log.createdAt, PATTERN_WINDOW_DAYS));
  const groups = new Map<string, LogEntry[]>();

  for (const log of recent) {
    const key = `${log.site.id}|${log.type.trim().toLowerCase()}|${log.category}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(log);
    groups.set(key, bucket);
  }

  return [...groups.values()]
    .filter((entries) => entries.length >= 2)
    .map((entries) => {
      const sorted = [...entries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const latest = sorted[0]!;
      return {
        siteId: latest.site.id,
        siteName: latest.site.name,
        type: latest.type,
        category: latest.category,
        count: sorted.length,
        entries: sorted,
      };
    })
    .sort((a, b) => b.count - a.count);
}

function patternInsight(pattern: LogPattern): MonitoringInsight {
  const linked = pattern.entries.find((entry) => entry.obligation)?.obligation;
  const cat = categoryMeta(pattern.category);
  const severity = pattern.count >= 3 ? "over" : "due";
  const latest = pattern.entries[0]!;

  return {
    id: `pattern-${pattern.siteId}-${pattern.type}`,
    severity,
    title: `Recurring “${pattern.type}” at ${pattern.siteName}`,
    meta: `${pattern.count} logbook entries in ${PATTERN_WINDOW_DAYS} days · ${cat.name}${linked ? ` · ${linked.title}` : ""}`,
    body: `The same log type has been recorded ${pattern.count} times at ${pattern.siteName}. Latest entry: “${latest.description.slice(0, 160)}${latest.description.length > 160 ? "…" : ""}”`,
    rootLabel: "Pattern summary",
    rootBody: pattern.entries
      .slice(0, 4)
      .map((entry) => {
        const when = new Date(entry.createdAt).toLocaleDateString("en-GB");
        return `${when}: ${entry.description.slice(0, 100)}${entry.description.length > 100 ? "…" : ""}`;
      })
      .join(" · "),
    confidence: pattern.count >= 3 ? "High" : "Medium",
    primaryHref: linked ? "/app/obligations" : "/app/logbook",
    primaryLabel: linked ? "View obligation" : "Open logbook",
    secondaryHref: "/app/logbook",
    secondaryLabel: "View logbook trail",
  };
}

function overdueInsight(obligation: Obligation): MonitoringInsight {
  const cat = categoryMeta(obligation.category);
  return {
    id: `overdue-${obligation.id}`,
    severity: "over",
    title: `${obligation.title} is overdue`,
    meta: `${cat.name} · ${obligation.cadence}${obligation.nextDueAt ? ` · due ${new Date(obligation.nextDueAt).toLocaleDateString("en-GB")}` : ""}`,
    body: `This duty on your register is past its monitoring threshold.${obligation.evidence ? ` Expected evidence: ${obligation.evidence}.` : ""}`,
    rootLabel: "Recommended action",
    rootBody:
      obligation.aiWhy ??
      "Complete the required check or upload evidence in the vault to bring this obligation back on track.",
    confidence: "High",
    primaryHref: "/app/obligations",
    primaryLabel: "Update in register",
    secondaryHref: "/app/vault",
    secondaryLabel: "Upload evidence",
  };
}

function categoryGapInsight(category: string, obligations: Obligation[]): MonitoringInsight | null {
  if (obligations.length < 2) return null;
  const cat = categoryMeta(category);
  return {
    id: `gap-cluster-${category}`,
    severity: "due",
    title: `${cat.name} evidence gaps clustering`,
    meta: `${obligations.length} duties missing evidence · ${cat.name}`,
    body: `Multiple ${cat.name.toLowerCase()} obligations still have no linked evidence: ${obligations
      .slice(0, 3)
      .map((item) => item.title)
      .join(", ")}${obligations.length > 3 ? ` and ${obligations.length - 3} more` : ""}.`,
    rootLabel: "Recommended action",
    rootBody: `Upload evidence for ${obligations[0]!.evidence || obligations[0]!.title} first — closing one gap often unlocks the rest of this category.`,
    confidence: "Medium",
    primaryHref: "/app/vault",
    primaryLabel: "Upload evidence",
    secondaryHref: "/app/obligations",
    secondaryLabel: "View obligations",
  };
}

export function buildMonitoringInsights(
  obligations: Obligation[],
  logs: LogEntry[],
): MonitoringInsight[] {
  const insights: MonitoringInsight[] = [];

  for (const pattern of detectLogPatterns(logs)) {
    insights.push(patternInsight(pattern));
  }

  for (const obligation of obligations.filter((item) => item.status === "overdue")) {
    insights.push(overdueInsight(obligation));
  }

  const gapByCategory = new Map<string, Obligation[]>();
  for (const obligation of obligations.filter((item) => item.status === "evidence_gap")) {
    const bucket = gapByCategory.get(obligation.category) ?? [];
    bucket.push(obligation);
    gapByCategory.set(obligation.category, bucket);
  }
  for (const [category, grouped] of gapByCategory) {
    const insight = categoryGapInsight(category, grouped);
    if (insight) insights.push(insight);
  }

  const severityRank = { over: 0, due: 1 };
  return insights
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || a.title.localeCompare(b.title))
    .slice(0, 6);
}

export function monitoringStats(obligations: Obligation[], logs: LogEntry[], insights: MonitoringInsight[]) {
  const logsToday = logs.filter((log) => withinDays(log.createdAt, 1)).length;
  const watched = obligations.length;
  const resolved = obligations.filter((item) => item.status === "on_track" && item.lastEvidenceAt).length;
  const attention = obligations.filter(
    (item) => item.status === "overdue" || item.status === "due_soon" || item.status === "evidence_gap",
  ).length;

  let checksHint = "Add a duty register to start monitoring";
  if (watched > 0 && attention === 0) checksHint = "All obligations scanned — nothing flagged";
  else if (watched > 0 && attention > 0) checksHint = `${attention} obligation${attention === 1 ? "" : "s"} need attention`;

  const patternsHint =
    insights.length > 0 ? "Root-cause analysis from your logbook" : "No recurring patterns in the last 30 days";

  const resolvedHint =
    resolved > 0
      ? `${resolved} cleared with evidence on file`
      : logsToday > 0
        ? `${logsToday} log${logsToday === 1 ? "" : "s"} recorded today`
        : "Upload evidence to close gaps";

  return {
    watched,
    patterns: insights.length,
    resolved,
    logsToday,
    attention,
    checksHint,
    patternsHint,
    resolvedHint,
  };
}

export function monitoringStatusLabel(org: Organisation, obligations: Obligation[], logs: LogEntry[]) {
  if (obligations.length === 0) {
    return { tone: "neutral" as const, label: "Waiting for duty register" };
  }
  const latestLog = logs[0]?.createdAt;
  if (latestLog) {
    const when = new Date(latestLog).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    return { tone: "ok" as const, label: `Monitoring live · last activity ${when}` };
  }
  return {
    tone: "ok" as const,
    label: `Monitoring live · ${obligations.length} obligation${obligations.length === 1 ? "" : "s"} watched`,
  };
}

export function monitoringFooter(org: Organisation, obligations: Obligation[], logs: LogEntry[]) {
  const sites = org.sites.length || org.siteCount;
  if (obligations.length === 0) {
    return "Generate your obligation register to start continuous monitoring across your sites.";
  }
  if (logs.length === 0) {
    return `Monitoring ${obligations.length} ${obligations.length === 1 ? "duty" : "duties"} across ${sites} site${sites === 1 ? "" : "s"}. Log operational checks to unlock recurrence detection.`;
  }
  return `Continuous monitoring runs across ${sites} site${sites === 1 ? "" : "s"} for ${obligations.length} ${obligations.length === 1 ? "duty" : "duties"} — ${logs.length} logbook ${logs.length === 1 ? "entry" : "entries"} on record.`;
}
