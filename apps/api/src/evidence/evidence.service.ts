import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AccessService } from "../auth/access.service";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { recordEvidence } from "../obligations/status";
import type { CreateEvidenceDto } from "./dto";

@Injectable()
export class EvidenceService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StorageService) private readonly storage: StorageService,
    @Inject(AccessService) private readonly access: AccessService,
  ) {}

  list(user: AuthUser) {
    const siteId = this.access.evidenceSiteFilter(user);
    return this.prisma.evidenceItem.findMany({
      where: {
        organisationId: user.organisationId,
        ...(siteId ? { OR: [{ siteId }, { siteId: null }] } : {}),
      },
      include: { obligation: true, site: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(
    user: AuthUser,
    createdByName: string,
    dto: CreateEvidenceDto,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
  ) {
    const obligation = await this.prisma.organisationObligation.findFirst({
      where: { id: dto.obligationId, organisationId: user.organisationId },
    });
    if (!obligation) throw new BadRequestException("Link evidence to a duty on this register");

    let siteId: string | null = dto.siteId ?? null;
    if (user.role !== "owner") {
      if (!user.siteId) {
        throw new BadRequestException("Your account is not assigned to a site yet");
      }
      siteId = user.siteId;
    } else if (siteId) {
      const site = await this.prisma.site.findFirst({
        where: { id: siteId, organisationId: user.organisationId },
      });
      if (!site) throw new BadRequestException("Choose a site that belongs to this organisation");
    }

    try {
      this.storage.assertMime(file.mimetype);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "Invalid file");
    }

    const id = randomUUID();
    const storagePath = await this.storage.save(user.organisationId, id, file.buffer);
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException("Expiry date is not valid");
    }

    const item = await this.prisma.evidenceItem.create({
      data: {
        id,
        organisationId: user.organisationId,
        obligationId: obligation.id,
        siteId,
        name: file.originalname || obligation.evidence,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storagePath,
        expiresAt,
        createdByName,
      },
      include: { obligation: true, site: true },
    });

    await recordEvidence(this.prisma, user.organisationId, obligation.id);
    return item;
  }

  async file(user: AuthUser, id: string) {
    const item = await this.prisma.evidenceItem.findFirst({
      where: { id, organisationId: user.organisationId },
    });
    if (!item) throw new NotFoundException("Evidence not found");
    if (user.role !== "owner" && item.siteId && item.siteId !== user.siteId) {
      throw new NotFoundException("Evidence not found");
    }
    const buffer = await this.storage.read(item.storagePath);
    return { item, buffer };
  }
}
