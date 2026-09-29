import {
  deriveObligationStatus,
  measureFormCompletion,
  statusFromFormProgress,
  type FormAnswers,
  type FormSchema,
  type FormSubmissionStatus,
} from "@ballast/domain";
import type { PrismaService } from "../prisma/prisma.service";

export async function refreshObligationStatus(
  prisma: PrismaService,
  organisationId: string,
  obligationId?: string,
) {
  const rows = await prisma.organisationObligation.findMany({
    where: { organisationId, ...(obligationId ? { id: obligationId } : {}) },
    include: {
      formTemplate: true,
      formSubmissions: {
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  for (const row of rows) {
    if (row.statusManual) continue;

    const submission = row.formSubmissions[0] ?? null;
    const template = row.formTemplate;

    let nextStatus = deriveObligationStatus(row.cadence, row.lastEvidenceAt).status;
    let nextDueAt = deriveObligationStatus(row.cadence, row.lastEvidenceAt).nextDueAt;

    if (template) {
      const answers = (submission?.answers ?? {}) as FormAnswers;
      const progress = measureFormCompletion(template.schema as unknown as FormSchema, answers);
      const formStatus = statusFromFormProgress(
        progress,
        (submission?.status as FormSubmissionStatus | undefined) ?? null,
      );

      // Form fill drives status when a questionnaire exists; cadence only applies
      // after the form is submitted/approved (evidence clock starts).
      if (submission?.status === "submitted" || submission?.status === "approved") {
        const derived = deriveObligationStatus(row.cadence, row.lastEvidenceAt ?? submission.submittedAt);
        nextStatus = derived.status === "evidence_gap" ? "on_track" : derived.status;
        nextDueAt = derived.nextDueAt;
      } else {
        nextStatus = formStatus;
        nextDueAt = null;
      }
    }

    if (row.status === nextStatus && sameDate(row.nextDueAt, nextDueAt)) continue;
    await prisma.organisationObligation.update({
      where: { id: row.id },
      data: { status: nextStatus, nextDueAt },
    });
  }
}

export async function recordEvidence(
  prisma: PrismaService,
  organisationId: string,
  obligationId: string,
  at = new Date(),
) {
  const row = await prisma.organisationObligation.findFirst({
    where: { id: obligationId, organisationId },
  });
  if (!row) return;
  const next = deriveObligationStatus(row.cadence, at);
  await prisma.organisationObligation.update({
    where: { id: row.id },
    data: { lastEvidenceAt: at, status: next.status, nextDueAt: next.nextDueAt, statusManual: false },
  });
}

function sameDate(left: Date | null, right: Date | null) {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return left.getTime() === right.getTime();
}
