import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Request, Response } from "express";
import { AcceptInviteDto } from "../invites/dto";
import { InvitesService } from "../invites/invites.service";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./current-user.decorator";
import { ForgotPasswordDto, ResetPasswordDto, SignInDto, SignUpDto, UpdateMeDto } from "./dto";
import type { AuthUser } from "./auth.types";

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(InvitesService) private readonly invites: InvitesService,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  @Post("sign-up")
  async signUp(@Body() dto: SignUpDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.signUp(dto);
    this.setCookie(res, result.token);
    return { user: result.user };
  }

  @Post("sign-in")
  async signIn(@Body() dto: SignInDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.signIn(dto);
    this.setCookie(res, result.token);
    return { user: result.user };
  }

  @Post("forgot-password")
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Post("accept-invite")
  async acceptInvite(
    @Body() dto: AcceptInviteDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const currentUserId = await this.optionalUserId(req);
    const user = await this.invites.accept(
      dto.token,
      { name: dto.name, password: dto.password },
      currentUserId,
    );
    const token = await this.auth.signToken(user);
    this.setCookie(res, token);
    return { user };
  }

  @Post("sign-out")
  signOut(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(this.cookieName(), { path: "/" });
    return { ok: true };
  }

  @Get("me")
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }

  @Patch("me")
  @UseGuards(AuthGuard)
  async updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto) {
    return { user: await this.auth.updateMe(user.id, user.organisationId, dto) };
  }

  private cookieName() {
    return this.config.get<string>("COOKIE_NAME") ?? "ballast_token";
  }

  private setCookie(res: Response, token: string) {
    res.cookie(this.cookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private async optionalUserId(req: Request): Promise<string | undefined> {
    const cookieName = this.cookieName();
    const fromCookie = req.cookies?.[cookieName];
    const header = req.headers.authorization;
    const raw =
      typeof fromCookie === "string" && fromCookie.length > 0
        ? fromCookie
        : header?.startsWith("Bearer ")
          ? header.slice(7)
          : null;
    if (!raw) return undefined;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(raw);
      return payload.sub;
    } catch {
      return undefined;
    }
  }
}
