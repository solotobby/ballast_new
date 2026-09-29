import { Injectable, UnauthorizedException, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Request, Response } from "express";
import { OpsSignInDto } from "./dto";

export type OpsSession = {
  username: string;
  role: "ops";
};

@Injectable()
export class OpsAuthService {
  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {}

  cookieName() {
    return this.config.get<string>("OPS_COOKIE_NAME") ?? "ballast_ops_token";
  }

  credentialsConfigured() {
    return Boolean(this.config.get<string>("OPS_ADMIN_USER") && this.config.get<string>("OPS_ADMIN_PASSWORD"));
  }

  signIn(dto: OpsSignInDto) {
    const user = this.config.get<string>("OPS_ADMIN_USER") ?? "ops@ballast.internal";
    const pass = this.config.get<string>("OPS_ADMIN_PASSWORD") ?? "ballastops";
    if (dto.username.trim() !== user || dto.password !== pass) {
      throw new UnauthorizedException("Invalid ops credentials");
    }
    const session: OpsSession = { username: user, role: "ops" };
    const token = this.jwt.sign({ ...session, sub: "ops" });
    return { token, session };
  }

  setCookie(res: Response, token: string) {
    res.cookie(this.cookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 8 * 60 * 60 * 1000,
    });
  }

  clearCookie(res: Response) {
    res.clearCookie(this.cookieName(), { path: "/" });
  }

  async sessionFromRequest(req: Request): Promise<OpsSession | null> {
    const raw = req.cookies?.[this.cookieName()];
    if (typeof raw !== "string" || !raw) return null;
    try {
      const payload = await this.jwt.verifyAsync<OpsSession & { sub: string }>(raw);
      if (payload.role !== "ops") return null;
      return { username: payload.username, role: "ops" };
    } catch {
      return null;
    }
  }
}
