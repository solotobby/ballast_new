import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Activity, BusinessProfile, FormAnswers, FormSchema, Sector, SizeBand } from "@ballast/domain";
import { measureFormCompletion } from "@ballast/domain";
import { generateObligationSet } from "@ballast/rules";
import { AiService } from "../ai/ai.service";
import { FormsService } from "../forms/forms.service";
import type { GeneratedObligation, ObligationProfileInput } from "../ai/ai.types";
import { PrismaService } from "../prisma/prisma.service";
import { refreshObligationStatus } from "./status";

@Injectable()
export class ObligationsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AiService) private readonly ai: AiService,
    @Inject(FormsService) private readonly forms: FormsService,
  ) {}

  async list(organisationId: string) {
    await refreshObligationStatus(this.prisma, organisationId);
    const rows = await this.prisma.organisationObligation.findMany({
      where: { organisationId },
      include: {
        formTemplate: true,
        formSubmissions: { orderBy: { updatedAt: "desc" }, take: 1 },
      },
      orderBy: [{ category: "asc" }, { definitionId: "asc" }],
    });

    return rows.map((row) => {
      const { formTemplate, formSubmissions, ...obligation } = row;
      const submission = formSubmissions[0] ?? null;
      let formProgress = null as null | {
        percent: number;
        complete: boolean;
        requiredFilled: number;
        requiredTotal: number;
        submissionStatus: string | null;
      };

      if (formTemplate) {
        const progress = measureFormCompletion(
          formTemplate.schema as unknown as FormSchema,
          (submission?.answers ?? {}) as FormAnswers,
        );
        formProgress = {
          percent: progress.percent,
          complete: progress.complete,
          requiredFilled: progress.requiredFilled,
          requiredTotal: progress.requiredTotal,
          submissionStatus: submission?.status ?? null,
        };
      }

      return { ...obligation, formProgress };
    });
  }

  async getOne(organisationId: string, id: string) {
    const row = await this.prisma.organisationObligation.findFirst({
      where: { id, organisationId },
    });
    if (!row) throw new NotFoundException("Obligation not found");
    return row;
  }

  async generate(organisationId: string) {
    const org = await this.prisma.organisation.findUniqueOrThrow({
      where: { id: organisationId },
      include: { sites: true },
    });
    if (!org.sector || !org.sizeBand) {
      throw new BadRequestException("Complete your business profile first");
    }

    const profile: ObligationProfileInput = {
      organisationName: org.name,
      legalName: org.legalName ?? undefined,
      companyNumber: org.companyNumber ?? undefined,
      sicCode: org.sicCode ?? undefined,
      address: org.address ?? undefined,
      jurisdiction: org.jurisdiction ?? undefined,
      council: org.council ?? undefined,
      sector: org.sector as Sector,
      sizeBand: org.sizeBand as SizeBand,
      siteCount: org.siteCount,
      sites: (org.sites || []).map((s) => ({
        id: s.id,
        name: s.name,
        location: s.address ?? undefined,
        postcode: s.postcode ?? undefined,
        staffCount: s.staffCount,
        description: s.description ?? undefined,
      })),
      activities: Array.isArray(org.activities) ? (org.activities as string[]) : [],
      extraNotes: org.extraNotes ?? undefined,
    };

    try {
      const generated = await this.ai.obligationsForProfile(profile);
      await this.persist(
        organisationId,
        generated.obligations.map((item) => ({
          ...item,
          id: this.stableId(profile.sector, item.title, item.id),
        })),
        `crawled:${generated.groundingRatio || generated.source}`,
        "ai",
      );
    } catch (error) {
      const { pack, obligations } = generateObligationSet({
        sector: profile.sector,
        sizeBand: profile.sizeBand as SizeBand,
        siteCount: profile.siteCount,
        activities: profile.activities as Activity[],
        extraNotes: profile.extraNotes,
      });
      if (obligations.length === 0) {
        const reason = error instanceof Error ? error.message : "Could not generate obligations";
        throw new BadRequestException(reason);
      }
      await this.persist(
        organisationId,
        obligations.map((definition) => ({
          id: definition.id,
          category: definition.category,
          title: definition.title,
          basis: definition.basis,
          cadence: definition.cadence,
          evidence: definition.evidence,
          ownerRole: definition.ownerRole,
          siteScope: definition.siteScope,
          confidence: "high" as const,
          why: "Matched from the hospitality rules pack for the activities you selected.",
        })),
        pack.version,
        "rules",
      );
    }

    if (org.onboardingStep !== "done") {
      await this.prisma.organisation.update({
        where: { id: organisationId },
        data: { onboardingStep: "review" },
      });
    }

    return {
      packId: "live",
      rulesVersion: "dynamic",
      obligations: await this.list(organisationId),
    };
  }

  async confirmAll(organisationId: string) {
    await this.prisma.organisationObligation.updateMany({
      where: { organisationId, reviewState: { not: "flagged" } },
      data: { reviewState: "confirmed", flagReason: null },
    });
    await this.forms.ensureForConfirmed(organisationId);
    return this.list(organisationId);
  }

  async confirm(organisationId: string, id: string) {
    const result = await this.prisma.organisationObligation.updateMany({
      where: { id, organisationId },
      data: { reviewState: "confirmed", flagReason: null },
    });
    if (result.count === 0) throw new NotFoundException("Obligation not found");
    await this.forms.ensureForConfirmed(organisationId, [id]);
    return this.getOne(organisationId, id);
  }

  async flag(organisationId: string, id: string, reason?: string) {
    const result = await this.prisma.organisationObligation.updateMany({
      where: { id, organisationId },
      data: { reviewState: "flagged", flagReason: reason?.trim() || "Flagged by owner" },
    });
    if (result.count === 0) throw new NotFoundException("Obligation not found");
    return this.getOne(organisationId, id);
  }

  async updateStatus(organisationId: string, id: string, status: string) {
    const result = await this.prisma.organisationObligation.updateMany({
      where: { id, organisationId },
      data: { status, statusManual: true },
    });
    if (result.count === 0) throw new NotFoundException("Obligation not found");
    return this.getOne(organisationId, id);
  }

  private async persist(
    organisationId: string,
    obligations: GeneratedObligation[],
    rulesVersion: string,
    source: "ai" | "rules",
  ) {
    await this.prisma.$transaction(async (tx) => {
      const keep = obligations.map((item) => item.id);
      await tx.organisationObligation.deleteMany({
        where: {
          organisationId,
          ...(keep.length > 0 ? { definitionId: { notIn: keep } } : {}),
        },
      });

      for (const definition of obligations) {
        await tx.organisationObligation.upsert({
          where: {
            organisationId_definitionId: {
              organisationId,
              definitionId: definition.id,
            },
          },
          create: {
            organisationId,
            definitionId: definition.id,
            title: definition.title,
            category: definition.category,
            basis: definition.basis,
            cadence: definition.cadence,
            evidence: definition.evidence,
            ownerRole: definition.ownerRole,
            siteScope: definition.siteScope,
            source: definition.source || source,
            rulesVersion,
            aiConfidence: definition.confidence,
            aiWhy: definition.why || null,
            status: "evidence_gap",
            reviewState: "pending",
          },
          update: {
            title: definition.title,
            category: definition.category,
            basis: definition.basis,
            cadence: definition.cadence,
            evidence: definition.evidence,
            ownerRole: definition.ownerRole,
            siteScope: definition.siteScope,
            source: definition.source || source,
            rulesVersion,
            aiConfidence: definition.confidence,
            aiWhy: definition.why || null,
          },
        });
      }
    });
  }

  private stableId(sector: Sector, title: string, fallback: string): string {
    const slug = title
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 28);
    if (slug) return `${sector.slice(0, 4).toUpperCase()}-${slug}`;
    return fallback.slice(0, 32);
  }
}
