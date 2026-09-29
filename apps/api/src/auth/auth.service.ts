import { BadRequestException, ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { randomBytes, createHash } from "node:crypto";
import { hash, compare } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import type { ForgotPasswordDto, ResetPasswordDto, SignInDto, SignUpDto, UpdateMeDto } from "./dto";
import type { AuthUser } from "./auth.types";

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(MailService) private readonly mail: MailService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  async signUp(dto: SignUpDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException("An account with that email already exists");

    const passwordHash = await hash(dto.password, 12);
    const created = await this.prisma.$transaction(async (tx) => {
      const organisation = await tx.organisation.create({
        data: {
          name: dto.businessName.trim(),
          onboardingStep: "profile",
          sector: "hospitality",
          sizeBand: "11_50",
        },
      });
      const user = await tx.user.create({
        data: { email, passwordHash, name: null },
      });
      await tx.organisationUser.create({
        data: {
          organisationId: organisation.id,
          userId: user.id,
          role: "owner",
        },
      });
      await tx.site.create({
        data: { organisationId: organisation.id, name: "Main site" },
      });
      return { organisation, user };
    });

    const authUser: AuthUser = {
      id: created.user.id,
      email: created.user.email,
      name: created.user.name,
      organisationId: created.organisation.id,
      organisationName: created.organisation.name,
      role: "owner",
      siteId: null,
    };
    return { user: authUser, token: await this.signToken(authUser) };
  }

  async signIn(dto: SignInDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { memberships: { include: { organisation: true }, orderBy: { createdAt: "asc" }, take: 1 } },
    });
    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password");
    }
    const membership = user.memberships[0];
    if (!membership) throw new UnauthorizedException("No organisation membership");

    const authUser = this.toAuthUser(user, membership);
    return { user: authUser, token: await this.signToken(authUser) };
  }

  async updateMe(userId: string, organisationId: string, dto: UpdateMeDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (dto.newPassword) {
      if (!dto.currentPassword || !(await compare(dto.currentPassword, user.passwordHash))) {
        throw new UnauthorizedException("Current password is incorrect");
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() || null } : {}),
        ...(dto.newPassword ? { passwordHash: await hash(dto.newPassword, 12) } : {}),
      },
    });

    const membership = await this.prisma.organisationUser.findUnique({
      where: { organisationId_userId: { organisationId, userId } },
      include: { organisation: true },
    });
    if (!membership) throw new UnauthorizedException("No organisation membership");

    return this.toAuthUser(updated, membership);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Return success message even if email not found to prevent user enumeration
    if (!user) {
      return { ok: true, message: "If an account exists with that email, a password reset link has been sent." };
    }

    // Invalidate any existing unused reset tokens for this user
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const appUrl = this.config.get<string>("APP_URL") ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await this.mail.sendPasswordReset({
      to: user.email,
      resetUrl,
    });

    return { ok: true, message: "If an account exists with that email, a password reset link has been sent." };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = createHash("sha256").update(dto.token).digest("hex");
    const resetRecord = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new BadRequestException("Invalid or expired password reset link");
    }

    const newPasswordHash = await hash(dto.password, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newPasswordHash },
      });
      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });
    });

    return { ok: true, message: "Password updated successfully" };
  }

  signToken(user: AuthUser) {
    return this.jwt.signAsync({
      sub: user.id,
      organisationId: user.organisationId,
      role: user.role,
    });
  }

  private toAuthUser(
    user: { id: string; email: string; name: string | null },
    membership: { organisationId: string; role: string; siteId: string | null; organisation: { name: string } },
  ): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      organisationId: membership.organisationId,
      organisationName: membership.organisation.name,
      role: membership.role as AuthUser["role"],
      siteId: membership.siteId,
    };
  }
}
