import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import {
  CreateRegulatorySourceDto,
  OpsFlagActionDto,
  OpsSignInDto,
  TriggerCrawlDto,
  UpdateRegulatorySourceDto,
  ValidateUrlDto,
} from "./dto";
import { OpsAuthGuard } from "./ops-auth.guard";
import { OpsAuthService } from "./ops-auth.service";
import { OpsService } from "./ops.service";

@Controller("ops")
export class OpsController {
  constructor(
    @Inject(OpsAuthService) private readonly auth: OpsAuthService,
    @Inject(OpsService) private readonly ops: OpsService,
  ) {}

  @Post("sign-in")
  async signIn(@Body() dto: OpsSignInDto, @Res({ passthrough: true }) res: Response) {
    const result = this.auth.signIn(dto);
    this.auth.setCookie(res, result.token);
    return { session: result.session };
  }

  @Post("sign-out")
  signOut(@Res({ passthrough: true }) res: Response) {
    this.auth.clearCookie(res);
    return { ok: true };
  }

  @Get("me")
  async me(@Req() req: Request) {
    const session = await this.auth.sessionFromRequest(req);
    if (!session) return { session: null };
    return { session };
  }

  @Get("overview")
  @UseGuards(OpsAuthGuard)
  overview() {
    return this.ops.overview();
  }

  @Get("tenants")
  @UseGuards(OpsAuthGuard)
  tenants() {
    return this.ops.tenants();
  }

  @Get("tenants/:id")
  @UseGuards(OpsAuthGuard)
  tenant(@Param("id") id: string) {
    return this.ops.tenant(id);
  }

  @Get("flags")
  @UseGuards(OpsAuthGuard)
  flags() {
    return this.ops.flagQueue();
  }

  @Patch("flags/:id")
  @UseGuards(OpsAuthGuard)
  resolveFlag(@Param("id") id: string, @Body() dto: OpsFlagActionDto) {
    return this.ops.resolveFlag(id, dto.action);
  }

  @Get("ai")
  @UseGuards(OpsAuthGuard)
  aiQueue() {
    return this.ops.aiQueue();
  }

  @Get("rules")
  @UseGuards(OpsAuthGuard)
  rules() {
    return this.ops.rulesCorpus();
  }

  @Get("vaults")
  @UseGuards(OpsAuthGuard)
  vaults() {
    return this.ops.vaults();
  }

  @Get("health")
  @UseGuards(OpsAuthGuard)
  health() {
    return this.ops.platformHealth();
  }

  @Get("audit")
  @UseGuards(OpsAuthGuard)
  audit() {
    return this.ops.auditTrail();
  }

  @Get("search")
  @UseGuards(OpsAuthGuard)
  search(@Query("q") q = "") {
    return this.ops.search(q);
  }

  @Get("scrapers")
  @UseGuards(OpsAuthGuard)
  scrapers() {
    return this.ops.scrapers();
  }

  @Post("scrapers/validate-url")
  @UseGuards(OpsAuthGuard)
  validateUrl(@Body() dto: ValidateUrlDto) {
    return this.ops.validateUrl(dto.url);
  }

  @Get("scrapers/:id")
  @UseGuards(OpsAuthGuard)
  scraperDetails(@Param("id") id: string) {
    return this.ops.scraperDetails(id);
  }

  @Patch("scrapers/:id")
  @UseGuards(OpsAuthGuard)
  updateRegulatorySource(
    @Param("id") id: string,
    @Body() dto: UpdateRegulatorySourceDto,
    @Req() req: Request,
  ) {
    const session = (req as any).opsSession;
    return this.ops.updateRegulatorySource(id, dto, session?.email ?? "ops@ballast.app");
  }

  @Post("scrapers/crawl")
  @UseGuards(OpsAuthGuard)
  triggerCrawl(@Body() dto: TriggerCrawlDto, @Req() req: Request) {
    const session = (req as any).opsSession;
    return this.ops.triggerCrawl(dto.code, session?.email ?? "ops@ballast.app");
  }

  @Post("scrapers")
  @UseGuards(OpsAuthGuard)
  createRegulatorySource(@Body() dto: CreateRegulatorySourceDto, @Req() req: Request) {
    const session = (req as any).opsSession;
    return this.ops.createRegulatorySource(dto, session?.email ?? "ops@ballast.app");
  }
}



