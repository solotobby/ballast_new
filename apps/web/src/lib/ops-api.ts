export class OpsApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function opsApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/ops${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as { message?: string | string[] } & T) : ({} as T);
  if (!response.ok) {
    const message = Array.isArray((data as { message?: string[] }).message)
      ? ((data as { message: string[] }).message[0] ?? "Request failed")
      : ((data as { message?: string }).message ?? "Request failed");
    throw new OpsApiError(response.status, message);
  }
  return data;
}

export type OpsSession = { username: string; role: "ops" };

export type OpsTenant = {
  id: string;
  name: string;
  sector: string | null;
  sectorLabel: string;
  sectorEmoji: string;
  sites: number;
  seats: number;
  plan: string;
  coverage: number;
  status: "healthy" | "at-risk" | "overdue";
  obligations: number;
  flags: number;
  storage: string;
  storageBytes: number;
  joined: string;
  health: string;
  onboardingStep: string;
};

export type OpsFlag = {
  id: string;
  tenantId: string;
  tenantName: string;
  sector: string | null;
  title: string;
  basis: string;
  source: string;
  confidence: string | null;
  reason: string;
  when: string;
  priority: string;
};

export type OpsAiItem = {
  id: string;
  tenantId: string;
  tenantName: string;
  sector: string | null;
  title: string;
  kind: string;
  confidence: string;
  status: string;
  when: string;
  basis: string;
  note: string;
};

export type OpsOverview = {
  tenantCount: number;
  siteCount: number;
  obligationCount: number;
  flagCount: number;
  aiPendingCount: number;
  health: Record<string, number>;
  attentionTenants: OpsTenant[];
  sectorMix: { id: string; emoji: string; name: string; count: number }[];
  queues: { flags: number; ai: number; draftRules: number };
};

export type OpsRules = {
  packs: {
    id: string;
    name: string;
    sector: string;
    version: string;
    obligations: number;
    status: string;
    updated: string;
    by: string;
    source: string;
  }[];
  totalObligations: number;
  draftCount: number;
};

export type OpsVaults = {
  totalBytesLabel: string;
  tenantVaults: { id: string; name: string; sector: string | null; storage: string; storageBytes: number }[];
  accessLog: { who: string; role: string; act: string; object: string; tenantName: string; when: string; reason: string }[];
  scanCount: number;
};

export type OpsHealth = {
  checks24h: number;
  successRate: number;
  retried: number;
  queueDepth: number;
  jobs: { name: string; status: string; pct: number; sub: string }[];
};

export type OpsAudit = {
  events: { id: string; tone: string; title: string; meta: string; when: string }[];
  eventCount24h: number;
  shareCount24h: number;
  securityEvents: number;
};

export type OpsCrawlItem = {
  id: string;
  status: string;
  itemsFound: number;
  itemsNew: number;
  rawSnippet?: string | null;
  extractedItems?: string[] | null;
  durationMs: number | null;
  errorLog: string | null;
  createdAt: string;
};

export type OpsScraperSource = {
  id: string;
  code: string;
  name: string;
  portalUrl: string;
  frequency: string;
  sector: string;
  status: string;
  rulesCount: number;
  lastCrawlAt: string | null;
  crawls: OpsCrawlItem[];
};

export type OpsScrapers = {
  sources: OpsScraperSource[];
  totalRulesMapped: number;
  totalCrawls: number;
};

export type CreateRegulatorySourceInput = {
  name: string;
  portalUrl: string;
  sector?: string;
  frequency?: string;
  code?: string;
};

export type OpsCrawlResult = {
  ok: boolean;
  count: number;
  succeeded: number;
  failed: number;
  results: {
    source: { id: string; code: string; name: string };
    status: string;
    itemsFound: number;
    itemsNew: number;
    durationMs: number;
    error?: string;
  }[];
};

export type UrlValidationResult = {
  valid: boolean;
  reachable: boolean;
  statusCode: number;
  durationMs: number;
  normalizedUrl: string;
  hostname: string;
  message: string;
};

export type UpdateRegulatorySourceInput = {
  name?: string;
  portalUrl?: string;
  sector?: string;
  frequency?: string;
  status?: string;
};

export const opsClient = {
  me: () => opsApi<{ session: OpsSession | null }>("/me"),
  signIn: (username: string, password: string) =>
    opsApi<{ session: OpsSession }>("/sign-in", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  signOut: () => opsApi<{ ok: boolean }>("/sign-out", { method: "POST" }),
  overview: () => opsApi<OpsOverview>("/overview"),
  tenants: () => opsApi<OpsTenant[]>("/tenants"),
  tenant: (id: string) =>
    opsApi<{ tenant: OpsTenant; flags: OpsFlag[]; ai: OpsAiItem[] }>(`/tenants/${id}`),
  flags: () => opsApi<OpsFlag[]>("/flags"),
  resolveFlag: (id: string, action: "uphold" | "reject") =>
    opsApi<{ ok: boolean }>(`/flags/${id}`, { method: "PATCH", body: JSON.stringify({ action }) }),
  ai: () => opsApi<OpsAiItem[]>("/ai"),
  rules: () => opsApi<OpsRules>("/rules"),
  vaults: () => opsApi<OpsVaults>("/vaults"),
  health: () => opsApi<OpsHealth>("/health"),
  audit: () => opsApi<OpsAudit>("/audit"),
  search: (q: string) =>
    opsApi<{ results: { id: string; kind: string; title: string; subtitle: string }[] }>(
      `/search?q=${encodeURIComponent(q)}`,
    ),
  scrapers: () => opsApi<OpsScrapers>("/scrapers"),
  scraperDetails: (id: string) =>
    opsApi<{ source: OpsScraperSource; crawls: OpsCrawlItem[] }>(`/scrapers/${id}`),
  validateUrl: (url: string) =>
    opsApi<UrlValidationResult>("/scrapers/validate-url", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),
  createRegulatorySource: (input: CreateRegulatorySourceInput) =>
    opsApi<OpsScraperSource>("/scrapers", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateRegulatorySource: (id: string, input: UpdateRegulatorySourceInput) =>
    opsApi<OpsScraperSource>(`/scrapers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  triggerCrawl: (code: string) =>
    opsApi<OpsCrawlResult>("/scrapers/crawl", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
};



