import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import type { Activity } from "@ballast/domain";
import { InvitesService } from "../invites/invites.service";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateInviteDto, UpdateProfileDto, UpdateSiteDto } from "./dto";

@Injectable()
export class OrganisationsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(InvitesService) private readonly invites: InvitesService,
  ) {}

  async getMine(organisationId: string) {
    const org = await this.prisma.organisation.findUniqueOrThrow({
      where: { id: organisationId },
      include: { sites: true, invites: { include: { site: true }, orderBy: { createdAt: "asc" } } },
    });
    return this.present(org);
  }

  async updateProfile(organisationId: string, dto: UpdateProfileDto) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organisation.update({
        where: { id: organisationId },
        data: {
          sector: dto.sector,
          sizeBand: dto.sizeBand,
          siteCount: dto.siteCount,
          ...(dto.name !== undefined && dto.name.trim() ? { name: dto.name.trim() } : {}),
          ...(dto.legalName !== undefined ? { legalName: dto.legalName.trim() || null } : {}),
          ...(dto.companyNumber !== undefined ? { companyNumber: dto.companyNumber.trim() || null } : {}),
          ...(dto.sicCode !== undefined ? { sicCode: dto.sicCode.trim() || null } : {}),
          ...(dto.address !== undefined ? { address: dto.address.trim() || null } : {}),
          ...(dto.jurisdiction !== undefined ? { jurisdiction: dto.jurisdiction.trim() || null } : {}),
          ...(dto.council !== undefined ? { council: dto.council.trim() || null } : {}),
          ...(dto.activities !== undefined ? { activities: dto.activities } : {}),
          ...(dto.extraNotes !== undefined ? { extraNotes: dto.extraNotes.trim() || null } : {}),
          ...(dto.onboardingStep ? { onboardingStep: dto.onboardingStep } : {}),
        },
      });

      if (dto.sites && Array.isArray(dto.sites) && dto.sites.length > 0) {
        const existing = await tx.site.findMany({
          where: { organisationId },
          orderBy: { name: "asc" },
        });
        const existingIds = new Set(existing.map((s) => s.id));
        const keepIds: string[] = [];

        for (let i = 0; i < dto.sites.length; i++) {
          const s = dto.sites[i];
          const staff = typeof s.staffCount === "number" ? s.staffCount : parseInt(String(s.staffCount || 0), 10) || 0;
          if (s.id && existingIds.has(s.id)) {
            await tx.site.update({
              where: { id: s.id },
              data: {
                name: s.name.trim() || `Site ${i + 1}`,
                address: s.address?.trim() || null,
                postcode: s.postcode?.trim() || null,
                staffCount: staff,
                description: s.description?.trim() || null,
              },
            });
            keepIds.push(s.id);
          } else {
            const created = await tx.site.create({
              data: {
                organisationId,
                name: s.name.trim() || `Site ${i + 1}`,
                address: s.address?.trim() || null,
                postcode: s.postcode?.trim() || null,
                staffCount: staff,
                description: s.description?.trim() || null,
              },
            });
            keepIds.push(created.id);
          }
        }
        const toDelete = existing.filter((s) => !keepIds.includes(s.id));
        if (toDelete.length > 0) {
          await tx.site.deleteMany({
            where: { id: { in: toDelete.map((s) => s.id) } },
          });
        }
      } else {
        const existing = await tx.site.findMany({
          where: { organisationId },
          orderBy: { name: "asc" },
        });
        if (existing.length < dto.siteCount) {
          const toCreate = dto.siteCount - existing.length;
          await tx.site.createMany({
            data: Array.from({ length: toCreate }, (_, i) => ({
              organisationId,
              name: existing.length + i === 0 ? "Main site" : `Site ${existing.length + i + 1}`,
            })),
          });
        }
      }

      return tx.organisation.findUniqueOrThrow({
        where: { id: org.id },
        include: { sites: true, invites: { include: { site: true }, orderBy: { createdAt: "asc" } } },
      });
    });

    return this.present(updated);
  }

  async setOnboardingStep(organisationId: string, step: string) {
    await this.prisma.organisation.update({
      where: { id: organisationId },
      data: { onboardingStep: step },
    });
    return this.getMine(organisationId);
  }

  listInvites(organisationId: string) {
    return this.prisma.invite.findMany({
      where: { organisationId },
      include: { site: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async createInvite(organisationId: string, dto: CreateInviteDto, invitedBy: string) {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const member = await this.prisma.organisationUser.findUnique({
        where: { organisationId_userId: { organisationId, userId: existingUser.id } },
      });
      if (member) throw new ConflictException("That person is already in this organisation");
    }

    let siteId: string | null = dto.siteId ?? null;
    if (siteId) {
      const site = await this.prisma.site.findFirst({ where: { id: siteId, organisationId } });
      if (!site) throw new BadRequestException("Choose a site that belongs to this organisation");
    }

    const organisation = await this.prisma.organisation.findUniqueOrThrow({
      where: { id: organisationId },
    });

    let invite;
    try {
      invite = await this.prisma.invite.create({
        data: {
          organisationId,
          email,
          role: dto.role,
          siteId,
          status: "pending",
          token: randomBytes(18).toString("hex"),
        },
        include: { site: true },
      });
    } catch {
      throw new ConflictException("An invite is already waiting for that email");
    }

    try {
      await this.invites.sendInviteEmail(invite, organisation, invitedBy);
    } catch (error) {
      await this.prisma.invite.delete({ where: { id: invite.id } });
      const message = error instanceof Error ? error.message : "Could not send invite email";
      throw new BadRequestException(message);
    }

    return invite;
  }

  async listSites(organisationId: string) {
    return this.prisma.site.findMany({
      where: { organisationId },
      orderBy: { name: "asc" },
    });
  }

  async updateSite(organisationId: string, siteId: string, dto: UpdateSiteDto) {
    const existing = await this.prisma.site.findFirst({
      where: { id: siteId, organisationId },
    });
    if (!existing) throw new NotFoundException("Site not found");

    return this.prisma.site.update({
      where: { id: siteId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.address !== undefined ? { address: dto.address.trim() || null } : {}),
        ...(dto.postcode !== undefined ? { postcode: dto.postcode.trim() || null } : {}),
        ...(dto.kind !== undefined ? { kind: dto.kind.trim() || null } : {}),
        ...(dto.staffCount !== undefined ? { staffCount: dto.staffCount } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
      },
    });
  }

  private present(org: {
    id: string;
    name: string;
    legalName?: string | null;
    companyNumber?: string | null;
    sicCode?: string | null;
    address?: string | null;
    jurisdiction?: string | null;
    council?: string | null;
    sector: string | null;
    sizeBand: string | null;
    siteCount: number;
    activities: unknown;
    extraNotes: string | null;
    onboardingStep?: string;
    sites: {
      id: string;
      name: string;
      address: string | null;
      postcode?: string | null;
      kind: string | null;
      staffCount?: number;
      description?: string | null;
    }[];
    invites?: {
      id: string;
      email: string;
      role: string;
      status: string;
      site: { id: string; name: string } | null;
    }[];
  }) {
    return {
      id: org.id,
      name: org.name,
      legalName: org.legalName ?? null,
      companyNumber: org.companyNumber ?? null,
      sicCode: org.sicCode ?? null,
      address: org.address ?? null,
      jurisdiction: org.jurisdiction ?? null,
      council: org.council ?? null,
      sector: org.sector,
      sizeBand: org.sizeBand,
      siteCount: org.siteCount,
      activities: Array.isArray(org.activities) ? (org.activities as Activity[]) : [],
      extraNotes: org.extraNotes,
      sites: org.sites,
      invites: org.invites ?? [],
      onboardingStep: org.onboardingStep ?? "done",
      profileComplete: Boolean(org.sector && org.sizeBand),
    };
  }
}
