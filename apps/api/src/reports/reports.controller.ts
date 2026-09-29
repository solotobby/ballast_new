import { Controller, Get, Inject, Param, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import type { AuthUser } from "../auth/auth.types";
import { ReportsService } from "./reports.service";

@Controller("reports")
@UseGuards(AuthGuard, RolesGuard)
@Roles("owner", "site_manager")
export class ReportsController {
  constructor(@Inject(ReportsService) private readonly reports: ReportsService) {}

  @Get()
  library(@CurrentUser() user: AuthUser) {
    return this.reports.library(user.organisationId);
  }

  @Get("generated")
  listGenerated(@CurrentUser() user: AuthUser) {
    return this.reports.listGenerated(user.organisationId);
  }

  @Get("generated/:id/pdf")
  async pdf(@CurrentUser() user: AuthUser, @Param("id") id: string, @Res() res: Response) {
    const { buffer, filename } = await this.reports.pdf(user.organisationId, id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get("generated/:id")
  getGenerated(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.reports.getGenerated(user.organisationId, id);
  }

  @Post(":templateId/generate")
  generate(@CurrentUser() user: AuthUser, @Param("templateId") templateId: string) {
    return this.reports.generate(
      user.organisationId,
      templateId,
      user.name?.trim() || user.email,
    );
  }
}
