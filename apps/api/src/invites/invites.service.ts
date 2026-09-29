import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "../auth/auth.types";

const ROLE_LABEL: Record<string, string> = {
  site_manager: "Site Manager",
  staff: "Staff",
};

@Injectable()
export class InvitesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MailService) private readonly mail: MailService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  async preview(token: string) {
    const invite = await this.prisma.invite.findFirst({
      where: { token },
      include: { organisation: true, site: true },
    });
    if (!invite || invite.status !== "pending") {
      throw new NotFoundException("This invite is no longer available");
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: invite.email },
    });

    return {
      email: invite.email,
      role: invite.role,
      roleLabel: ROLE_LABEL[invite.role] ?? invite.role,
      organisationName: invite.organisation.name,
      siteName: invite.site?.name ?? null,
      status: invite.status,
      requiresPassword: !existingUser,
    };
  }

  async sendInviteEmail(
    invite: {
      id: string;
      email: string;
      role: string;
      token: string | null;
      site: { name: string } | null;
    },
    organisation: { name: string },
    invitedBy: string,
  ) {
    if (!invite?.token) {
      throw new BadRequestException("Invite link is missing a token — resend the invite");
    }
    const inviteUrl = `${this.appUrl()}/invite/${invite.token}`;
    await this.mail.sendInvite({
      to: invite.email,
      organisationName: organisation.name,
      role: invite.role,
      siteName: invite.site?.name ?? null,
      inviteUrl,
      invitedBy,
    });
    await this.prisma.invite.update({
      where: { id: invite.id },
      data: { sentAt: new Date() },
    });
  }

  async accept(
    token: string,
    input: { name?: string; password?: string },
    currentUserId?: string,
  ): Promise<AuthUser> {
    const invite = await this.prisma.invite.findFirst({
      where: { token },
      include: { organisation: true, site: true },
    });
    if (!invite || invite.status !== "pending") {
      throw new NotFoundException("This invite is no longer available");
    }

    let userId = currentUserId ?? null;

    if (userId) {
      const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
      if (user.email !== invite.email) {
        throw new BadRequestException("Sign in with the invited email address to accept");
      }
    } else {
      const existing = await this.prisma.user.findUnique({ where: { email: invite.email } });
      if (existing) {
        throw new BadRequestException("An account already exists for this email — sign in first");
      }
      if (!input.password) {
        throw new BadRequestException("Choose a password to create your account");
      }
      const created = await this.prisma.user.create({
        data: {
          email: invite.email,
          passwordHash: await hash(input.password, 12),
          name: input.name?.trim() || null,
        },
      });
      userId = created.id;
    }

    const existingMembership = await this.prisma.organisationUser.findUnique({
      where: {
        organisationId_userId: { organisationId: invite.organisationId, userId },
      },
    });
    if (existingMembership) {
      throw new ConflictException("You are already a member of this organisation");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.organisationUser.create({
        data: {
          organisationId: invite.organisationId,
          userId,
          role: invite.role,
          siteId: invite.siteId,
        },
      });
      await tx.invite.update({
        where: { id: invite.id },
        data: { status: "accepted", acceptedAt: new Date() },
      });
    });

    const membership = await this.prisma.organisationUser.findUniqueOrThrow({
      where: {
        organisationId_userId: { organisationId: invite.organisationId, userId },
      },
      include: { user: true, organisation: true },
    });

    return {
      id: membership.user.id,
      email: membership.user.email,
      name: membership.user.name,
      organisationId: membership.organisationId,
      organisationName: membership.organisation.name,
      role: membership.role as AuthUser["role"],
      siteId: membership.siteId,
    };
  }

  private appUrl() {
    return (this.config.get<string>("APP_URL") ?? "http://localhost:3000").replace(/\/$/, "");
  }
}
