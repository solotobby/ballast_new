import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { refreshObligationStatus } from "../obligations/status";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateShareDto } from "./dto";

@Injectable()
export class SharesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  list(organisationId: string) {
    return this.prisma.shareGrant.findMany({
      where: { organisationId },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(organisationId: string, createdByName: string, dto: CreateShareDto) {
    await refreshObligationStatus(this.prisma, organisationId);
    const register = await this.prisma.organisationObligation.findMany({
      where: { organisationId },
    });
    const requested = dto.obligationIds?.filter(Boolean) ?? [];
    const allowed = new Set(register.map((item) => item.id));
    const obligationIds = (requested.length ? requested : register.map((item) => item.id)).filter((id) =>
      allowed.has(id),
    );

    return this.prisma.shareGrant.create({
      data: {
        organisationId,
        token: randomBytes(18).toString("hex"),
        title: dto.title.trim(),
        obligationIds,
        createdByName,
      },
    });
  }

  async revoke(organisationId: string, id: string) {
    const result = await this.prisma.shareGrant.updateMany({
      where: { id, organisationId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException("Share not found");
    return this.prisma.shareGrant.findFirstOrThrow({ where: { id, organisationId } });
  }

  async publicView(token: string) {
    const share = await this.prisma.shareGrant.findFirst({
      where: { token, revokedAt: null },
      include: { organisation: true },
    });
    if (!share) throw new NotFoundException("This share link is not available");

    await refreshObligationStatus(this.prisma, share.organisationId);
    const ids = Array.isArray(share.obligationIds) ? (share.obligationIds as string[]) : [];
    const obligations = await this.prisma.organisationObligation.findMany({
      where: { organisationId: share.organisationId, id: { in: ids } },
      orderBy: [{ category: "asc" }, { title: "asc" }],
    });

    const covered = obligations.filter((item) => item.status === "on_track").length;
    return {
      title: share.title,
      organisationName: share.organisation.name,
      sector: share.organisation.sector,
      siteCount: share.organisation.siteCount,
      createdAt: share.createdAt,
      coverage: obligations.length === 0 ? 0 : Math.round((covered / obligations.length) * 100),
      obligations: obligations.map((item) => ({
        title: item.title,
        category: item.category,
        basis: item.basis,
        cadence: item.cadence,
        status: item.status,
      })),
    };
  }
}
