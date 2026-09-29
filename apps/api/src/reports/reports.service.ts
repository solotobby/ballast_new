import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { PrismaService } from "../prisma/prisma.service";
import {
  REPORT_TEMPLATES,
  matchesCategory,
  type ReportLibraryStatus,
  type ReportTemplateId,
} from "./report-templates";

type ObligationRow = {
  id: string;
  title: string;
  category: string;
  status: string;
  basis: string;
  cadence: string;
  evidence: string;
  nextDueAt: Date | null;
};

@Injectable()
export class ReportsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async library(organisationId: string) {
    const [obligations, evidenceCount, logCount, shares] = await Promise.all([
      this.prisma.organisationObligation.findMany({ where: { organisationId } }),
      this.prisma.evidenceItem.count({ where: { organisationId } }),
      this.prisma.logbookEntry.count({ where: { organisationId } }),
      this.prisma.shareGrant.count({ where: { organisationId, revokedAt: null } }),
    ]);

    const items = REPORT_TEMPLATES.map((template) =>
      this.evaluateTemplate(template.id, obligations, { evidenceCount, logCount, shares }),
    );

    const ready = items.filter((item) => item.status === "ready").length;
    const blocked = items.filter((item) => item.status === "blocked").length;
    const headline =
      obligations.length === 0
        ? "Generate your duty register first — statutory packs auto-fill from obligations, evidence and logs."
        : ready > 0
          ? `${ready} report${ready === 1 ? "" : "s"} ready to generate from your vault and logbook.`
          : evidenceCount === 0 && logCount === 0
            ? "Upload evidence or log checks to unlock auto-filled statutory packs."
            : "Keep building coverage — reports update as evidence and obligations change.";

    return {
      headline,
      readyCount: ready,
      blockedCount: blocked,
      obligationCount: obligations.length,
      evidenceCount,
      logCount,
      items,
    };
  }

  async generate(organisationId: string, templateId: string, createdByName: string) {
    const template = REPORT_TEMPLATES.find((item) => item.id === templateId);
    if (!template) throw new NotFoundException("Unknown report template");

    const obligations = await this.prisma.organisationObligation.findMany({
      where: { organisationId },
    });
    const evidence = await this.prisma.evidenceItem.findMany({
      where: { organisationId },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { obligation: { select: { title: true, category: true } } },
    });
    const logs = await this.prisma.logbookEntry.findMany({
      where: { organisationId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { site: { select: { name: true } }, obligation: { select: { title: true } } },
    });
    const shares = await this.prisma.shareGrant.count({
      where: { organisationId, revokedAt: null },
    });

    const evaluated = this.evaluateTemplate(template.id, obligations, {
      evidenceCount: evidence.length,
      logCount: logs.length,
      shares,
    });

    const scoped = this.scopedObligations(template.id, obligations);
    const content = {
      generatedBy: createdByName,
      summary: evaluated.dueLabel,
      status: evaluated.status,
      progress: evaluated.progress,
      blocker: evaluated.blocker,
      obligations: scoped.map((item) => ({
        title: item.title,
        category: item.category,
        status: item.status,
        basis: item.basis,
        cadence: item.cadence,
        evidenceHint: item.evidence,
      })),
      evidence: evidence
        .filter((item) => {
          if (template.categories.length === 0) return true;
          return item.obligation
            ? matchesCategory(item.obligation.category, template.categories)
            : true;
        })
        .slice(0, 12)
        .map((item) => ({
          name: item.name,
          obligation: item.obligation?.title ?? null,
          createdAt: item.createdAt,
        })),
      recentLogs: logs.slice(0, 8).map((item) => ({
        type: item.type,
        description: item.description,
        site: item.site.name,
        obligation: item.obligation?.title ?? null,
        createdAt: item.createdAt,
      })),
    };

    const report = await this.prisma.statutoryReport.create({
      data: {
        organisationId,
        templateId: template.id,
        title: template.title,
        authority: template.authority,
        kind: template.kind,
        status: evaluated.status === "blocked" ? "blocked" : "generated",
        progress: evaluated.progress,
        dueLabel: evaluated.dueLabel,
        blocker: evaluated.blocker,
        content,
        generatedAt: new Date(),
      },
    });

    return this.presentGenerated(report);
  }

  listGenerated(organisationId: string) {
    return this.prisma.statutoryReport
      .findMany({
        where: { organisationId },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
      .then((rows) => rows.map((row) => this.presentGenerated(row)));
  }

  async getGenerated(organisationId: string, id: string) {
    const report = await this.prisma.statutoryReport.findFirst({
      where: { id, organisationId },
    });
    if (!report) throw new NotFoundException("Report not found");
    return this.presentGenerated(report);
  }

  async pdf(organisationId: string, id: string) {
    const report = await this.getGenerated(organisationId, id);
    const org = await this.prisma.organisation.findUniqueOrThrow({ where: { id: organisationId } });
    const content = (report.content ?? {}) as {
      obligations?: { title: string; category: string; status: string; cadence: string }[];
      evidence?: { name: string; obligation: string | null; createdAt: string }[];
      recentLogs?: { type: string; description: string; site: string; createdAt: string }[];
    };

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 48, size: "A4" });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(20).fillColor("#0b1a2b").text(report.title, { align: "left" });
      doc.moveDown(0.4);
      doc.fontSize(11).fillColor("#52657a").text(`${org.name} · ${report.authority}`);
      if (report.dueLabel) doc.text(report.dueLabel);
      doc.moveDown(1);

      doc.fontSize(13).fillColor("#0b1a2b").text("Duties included");
      doc.moveDown(0.4);
      for (const item of content.obligations ?? []) {
        doc.fontSize(10).fillColor("#0b1a2b").text(`• ${item.title}`);
        doc.fontSize(9).fillColor("#52657a").text(`  ${item.category} · ${item.cadence} · ${item.status.replace(/_/g, " ")}`);
        doc.moveDown(0.3);
      }
      if (!(content.obligations ?? []).length) {
        doc.fontSize(10).fillColor("#52657a").text("No matching obligations were included.");
      }

      doc.moveDown(0.8);
      doc.fontSize(13).fillColor("#0b1a2b").text("Evidence pulled from vault");
      doc.moveDown(0.4);
      for (const item of (content.evidence ?? []).slice(0, 12)) {
        doc
          .fontSize(10)
          .fillColor("#0b1a2b")
          .text(`• ${item.name} — ${item.obligation ?? "Unlinked"}`);
      }
      if (!(content.evidence ?? []).length) {
        doc.fontSize(10).fillColor("#52657a").text("No vault files matched this pack yet.");
      }

      doc.moveDown(1.2);
      doc.fontSize(9).fillColor("#8a9bb0").text("Generated by Ballast · compliance you can prove");
      doc.end();
    });

    const slug = report.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);

    return { buffer, filename: `${slug || "statutory-report"}.pdf` };
  }

  private evaluateTemplate(
    templateId: ReportTemplateId,
    obligations: ObligationRow[],
    meta: { evidenceCount: number; logCount: number; shares: number },
  ) {
    const template = REPORT_TEMPLATES.find((item) => item.id === templateId)!;
    const scoped = this.scopedObligations(templateId, obligations);

    if (templateId === "supplier_summary") {
      const onTrack = obligations.filter((item) => item.status === "on_track").length;
      const progress =
        obligations.length === 0 ? 0 : Math.round((onTrack / obligations.length) * 100);
      const ready = progress >= 70 || meta.shares > 0;
      return {
        id: template.id,
        title: template.title,
        authority: template.authority,
        kind: template.kind,
        progress: Math.max(progress, ready ? 100 : progress),
        status: (ready ? "ready" : progress > 0 ? "draft" : "blocked") as ReportLibraryStatus,
        dueLabel: ready ? "Share link ready" : "Needs more covered duties",
        blocker: ready ? null : "Raise coverage or create a share link first",
        obligationCount: obligations.length,
        coveredCount: onTrack,
      };
    }

    if (scoped.length === 0) {
      const waitingLabel =
        obligations.length === 0
          ? "Add obligations to your register first"
          : "No matching obligations for this pack";
      return {
        id: template.id,
        title: template.title,
        authority: template.authority,
        kind: template.kind,
        progress: obligations.length === 0 ? 0 : meta.evidenceCount > 0 ? 35 : 10,
        status: "draft" as ReportLibraryStatus,
        dueLabel: waitingLabel,
        blocker: null,
        obligationCount: 0,
        coveredCount: 0,
      };
    }

    const overdue = scoped.filter((item) => item.status === "overdue");
    const onTrack = scoped.filter((item) => item.status === "on_track");
    const progress = Math.round((onTrack.length / scoped.length) * 100);

    if (overdue.length > 0) {
      return {
        id: template.id,
        title: template.title,
        authority: template.authority,
        kind: template.kind,
        progress: Math.min(progress, 60),
        status: "blocked" as ReportLibraryStatus,
        dueLabel: `Blocked — ${overdue[0]!.title} overdue`,
        blocker: `${overdue[0]!.title} is overdue. Resolve that obligation to unblock this report.`,
        obligationCount: scoped.length,
        coveredCount: onTrack.length,
      };
    }

    if (progress >= 85 && (meta.evidenceCount > 0 || meta.logCount > 0)) {
      return {
        id: template.id,
        title: template.title,
        authority: template.authority,
        kind: template.kind,
        progress: 100,
        status: "ready" as ReportLibraryStatus,
        dueLabel:
          template.kind === "Scheduled"
            ? this.scheduledDueLabel(scoped, "Ready for scheduled return")
            : "Ready on demand",
        blocker: null,
        obligationCount: scoped.length,
        coveredCount: onTrack.length,
      };
    }

    return {
      id: template.id,
      title: template.title,
      authority: template.authority,
      kind: template.kind,
      progress: Math.max(progress, 40),
      status: "draft" as ReportLibraryStatus,
      dueLabel:
        template.kind === "Scheduled"
          ? this.scheduledDueLabel(scoped, "In draft")
          : `${onTrack.length} of ${scoped.length} duties covered`,
      blocker: null,
      obligationCount: scoped.length,
      coveredCount: onTrack.length,
    };
  }

  private scheduledDueLabel(scoped: ObligationRow[], fallback: string) {
    const next = scoped
      .map((item) => item.nextDueAt)
      .filter((value): value is Date => value != null)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    if (!next) return fallback;
    return `Due ${next.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  }

  private scopedObligations(templateId: ReportTemplateId, obligations: ObligationRow[]) {
    const template = REPORT_TEMPLATES.find((item) => item.id === templateId)!;
    if (template.categories.length === 0) return obligations;
    const matched = obligations.filter((item) => matchesCategory(item.category, template.categories));
    return matched.length > 0 ? matched : obligations.slice(0, Math.min(4, obligations.length));
  }

  private presentGenerated(report: {
    id: string;
    templateId: string;
    title: string;
    authority: string;
    kind: string;
    status: string;
    progress: number;
    dueLabel: string | null;
    blocker: string | null;
    content: unknown;
    generatedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: report.id,
      templateId: report.templateId,
      title: report.title,
      authority: report.authority,
      kind: report.kind,
      status: report.status,
      progress: report.progress,
      dueLabel: report.dueLabel,
      blocker: report.blocker,
      content: report.content,
      generatedAt: report.generatedAt,
      createdAt: report.createdAt,
    };
  }
}
