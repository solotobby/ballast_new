import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AccessService } from "../auth/access.service";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { recordEvidence } from "../obligations/status";
import type { CreateLogDto } from "./dto";

@Injectable()
export class LogbookService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StorageService) private readonly storage: StorageService,
    @Inject(AccessService) private readonly access: AccessService,
  ) {}

  list(user: AuthUser) {
    const siteId = this.access.logbookSiteFilter(user);
    return this.prisma.logbookEntry.findMany({
      where: {
        organisationId: user.organisationId,
        ...(siteId ? { siteId } : {}),
      },
      include: { site: true, obligation: true, evidence: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(
    user: AuthUser,
    createdByName: string,
    dto: CreateLogDto,
    file?: { originalname: string; mimetype: string; size: number; buffer: Buffer },
  ) {
    this.access.assertSiteAccess(user, dto.siteId);
    const site = await this.prisma.site.findFirst({
      where: { id: dto.siteId, organisationId: user.organisationId },
    });
    if (!site) throw new BadRequestException("Choose a site that belongs to this organisation");

    let obligationId: string | null = null;
    if (dto.obligationId) {
      const obligation = await this.prisma.organisationObligation.findFirst({
        where: { id: dto.obligationId, organisationId: user.organisationId },
      });
      if (!obligation) throw new BadRequestException("That obligation is not on this register");
      obligationId = obligation.id;
    }

    const entry = await this.prisma.logbookEntry.create({
      data: {
        organisationId: user.organisationId,
        siteId: site.id,
        obligationId,
        type: dto.type.trim(),
        category: dto.category.trim(),
        description: dto.description.trim(),
        createdByName,
      },
    });

    if (file) {
      try {
        this.storage.assertMime(file.mimetype);
      } catch (error) {
        throw new BadRequestException(error instanceof Error ? error.message : "Invalid file");
      }
      const id = randomUUID();
      const storagePath = await this.storage.save(user.organisationId, id, file.buffer);
      await this.prisma.evidenceItem.create({
        data: {
          id,
          organisationId: user.organisationId,
          obligationId,
          logbookEntryId: entry.id,
          siteId: site.id,
          name: file.originalname || "Photo",
          mimeType: file.mimetype,
          sizeBytes: file.size,
          storagePath,
          createdByName,
        },
      });
    }

    if (obligationId) await recordEvidence(this.prisma, user.organisationId, obligationId);

    return this.prisma.logbookEntry.findFirstOrThrow({
      where: { id: entry.id, organisationId: user.organisationId },
      include: { site: true, obligation: true, evidence: true },
    });
  }

  async getOne(organisationId: string, id: string) {
    const row = await this.prisma.logbookEntry.findFirst({
      where: { id, organisationId },
      include: { site: true, obligation: true, evidence: true },
    });
    if (!row) throw new NotFoundException("Log entry not found");
    return row;
  }
}
