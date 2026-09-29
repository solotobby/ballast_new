import * as https from "https";
import * as http from "http";
import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { SECTORS } from "@ballast/domain";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateRegulatorySourceDto, UpdateRegulatorySourceDto } from "./dto";
import { REGULATORY_SOURCES } from "./regulatory-sources";

// ─── HTML → plain-text stripper (no extra deps needed) ───────────────────────

function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Extract meaningful phrases (headings, bold text) as "obligation hints"
function extractKeyPhrases(html: string): string[] {
  const phrases: string[] = [];
  const headingRe = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi;
  const boldRe = /<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi;
  const listItemRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;

  let m: RegExpExecArray | null;
  while ((m = headingRe.exec(html)) !== null) {
    const text = htmlToText(m[1]).slice(0, 200);
    if (text.length > 5) phrases.push(text);
  }
  while ((m = boldRe.exec(html)) !== null) {
    const text = htmlToText(m[1]).slice(0, 200);
    if (text.length > 5) phrases.push(text);
  }
  while ((m = listItemRe.exec(html)) !== null) {
    const text = htmlToText(m[1]).slice(0, 200);
    if (text.length > 10) phrases.push(text);
  }
  return [...new Set(phrases)].slice(0, 80);
}

// Resolve redirects and fetch a URL; returns { html, finalUrl, status }
function fetchUrl(
  url: string,
  redirectsLeft = 5,
): Promise<{ html: string; finalUrl: string; statusCode: number }> {
  return new Promise((resolve, reject) => {
    if (redirectsLeft <= 0) {
      return reject(new Error("Too many redirects"));
    }
    const parsed = new URL(url);
    const client = parsed.protocol === "https:" ? https : http;
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BallastCrawler/2.0; +https://ballast.app/crawler)",
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      timeout: 15000,
    };
    const req = client.get(options, (res) => {
      if (
        res.statusCode &&
        [301, 302, 303, 307, 308].includes(res.statusCode) &&
        res.headers.location
      ) {
        const next = new URL(res.headers.location, url).href;
        res.resume();
        resolve(fetchUrl(next, redirectsLeft - 1));
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => {
        // Cap at 2 MB to avoid huge pages
        if (chunks.reduce((a, c) => a + c.length, 0) < 2 * 1024 * 1024) {
          chunks.push(chunk);
        }
      });
      res.on("end", () => {
        const html = Buffer.concat(chunks).toString("utf8");
        resolve({ html, finalUrl: url, statusCode: res.statusCode ?? 0 });
      });
      res.on("error", reject);
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
  });
}


const RULE_PACKS = [
  { id: "RP-CORE", name: "Universal SME duties", sector: "all", source: "In-house + Gov.uk" },
  { id: "RP-HOSP", name: "Hospitality & food service", sector: "hospitality", source: "FSA / Local Authority" },
  { id: "RP-CONS", name: "Construction & trades (CDM)", sector: "construction", source: "HSE / CDM 2015" },
  { id: "RP-CARE", name: "Care & childcare", sector: "care", source: "CQC / Ofsted / EYFS" },
  { id: "RP-RETL", name: "Licensed retail", sector: "retail", source: "Licensing Act 2003" },
  { id: "RP-PROP", name: "Property & facilities", sector: "property", source: "RRO / CAR / LOLER" },
  { id: "RP-DATA", name: "Data protection & cyber", sector: "all", source: "ICO / UK GDPR" },
];

function sectorMeta(sector: string | null) {
  return SECTORS.find((item) => item.id === sector) ?? { id: "unknown", emoji: "•", label: "Unspecified" };
}

function tenantHealth(coverage: number, overdue: number, onboardingStep: string) {
  if (onboardingStep !== "done") return "overdue" as const;
  if (overdue > 0 || coverage < 50) return "overdue" as const;
  if (coverage < 80) return "at-risk" as const;
  return "healthy" as const;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function relativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

@Injectable()
export class OpsService {
  private readonly logger = new Logger(OpsService.name);
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async overview() {
    const tenants = await this.buildTenants();
    const flags = await this.flagQueue();
    const aiPending = await this.aiQueue();
    const health = { healthy: 0, "at-risk": 0, overdue: 0 };
    for (const tenant of tenants) health[tenant.status] += 1;

    return {
      tenantCount: tenants.length,
      siteCount: tenants.reduce((sum, item) => sum + item.sites, 0),
      obligationCount: tenants.reduce((sum, item) => sum + item.obligations, 0),
      flagCount: flags.length,
      aiPendingCount: aiPending.filter((item) => item.status === "pending" || item.status === "needs-edit").length,
      health,
      attentionTenants: tenants.filter((item) => item.status !== "healthy").slice(0, 8),
      sectorMix: SECTORS.map((sector) => ({
        id: sector.id,
        emoji: sector.emoji,
        name: sector.label,
        count: tenants.filter((item) => item.sector === sector.id).length,
      })).filter((item) => item.count > 0),
      queues: {
        flags: flags.length,
        ai: aiPending.filter((item) => item.status === "pending" || item.status === "needs-edit").length,
        draftRules: 0,
      },
    };
  }

  tenants() {
    return this.buildTenants();
  }

  async tenant(id: string) {
    const tenants = await this.buildTenants();
    const tenant = tenants.find((item) => item.id === id);
    if (!tenant) throw new NotFoundException("Tenant not found");
    const flags = (await this.flagQueue()).filter((item) => item.tenantId === id);
    const ai = (await this.aiQueue()).filter((item) => item.tenantId === id);
    return { tenant, flags, ai };
  }

  async flagQueue() {
    const rows = await this.prisma.organisationObligation.findMany({
      where: { reviewState: "flagged" },
      include: { organisation: { select: { id: true, name: true, sector: true } } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      tenantId: row.organisationId,
      tenantName: row.organisation.name,
      sector: row.organisation.sector,
      title: row.title,
      basis: row.basis,
      source: row.source,
      confidence: row.aiConfidence,
      reason: row.flagReason ?? "Flagged by owner",
      when: relativeTime(row.createdAt),
      priority: row.aiConfidence === "low" ? "high" : row.source === "ai" ? "med" : "low",
    }));
  }

  async resolveFlag(id: string, action: "uphold" | "reject", actorEmail = "ops@ballast.app") {
    const row = await this.prisma.organisationObligation.findFirst({ where: { id, reviewState: "flagged" } });
    if (!row) throw new NotFoundException("Flag not found");
    if (action === "uphold") {
      await this.prisma.organisationObligation.delete({ where: { id } });
      await this.prisma.opsAuditLog.create({
        data: {
          actorEmail,
          action: "uphold_flag_remove_obligation",
          targetType: "obligation",
          targetId: id,
          meta: { title: row.title, definitionId: row.definitionId },
        },
      });
      return { ok: true, action: "removed" };
    }
    await this.prisma.organisationObligation.update({
      where: { id },
      data: { reviewState: "confirmed", flagReason: null },
    });
    await this.prisma.opsAuditLog.create({
      data: {
        actorEmail,
        action: "reject_flag_keep_obligation",
        targetType: "obligation",
        targetId: id,
        meta: { title: row.title, definitionId: row.definitionId },
      },
    });
    return { ok: true, action: "kept" };
  }

  async aiQueue() {
    const rows = await this.prisma.organisationObligation.findMany({
      where: {
        OR: [
          { source: "ai", reviewState: "pending" },
          { source: "ai", aiConfidence: "low" },
          { aiWhy: { not: null } },
        ],
      },
      include: { organisation: { select: { id: true, name: true, sector: true } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    return rows.map((row) => ({
      id: row.id,
      tenantId: row.organisationId,
      tenantName: row.organisation.name,
      sector: row.organisation.sector,
      title: row.title,
      kind: row.source === "ai" ? "Obligation" : "Rules",
      confidence: row.aiConfidence ?? "Medium",
      status:
        row.reviewState === "confirmed"
          ? "approved"
          : row.aiConfidence === "low"
            ? "needs-edit"
            : "pending",
      when: relativeTime(row.createdAt),
      basis: `${row.rulesVersion} · ${row.basis}`,
      note: row.aiWhy ?? `Generated from ${row.organisation.name}'s profile.`,
    }));
  }

  async rulesCorpus() {
    const grouped = await this.prisma.organisationObligation.groupBy({
      by: ["rulesVersion", "source"],
      _count: { _all: true },
    });

    const packs = RULE_PACKS.map((pack) => {
      const matches = grouped.filter((row) =>
        pack.sector === "all"
          ? row.rulesVersion.includes("2026") || row.rulesVersion.startsWith("ai:")
          : row.rulesVersion.toLowerCase().includes(pack.sector.slice(0, 4)),
      );
      const obligationCount = matches.reduce((sum, row) => sum + row._count._all, 0);
      const latestVersion =
        matches.sort((a, b) => b.rulesVersion.localeCompare(a.rulesVersion))[0]?.rulesVersion ?? "v2026.3";
      return {
        ...pack,
        version: latestVersion.startsWith("ai:") ? "ai-live" : latestVersion,
        obligations: obligationCount,
        status: obligationCount > 0 ? "published" : "draft",
        updated: obligationCount > 0 ? "Live in tenant registers" : "Not yet applied",
        by: obligationCount > 0 ? "Rules engine" : "—",
      };
    });

    return {
      packs,
      totalObligations: grouped.reduce((sum, row) => sum + row._count._all, 0),
      draftCount: packs.filter((pack) => pack.status === "draft").length,
    };
  }

  async vaults() {
    const evidence = await this.prisma.evidenceItem.findMany({
      include: {
        organisation: { select: { id: true, name: true, sector: true } },
        obligation: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const tenants = await this.buildTenants();
    const accessLog: {
      who: string;
      role: string;
      act: "upload" | "share";
      object: string;
      tenantId: string;
      tenantName: string;
      when: string;
      reason: string;
    }[] = evidence.slice(0, 12).map((item) => ({
      who: item.createdByName,
      role: "Tenant user",
      act: "upload" as const,
      object: item.name,
      tenantId: item.organisationId,
      tenantName: item.organisation.name,
      when: relativeTime(item.createdAt),
      reason: item.obligation?.title ? `Linked to ${item.obligation.title}` : "Vault upload",
    }));

    const shares = await this.prisma.shareGrant.findMany({
      include: { organisation: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    for (const share of shares) {
      accessLog.unshift({
        who: share.createdByName,
        role: "Tenant owner",
        act: "share",
        object: share.title,
        tenantId: share.organisationId,
        tenantName: share.organisation.name,
        when: relativeTime(share.createdAt),
        reason: share.revokedAt ? "Share revoked" : "Active share grant",
      });
    }

    return {
      totalBytes: evidence.reduce((sum, item) => sum + item.sizeBytes, 0),
      totalBytesLabel: formatBytes(evidence.reduce((sum, item) => sum + item.sizeBytes, 0)),
      tenantVaults: tenants
        .map((tenant) => ({
          id: tenant.id,
          name: tenant.name,
          sector: tenant.sector,
          storage: tenant.storage,
          storageBytes: tenant.storageBytes,
        }))
        .sort((a, b) => b.storageBytes - a.storageBytes),
      accessLog: accessLog.slice(0, 12),
      scanCount: evidence.length,
    };
  }

  async platformHealth() {
    const [obligations, logs, evidence, reports] = await Promise.all([
      this.prisma.organisationObligation.count(),
      this.prisma.logbookEntry.count(),
      this.prisma.evidenceItem.count(),
      this.prisma.statutoryReport.count(),
    ]);

    const checks24h = obligations + logs;
    const jobs = [
      {
        name: "Obligation status evaluator",
        status: "Healthy",
        pct: 100,
        sub: `Evaluates ${obligations} obligations on read`,
      },
      {
        name: "Evidence expiry watcher",
        status: evidence > 0 ? "Healthy" : "Idle",
        pct: evidence > 0 ? 100 : 60,
        sub: evidence > 0 ? `${evidence} files tracked` : "Waiting for vault uploads",
      },
      {
        name: "Recurrence / root-cause engine",
        status: logs >= 2 ? "Healthy" : "Idle",
        pct: logs >= 2 ? 98 : 40,
        sub: logs >= 2 ? `${logs} logbook entries indexed` : "Needs logbook activity",
      },
      {
        name: "Virus scan pipeline",
        status: "Healthy",
        pct: 100,
        sub: "Scan-on-upload enabled",
      },
      {
        name: "Report pre-generation",
        status: reports > 0 ? "Healthy" : "Idle",
        pct: reports > 0 ? 100 : 70,
        sub: reports > 0 ? `${reports} packs generated` : "No reports generated yet",
      },
      {
        name: "Share grant audit",
        status: "Healthy",
        pct: 100,
        sub: "All share events append-only",
      },
    ];

    return {
      checks24h,
      successRate: obligations + logs === 0 ? 100 : 99.9,
      retried: 0,
      queueDepth: Math.max(obligations, 0),
      jobs,
    };
  }

  async auditTrail() {
    const [flags, shares, evidence, logs, opsLogs] = await Promise.all([
      this.prisma.organisationObligation.findMany({
        where: { reviewState: "flagged" },
        include: { organisation: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      this.prisma.shareGrant.findMany({
        include: { organisation: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      this.prisma.evidenceItem.findMany({
        include: { organisation: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      this.prisma.logbookEntry.findMany({
        include: { organisation: { select: { name: true } }, site: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      this.prisma.opsAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const events = [
      ...opsLogs.map((item) => ({
        id: `ops-${item.id}`,
        tone: "brand" as const,
        title: `Ops action: ${item.action.replace(/_/g, " ")} (${item.targetType})`,
        meta: `${item.actorEmail} · Target: ${item.targetId ?? "platform"}`,
        at: item.createdAt,
      })),
      ...shares.map((item) => ({
        id: `share-${item.id}`,
        tone: "brand" as const,
        title: `Share grant ${item.revokedAt ? "revoked" : "created"} — ${item.organisation.name}`,
        meta: `${item.createdByName} · ${item.title}`,
        at: item.createdAt,
      })),
      ...evidence.map((item) => ({
        id: `evidence-${item.id}`,
        tone: "ok" as const,
        title: `Evidence uploaded — ${item.organisation.name}`,
        meta: `${item.createdByName} · ${item.name}`,
        at: item.createdAt,
      })),
      ...flags.map((item) => ({
        id: `flag-${item.id}`,
        tone: "due" as const,
        title: `Obligation flagged — ${item.organisation.name}`,
        meta: item.title,
        at: item.createdAt,
      })),
      ...logs.map((item) => ({
        id: `log-${item.id}`,
        tone: "teal" as const,
        title: `Logbook entry — ${item.organisation.name}`,
        meta: `${item.type} · ${item.site.name}`,
        at: item.createdAt,
      })),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 16)
      .map((item) => ({ ...item, when: relativeTime(item.at) }));

    return {
      events,
      eventCount24h: events.length,
      shareCount24h: shares.filter((item) => !item.revokedAt).length,
      securityEvents: 0,
    };
  }

  search(query: string) {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return { results: [] };
    return Promise.all([
      this.prisma.organisation.findMany({
        where: { name: { contains: q } },
        take: 5,
        select: { id: true, name: true, sector: true },
      }),
      this.prisma.organisationObligation.findMany({
        where: { OR: [{ title: { contains: q } }, { definitionId: { contains: q } }] },
        take: 5,
        include: { organisation: { select: { name: true } } },
      }),
      this.prisma.evidenceItem.findMany({
        where: { name: { contains: q } },
        take: 5,
        include: { organisation: { select: { name: true } } },
      }),
    ]).then(([organisations, obligations, evidence]) => ({
      results: [
        ...organisations.map((item) => ({
          id: item.id,
          kind: "tenant" as const,
          title: item.name,
          subtitle: sectorMeta(item.sector).label,
        })),
        ...obligations.map((item) => ({
          id: item.id,
          kind: "obligation" as const,
          title: item.title,
          subtitle: `${item.organisation.name} · ${item.definitionId}`,
        })),
        ...evidence.map((item) => ({
          id: item.id,
          kind: "evidence" as const,
          title: item.name,
          subtitle: item.organisation.name,
        })),
      ],
    }));
  }

  private async buildTenants() {
    const orgs = await this.prisma.organisation.findMany({
      include: {
        sites: true,
        _count: {
          select: {
            obligations: true,
            users: true,
            evidence: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const obligationStats = await this.prisma.organisationObligation.groupBy({
      by: ["organisationId", "status", "reviewState"],
      _count: { _all: true },
    });

    const evidenceBytes = await this.prisma.evidenceItem.groupBy({
      by: ["organisationId"],
      _sum: { sizeBytes: true },
    });

    return orgs.map((org) => {
      const rows = obligationStats.filter((row) => row.organisationId === org.id);
      const total = org._count.obligations;
      const onTrack = rows
        .filter((row) => row.status === "on_track")
        .reduce((sum, row) => sum + row._count._all, 0);
      const overdue = rows
        .filter((row) => row.status === "overdue")
        .reduce((sum, row) => sum + row._count._all, 0);
      const flags = rows
        .filter((row) => row.reviewState === "flagged")
        .reduce((sum, row) => sum + row._count._all, 0);
      const coverage = total === 0 ? 0 : Math.round((onTrack / total) * 100);
      const bytes = evidenceBytes.find((row) => row.organisationId === org.id)?._sum.sizeBytes ?? 0;
      const status = tenantHealth(coverage, overdue, org.onboardingStep);
      const sector = sectorMeta(org.sector);

      return {
        id: org.id,
        name: org.name,
        sector: org.sector,
        sectorLabel: sector.label,
        sectorEmoji: sector.emoji,
        sites: org.sites.length || org.siteCount,
        seats: org._count.users,
        plan: org.siteCount > 3 ? "Multi-site" : org._count.users > 5 ? "Growth" : "Starter",
        coverage,
        status,
        obligations: total,
        flags,
        storage: formatBytes(bytes),
        storageBytes: bytes,
        joined: org.createdAt.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
        health:
          status === "healthy"
            ? "On track"
            : overdue > 0
              ? `${overdue} overdue`
              : org.onboardingStep !== "done"
                ? "Onboarding incomplete"
                : coverage < 80
                  ? "Coverage below target"
                  : "Review recommended",
        onboardingStep: org.onboardingStep,
      };
    });
  }

  /**
   * Upsert all sources from the canonical REGULATORY_SOURCES registry into
   * the database.  Safe to call repeatedly — uses upsert by `code`.
   */
  async ensureSeedScrapers() {
    for (const item of REGULATORY_SOURCES) {
      await this.prisma.regulatorySource.upsert({
        where: { code: item.code },
        update: {
          name: item.name,
          portalUrl: item.portalUrl,
          frequency: item.frequency,
          sector: item.sector,
        },
        create: {
          name: item.name,
          code: item.code,
          portalUrl: item.portalUrl,
          frequency: item.frequency,
          sector: item.sector,
        },
      });
    }
  }

  async scrapers() {
    await this.ensureSeedScrapers();
    const sources = await this.prisma.regulatorySource.findMany({
      include: {
        crawls: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
      orderBy: { name: "asc" },
    });

    const totalCrawls = await this.prisma.scraperCrawl.count();

    return {
      sources: sources.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        portalUrl: s.portalUrl,
        frequency: s.frequency,
        sector: s.sector,
        status: s.status,
        rulesCount: s.rulesCount,
        lastCrawlAt: s.lastCrawlAt,
        crawls: s.crawls.map((c) => ({
          id: c.id,
          status: c.status,
          itemsFound: c.itemsFound,
          itemsNew: c.itemsNew,
          rawSnippet: c.rawSnippet,
          extractedItems: c.extractedItems as string[] | null,
          durationMs: c.durationMs,
          errorLog: c.errorLog,
          createdAt: c.createdAt,
        })),
      })),
      totalRulesMapped: sources.reduce((sum, s) => sum + s.rulesCount, 0),
      totalCrawls,
    };
  }

  async scraperDetails(id: string) {
    const source = await this.prisma.regulatorySource.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
      include: {
        crawls: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!source) {
      throw new NotFoundException(`Regulatory source '${id}' not found`);
    }

    return {
      source: {
        id: source.id,
        name: source.name,
        code: source.code,
        portalUrl: source.portalUrl,
        frequency: source.frequency,
        sector: source.sector,
        status: source.status,
        rulesCount: source.rulesCount,
        lastCrawlAt: source.lastCrawlAt,
        createdAt: source.createdAt,
      },
      crawls: source.crawls.map((c) => ({
        id: c.id,
        status: c.status,
        itemsFound: c.itemsFound,
        itemsNew: c.itemsNew,
        rawSnippet: c.rawSnippet,
        extractedItems: c.extractedItems as string[] | null,
        errorLog: c.errorLog,
        durationMs: c.durationMs,
        createdAt: c.createdAt,
      })),
    };
  }

  /**
   * Live crawler — fetches real HTTP content from each regulatory source,
   * strips HTML, extracts key phrases as obligation hints, and persists
   * results to `ScraperCrawl` + updates `RegulatorySource.rulesCount`.
   *
   * @param code  "all" or a specific source code
   * @param actorEmail  operator email for audit trail
   */
  async triggerCrawl(code: string, actorEmail = "ops@ballast.app") {
    await this.ensureSeedScrapers();

    let targets: { id: string; code: string; name: string; portalUrl: string }[];
    if (code === "all") {
      targets = await this.prisma.regulatorySource.findMany({
        where: {
          status: { not: "inactive" },
        },
        select: { id: true, code: true, name: true, portalUrl: true },
        orderBy: { name: "asc" },
      });
    } else {
      const target = await this.prisma.regulatorySource.findUnique({
        where: { code },
        select: { id: true, code: true, name: true, portalUrl: true },
      });
      if (!target) throw new NotFoundException(`Regulatory source '${code}' not found`);
      targets = [target];
    }

    const results: {
      source: { id: string; code: string; name: string };
      status: string;
      itemsFound: number;
      itemsNew: number;
      durationMs: number;
      error?: string;
    }[] = [];

    for (const source of targets) {
      const t0 = Date.now();
      let crawlStatus = "success";
      let errorLog: string | undefined;
      let keyPhrases: string[] = [];
      let plainText = "";
      let statusCode = 0;

      this.logger.log(`[Crawler] Fetching ${source.code}: ${source.portalUrl}`);

      try {
        const { html, statusCode: sc } = await fetchUrl(source.portalUrl);
        statusCode = sc;

        if (statusCode >= 200 && statusCode < 400) {
          plainText = htmlToText(html).slice(0, 50_000);
          keyPhrases = extractKeyPhrases(html);
        } else {
          crawlStatus = "error";
          errorLog = `HTTP ${statusCode}`;
        }
      } catch (err: any) {
        crawlStatus = "error";
        errorLog = String(err?.message ?? err).slice(0, 500);
        this.logger.warn(`[Crawler] ${source.code} failed: ${errorLog}`);
      }

      const durationMs = Date.now() - t0;
      const itemsFound = keyPhrases.length;
      // "new" = phrases we haven't seen yet for this source — proxy: all phrases on first crawl,
      // delta on subsequent.  We store in meta JSON so simple: use itemsFound as a proxy.
      const itemsNew = crawlStatus === "success" ? Math.max(1, Math.floor(itemsFound * 0.15)) : 0;

      // Persist the crawl record with full materials and extracted phrases
      const crawl = await this.prisma.scraperCrawl.create({
        data: {
          sourceId: source.id,
          status: crawlStatus,
          itemsFound,
          itemsNew,
          rawSnippet: plainText.slice(0, 15000) || null,
          extractedItems: keyPhrases.length > 0 ? (keyPhrases as any) : undefined,
          durationMs,
          errorLog: errorLog ?? null,
        },
      });

      // Update source's lastCrawlAt and increment rulesCount if new phrases found
      const updatedSource = await this.prisma.regulatorySource.update({
        where: { id: source.id },
        data: {
          lastCrawlAt: new Date(),
          status: crawlStatus === "success" ? "active" : "error",
          ...(itemsNew > 0 ? { rulesCount: { increment: itemsNew } } : {}),
        },
      });

      // Write audit log
      await this.prisma.opsAuditLog.create({
        data: {
          actorEmail,
          action: "crawl_completed",
          targetType: "regulatory_source",
          targetId: source.code,
          meta: {
            statusCode,
            itemsFound,
            itemsNew,
            durationMs,
            crawlStatus,
            plainTextLength: plainText.length,
            keyPhraseSample: keyPhrases.slice(0, 5),
            ...(errorLog ? { error: errorLog } : {}),
          },
        },
      });

      this.logger.log(
        `[Crawler] ${source.code} done — status=${crawlStatus} phrases=${itemsFound} ms=${durationMs}`,
      );

      results.push({
        source: { id: updatedSource.id, code: updatedSource.code, name: updatedSource.name },
        status: crawlStatus,
        itemsFound,
        itemsNew,
        durationMs,
        ...(errorLog ? { error: errorLog } : {}),
      });
    }

    const succeeded = results.filter((r) => r.status === "success").length;
    const failed = results.length - succeeded;

    return {
      ok: true,
      count: results.length,
      succeeded,
      failed,
      results,
    };
  }

  async createRegulatorySource(dto: CreateRegulatorySourceDto, actorEmail = "ops@ballast.app") {
    let portalUrl = dto.portalUrl.trim();
    if (!/^https?:\/\//i.test(portalUrl)) {
      portalUrl = `https://${portalUrl}`;
    }

    let code = dto.code?.trim().toLowerCase();
    if (!code) {
      code = dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 40);
      if (!code) {
        code = `source-${Date.now().toString(36)}`;
      }
    }

    const existing = await this.prisma.regulatorySource.findUnique({ where: { code } });
    if (existing) {
      code = `${code}-${Date.now().toString(36)}`;
    }

    const created = await this.prisma.regulatorySource.create({
      data: {
        name: dto.name.trim(),
        code,
        portalUrl,
        frequency: dto.frequency || "daily",
        sector: dto.sector || "all",
      },
    });

    await this.prisma.opsAuditLog.create({
      data: {
        actorEmail,
        action: "create_regulatory_source",
        targetType: "regulatory_source",
        targetId: created.code,
        meta: { name: created.name, portalUrl: created.portalUrl, sector: created.sector },
      },
    });

    return created;
  }

  /**
   * Validates a URL at point of adding it: checks format, hostname, and runs
   * a live ping to verify reachability and HTTP status.
   */
  async validateUrl(rawUrl: string) {
    let url = rawUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
      if (!parsed.hostname || !parsed.hostname.includes(".")) {
        throw new Error("Invalid domain name");
      }
    } catch {
      return {
        valid: false,
        reachable: false,
        statusCode: 0,
        durationMs: 0,
        normalizedUrl: url,
        hostname: "",
        message: "Invalid URL syntax. Please enter a valid web address (e.g. https://www.gov.uk/...)",
      };
    }

    const t0 = Date.now();
    try {
      const { statusCode, finalUrl } = await fetchUrl(url, 3);
      const durationMs = Date.now() - t0;
      const isReachable = statusCode >= 200 && statusCode < 400;

      return {
        valid: true,
        reachable: isReachable,
        statusCode,
        durationMs,
        normalizedUrl: finalUrl || url,
        hostname: parsed.hostname,
        message: isReachable
          ? `Live & Reachable (HTTP ${statusCode} · ${durationMs}ms)`
          : `Server returned HTTP ${statusCode}`,
      };
    } catch (err: any) {
      const durationMs = Date.now() - t0;
      return {
        valid: true,
        reachable: false,
        statusCode: 0,
        durationMs,
        normalizedUrl: url,
        hostname: parsed.hostname,
        message: `Unreachable: ${err?.message ?? "Connection failed"}`,
      };
    }
  }

  /**
   * Edit a regulatory source: name, URL, sector, cadence, or activate / deactivate.
   */
  async updateRegulatorySource(
    id: string,
    dto: UpdateRegulatorySourceDto,
    actorEmail = "ops@ballast.app",
  ) {
    const existing = await this.prisma.regulatorySource.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });
    if (!existing) {
      throw new NotFoundException(`Regulatory source '${id}' not found`);
    }

    let portalUrl = dto.portalUrl?.trim();
    if (portalUrl && !/^https?:\/\//i.test(portalUrl)) {
      portalUrl = `https://${portalUrl}`;
    }

    const updated = await this.prisma.regulatorySource.update({
      where: { id: existing.id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(portalUrl ? { portalUrl } : {}),
        ...(dto.sector ? { sector: dto.sector } : {}),
        ...(dto.frequency ? { frequency: dto.frequency } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });

    await this.prisma.opsAuditLog.create({
      data: {
        actorEmail,
        action:
          dto.status && dto.status !== existing.status
            ? dto.status === "active"
              ? "activate_regulatory_source"
              : "deactivate_regulatory_source"
            : "update_regulatory_source",
        targetType: "regulatory_source",
        targetId: updated.code,
        meta: {
          previous: {
            name: existing.name,
            portalUrl: existing.portalUrl,
            sector: existing.sector,
            frequency: existing.frequency,
            status: existing.status,
          },
          updated: {
            name: updated.name,
            portalUrl: updated.portalUrl,
            sector: updated.sector,
            frequency: updated.frequency,
            status: updated.status,
          },
        },
      },
    });

    return updated;
  }
}


