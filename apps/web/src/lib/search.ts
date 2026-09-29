import type { EvidenceRecord, LogEntry, Obligation } from "@/lib/api";
import { categoryMeta, statusLabel } from "@/lib/compliance";

export type SearchResult = {
  id: string;
  kind: "obligation" | "evidence" | "log";
  title: string;
  subtitle: string;
  href: string;
};

const KIND_LABEL = {
  obligation: "Obligation",
  evidence: "Evidence",
  log: "Logbook",
};

export function kindLabel(kind: SearchResult["kind"]) {
  return KIND_LABEL[kind];
}

function matches(query: string, ...parts: (string | null | undefined)[]) {
  return parts.some((part) => part?.toLowerCase().includes(query));
}

export function searchApp(
  query: string,
  obligations: Obligation[],
  evidence: EvidenceRecord[],
  logs: LogEntry[],
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const results: SearchResult[] = [];

  for (const item of obligations) {
    if (
      matches(q, item.title, item.definitionId, item.category, item.basis, item.evidence, item.aiWhy ?? undefined)
    ) {
      results.push({
        id: item.id,
        kind: "obligation",
        title: item.title,
        subtitle: `${categoryMeta(item.category).name} · ${statusLabel(item.status)}`,
        href: `/app/obligations?q=${encodeURIComponent(q)}`,
      });
    }
  }

  for (const item of evidence) {
    if (matches(q, item.name, item.obligation?.title, item.createdByName, item.site?.name)) {
      results.push({
        id: item.id,
        kind: "evidence",
        title: item.name,
        subtitle: item.obligation?.title ?? "Unlinked evidence",
        href: `/app/vault?q=${encodeURIComponent(q)}`,
      });
    }
  }

  for (const item of logs) {
    if (
      matches(
        q,
        item.type,
        item.description,
        item.category,
        item.createdByName,
        item.site.name,
        item.obligation?.title,
      )
    ) {
      results.push({
        id: item.id,
        kind: "log",
        title: item.type,
        subtitle: `${item.site.name} · ${item.description.slice(0, 60)}${item.description.length > 60 ? "…" : ""}`,
        href: `/app/logbook?q=${encodeURIComponent(q)}`,
      });
    }
  }

  return results.slice(0, 8);
}

export function filterByQuery<T>(items: T[], query: string | null, pick: (item: T) => string[]): T[] {
  const q = query?.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => pick(item).some((value) => value.toLowerCase().includes(q)));
}
