import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "./auth.types";

type JwtPayload = {
  sub: string;
  organisationId: string;
  role: AuthUser["role"];
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = this.readToken(request);
    if (!token) throw new UnauthorizedException("Sign in required");

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException("Session expired");
    }

    const membership = await this.prisma.organisationUser.findUnique({
      where: {
        organisationId_userId: {
          organisationId: payload.organisationId,
          userId: payload.sub,
        },
      },
      include: { user: true, organisation: true },
    });

    if (!membership) throw new UnauthorizedException("No organisation membership");

    request.user = {
      id: membership.user.id,
      email: membership.user.email,
      name: membership.user.name,
      organisationId: membership.organisationId,
      organisationName: membership.organisation.name,
      role: membership.role as AuthUser["role"],
      siteId: membership.siteId,
    };
    return true;
  }

  private readToken(request: Request): string | null {
    const cookieName = this.config.get<string>("COOKIE_NAME") ?? "ballast_token";
    const fromCookie = request.cookies?.[cookieName];
    if (typeof fromCookie === "string" && fromCookie.length > 0) return fromCookie;
    const header = request.headers.authorization;
    if (header?.startsWith("Bearer ")) return header.slice(7);
    return null;
  }
}
