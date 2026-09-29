import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { FormAnswers, FormCompletion, FormSchema, FormSubmissionStatus } from "@ballast/domain";
import { measureFormCompletion, statusFromFormProgress, validateFormAnswers } from "@ballast/domain";
import type { Activity } from "@ballast/domain";
import { AiService } from "../ai/ai.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FormsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AiService) private readonly ai: AiService,
  ) {}

  async getForObligation(organisationId: string, obligationId: string) {
    const obligation = await this.requireObligation(organisationId, obligationId);
    let template = await this.prisma.obligationFormTemplate.findUnique({
      where: { organisationObligationId: obligationId },
    });

    if (!template) {
      template = await this.generateTemplate(organisationId, obligation);
    }

    const submission = await this.prisma.obligationFormSubmission.findFirst({
      where: { organisationId, obligationId, templateId: template.id },
      orderBy: { updatedAt: "desc" },
    });

    const answers = (submission?.answers ?? {}) as FormAnswers;
    const schema = template.schema as unknown as FormSchema;
    const progress = measureFormCompletion(schema, answers);

    return {
      obligation: {
        id: obligation.id,
        definitionId: obligation.definitionId,
        title: obligation.title,
        category: obligation.category,
        basis: obligation.basis,
        cadence: obligation.cadence,
        evidence: obligation.evidence,
        reviewState: obligation.reviewState,
        status: obligation.status,
      },
      template: this.shapeTemplate(template),
      submission: submission ? this.shapeSubmission(submission) : null,
      progress,
    };
  }

  async generate(organisationId: string, obligationId: string, force = false) {
    const obligation = await this.requireObligation(organisationId, obligationId);
    const existing = await this.prisma.obligationFormTemplate.findUnique({
      where: { organisationObligationId: obligationId },
    });
    if (existing && !force) {
      return this.getForObligation(organisationId, obligationId);
    }
    await this.generateTemplate(organisationId, obligation, existing?.version);
    const bundle = await this.getForObligation(organisationId, obligationId);
    await this.syncObligationStatusFromForm(
      organisationId,
      obligationId,
      bundle.progress,
      bundle.submission?.status as FormSubmissionStatus | undefined,
    );
    return this.getForObligation(organisationId, obligationId);
  }

  async saveAnswers(organisationId: string, obligationId: string, answers: FormAnswers) {
    const bundle = await this.getForObligation(organisationId, obligationId);
    if (bundle.submission && ["submitted", "approved"].includes(bundle.submission.status)) {
      throw new BadRequestException("This questionnaire is locked. Contact Ballast if you need changes.");
    }

    const templateId = bundle.template.id;
    const templateVersion = bundle.template.version;
    const progress = measureFormCompletion(bundle.template.schema, answers);

    let submission;
    if (bundle.submission) {
      submission = await this.prisma.obligationFormSubmission.update({
        where: { id: bundle.submission.id },
        data: { answers: answers as any, status: "draft" },
      });
    } else {
      submission = await this.prisma.obligationFormSubmission.create({
        data: {
          organisationId,
          obligationId,
          templateId,
          templateVersion,
          answers: answers as any,
          status: "draft",
        },
      });
    }

    const obligation = await this.syncObligationStatusFromForm(
      organisationId,
      obligationId,
      progress,
      "draft",
    );

    return {
      ...bundle,
      obligation: {
        ...bundle.obligation,
        status: obligation.status,
      },
      submission: this.shapeSubmission(submission),
      progress,
    };
  }

  async submit(organisationId: string, obligationId: string, answers?: FormAnswers) {
    const saved = answers
      ? await this.saveAnswers(organisationId, obligationId, answers)
      : await this.getForObligation(organisationId, obligationId);

    if (!saved.submission) {
      throw new BadRequestException("Save answers before submitting");
    }

    const schema = saved.template.schema as FormSchema;
    const currentAnswers = (answers ?? saved.submission.answers) as FormAnswers;
    const errors = validateFormAnswers(schema, currentAnswers);
    if (errors.length) {
      throw new BadRequestException(errors[0]);
    }

    const progress = measureFormCompletion(schema, currentAnswers);
    const now = new Date();

    const updated = await this.prisma.obligationFormSubmission.update({
      where: { id: saved.submission.id },
      data: {
        answers: currentAnswers as any,
        status: "submitted",
        submittedAt: now,
      },
    });

    const obligation = await this.syncObligationStatusFromForm(
      organisationId,
      obligationId,
      progress,
      "submitted",
      now,
    );

    return {
      ...saved,
      obligation: {
        ...saved.obligation,
        status: obligation.status,
      },
      submission: this.shapeSubmission(updated),
      progress,
    };
  }

  async ensureForConfirmed(organisationId: string, obligationIds?: string[]) {
    const rows = await this.prisma.organisationObligation.findMany({
      where: {
        organisationId,
        reviewState: "confirmed",
        ...(obligationIds?.length ? { id: { in: obligationIds } } : {}),
        formTemplate: null,
      },
      take: 25,
    });

    for (const row of rows) {
      try {
        await this.generateTemplate(organisationId, row);
        const bundle = await this.getForObligation(organisationId, row.id);
        await this.syncObligationStatusFromForm(
          organisationId,
          row.id,
          bundle.progress,
          (bundle.submission?.status as FormSubmissionStatus | undefined) ?? null,
        );
      } catch {
        // best-effort during confirm-all
      }
    }
  }

  /**
   * Recompute obligation.status from the latest questionnaire fill for one duty.
   */
  async syncObligationStatusFromForm(
    organisationId: string,
    obligationId: string,
    progress: FormCompletion,
    submissionStatus?: FormSubmissionStatus | null,
    evidenceAt?: Date,
  ) {
    const row = await this.requireObligation(organisationId, obligationId);
    if (row.statusManual) return row;

    const nextStatus = statusFromFormProgress(progress, submissionStatus);
    const data: {
      status: string;
      lastEvidenceAt?: Date;
      nextDueAt?: Date | null;
    } = { status: nextStatus };

    if (submissionStatus === "submitted" || submissionStatus === "approved") {
      data.lastEvidenceAt = evidenceAt ?? new Date();
      data.nextDueAt = null;
    }

    if (row.status === data.status && !data.lastEvidenceAt) return row;

    return this.prisma.organisationObligation.update({
      where: { id: obligationId },
      data,
    });
  }

  private async generateTemplate(
    organisationId: string,
    obligation: {
      id: string;
      definitionId: string;
      title: string;
      category: string;
      basis: string;
      cadence: string;
      evidence: string;
      ownerRole: string;
    },
    previousVersion?: number,
  ) {
    const org = await this.prisma.organisation.findUniqueOrThrow({ where: { id: organisationId } });
    const generated = await this.ai.formSchemaForObligation({
      organisationName: org.name,
      sector: org.sector ?? "hospitality",
      sizeBand: org.sizeBand ?? "2_10",
      siteCount: org.siteCount,
      activities: Array.isArray(org.activities) ? (org.activities as Activity[]) : [],
      extraNotes: org.extraNotes ?? undefined,
      definitionId: obligation.definitionId,
      title: obligation.title,
      category: obligation.category,
      basis: obligation.basis,
      cadence: obligation.cadence,
      evidenceHint: obligation.evidence,
      ownerRole: obligation.ownerRole,
    });

    const schema: FormSchema = { version: 1, fields: generated.fields as any };
    const version = (previousVersion ?? 0) + 1;

    return this.prisma.obligationFormTemplate.upsert({
      where: { organisationObligationId: obligation.id },
      create: {
        organisationId,
        organisationObligationId: obligation.id,
        definitionId: obligation.definitionId,
        version,
        title: generated.title,
        purpose: generated.purpose,
        schema: schema as any,
        source: generated.source,
        aiConfidence: generated.confidence,
        aiWhy: generated.why,
      },
      update: {
        version,
        title: generated.title,
        purpose: generated.purpose,
        schema: schema as any,
        source: generated.source,
        aiConfidence: generated.confidence,
        aiWhy: generated.why,
      },
    });
  }

  private async requireObligation(organisationId: string, obligationId: string) {
    const row = await this.prisma.organisationObligation.findFirst({
      where: { id: obligationId, organisationId },
    });
    if (!row) throw new NotFoundException("Obligation not found");
    return row;
  }

  private shapeTemplate(row: {
    id: string;
    definitionId: string;
    version: number;
    title: string;
    purpose: string | null;
    schema: unknown;
    source: string;
    aiConfidence: string | null;
    aiWhy: string | null;
  }) {
    return {
      id: row.id,
      definitionId: row.definitionId,
      version: row.version,
      title: row.title,
      purpose: row.purpose,
      schema: row.schema as FormSchema,
      source: row.source,
      aiConfidence: row.aiConfidence,
      aiWhy: row.aiWhy,
    };
  }

  private shapeSubmission(row: {
    id: string;
    templateId: string;
    templateVersion: number;
    answers: unknown;
    status: string;
    submittedAt: Date | null;
    reviewedAt: Date | null;
    reviewNote: string | null;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      templateId: row.templateId,
      templateVersion: row.templateVersion,
      answers: row.answers as FormAnswers,
      status: row.status,
      submittedAt: row.submittedAt,
      reviewedAt: row.reviewedAt,
      reviewNote: row.reviewNote,
      updatedAt: row.updatedAt,
    };
  }
}
