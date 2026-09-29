import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateSiteDto, UpdateMemberDto, UpdateSiteDto } from "./dto";

const AVATAR_COLORS = ["#1f6feb", "#0f9e8e", "#7b5bd6", "#d9910a", "#d64545", "#1f9d57"];

function coverageTone(coverage: number) {
  if (coverage >= 80) return "ok" as const;
  if (coverage >= 60) return "due" as const;
  return "over" as const;
}

@Injectable()
export class TeamService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async overview(user: AuthUser) {
    const organisationId = user.organisationId;
    const [org, members, invites, obligations] = await Promise.all([
      this.prisma.organisation.findUniqueOrThrow({
        where: { id: organisationId },
        include: { sites: { orderBy: { name: "asc" } } },
      }),
      this.prisma.organisationUser.findMany({
        where: { organisationId },
        include: {
          user: { select: { id: true, name: true, email: true } },
          site: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.invite.findMany({
        where: { organisationId, status: "pending" },
        include: { site: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.organisationObligation.findMany({
        where: { organisationId },
        select: { id: true, status: true },
      }),
    ]);

    const onTrack = obligations.filter((item) => item.status === "on_track").length;
    const baseCoverage =
      obligations.length === 0 ? 0 : Math.round((onTrack / obligations.length) * 100);

    const siteActivity = await this.prisma.site.findMany({
      where: { organisationId },
      select: {
        id: true,
        _count: { select: { logbook: true, evidence: true, invites: true, members: true } },
      },
    });
    const activityBySite = new Map(siteActivity.map((site) => [site.id, site._count]));

    const siteFilter = user.role === "owner" ? undefined : user.siteId;
    if (user.role !== "owner" && !siteFilter) {
      throw new ForbiddenException("Your account is not assigned to a site yet");
    }

    const filteredMembers = siteFilter
      ? members.filter((member) => member.role === "owner" || member.siteId === siteFilter)
      : members;
    const filteredInvites = siteFilter
      ? invites.filter((invite) => invite.siteId === siteFilter)
      : invites;

    const sites = org.sites
      .filter((site) => !siteFilter || site.id === siteFilter)
      .map((site, index) => {
      const activity = activityBySite.get(site.id);
      const activityBoost = Math.min(
        15,
        ((activity?.logbook ?? 0) + (activity?.evidence ?? 0)) * 3,
      );
      const coverage = Math.min(100, Math.max(0, baseCoverage - index * 4 + activityBoost));
      const lead =
        filteredMembers.find((m) => m.siteId === site.id && m.role === "site_manager") ??
        filteredMembers.find((m) => m.role === "owner");
      const pendingLead = filteredInvites.find((invite) => invite.siteId === site.id);

      return {
        id: site.id,
        name: site.name,
        address: site.address,
        kind: site.kind,
        coverage,
        coverageTone: coverageTone(coverage),
        staffCount: (activity?.members ?? 0) + (activity?.invites ?? 0),
        leadName: lead?.user.name ?? lead?.user.email ?? null,
        leadPending: !lead && Boolean(pendingLead),
      };
    });

    const presentedMembers = filteredMembers.map((member, index) => {
      const scope =
        member.role === "owner"
          ? "All sites · full access"
          : member.site
            ? `${member.site.name} · ${member.role === "site_manager" ? "logbook & evidence" : "scoped duties"}`
            : "Unassigned site";
      return {
        id: member.id,
        userId: member.userId,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        siteId: member.siteId,
        siteName: member.site?.name ?? null,
        scope,
        status: "active" as const,
        lastActiveLabel: member.role === "owner" ? "Active now" : "Member",
        avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
      };
    });

    const presentedInvites = filteredInvites.map((invite, index) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      site: invite.site,
      name: invite.email.split("@")[0] ?? invite.email,
      scope: invite.site
        ? `${invite.site.name} · invite pending`
        : "Invite pending",
      lastActiveLabel: "Invite sent",
      avatarColor: AVATAR_COLORS[(filteredMembers.length + index) % AVATAR_COLORS.length],
    }));

    return {
      sites,
      members: presentedMembers,
      invites: presentedInvites,
      siteCount: org.siteCount,
    };
  }

  async createSite(organisationId: string, dto: CreateSiteDto) {
    const count = await this.prisma.site.count({ where: { organisationId } });
    if (count >= 20) throw new BadRequestException("You can add up to 20 sites");

    const site = await this.prisma.$transaction(async (tx) => {
      const created = await tx.site.create({
        data: {
          organisationId,
          name: dto.name.trim(),
          address: dto.address?.trim() || null,
          postcode: dto.postcode?.trim() || null,
          staffCount: dto.staffCount ?? 0,
          description: dto.description?.trim() || null,
          kind: dto.kind?.trim() || null,
        },
      });
      await tx.organisation.update({
        where: { id: organisationId },
        data: { siteCount: count + 1 },
      });
      return created;
    });

    return site;
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
        ...(dto.staffCount !== undefined ? { staffCount: dto.staffCount } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
        ...(dto.kind !== undefined ? { kind: dto.kind.trim() || null } : {}),
      },
    });
  }

  async revokeInvite(organisationId: string, inviteId: string) {
    const invite = await this.prisma.invite.findFirst({
      where: { id: inviteId, organisationId },
    });
    if (!invite) throw new NotFoundException("Invite not found");
    await this.prisma.invite.delete({ where: { id: inviteId } });
    return { ok: true };
  }

  async updateMember(
    organisationId: string,
    membershipId: string,
    actorRole: string,
    dto: UpdateMemberDto,
  ) {
    if (actorRole !== "owner") {
      throw new ForbiddenException("Only owners can change team roles");
    }

    const member = await this.prisma.organisationUser.findFirst({
      where: { id: membershipId, organisationId },
    });
    if (!member) throw new NotFoundException("Member not found");
    if (member.role === "owner") {
      throw new BadRequestException("Owner role cannot be changed here");
    }

    let siteId = dto.siteId === undefined ? undefined : dto.siteId;
    if (siteId) {
      const site = await this.prisma.site.findFirst({ where: { id: siteId, organisationId } });
      if (!site) throw new BadRequestException("Choose a site that belongs to this organisation");
    }

    return this.prisma.organisationUser.update({
      where: { id: membershipId },
      data: {
        ...(dto.role ? { role: dto.role } : {}),
        ...(siteId !== undefined ? { siteId } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        site: { select: { id: true, name: true } },
      },
    });
  }
}
