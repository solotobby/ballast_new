import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import type { AuthUser } from "../auth/auth.types";
import { FlagObligationDto, UpdateStatusDto } from "./dto";
import { ObligationsService } from "./obligations.service";

@Controller("obligations")
@UseGuards(AuthGuard, RolesGuard)
export class ObligationsController {
  constructor(@Inject(ObligationsService) private readonly obligations: ObligationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.obligations.list(user.organisationId);
  }

  @Post("generate")
  @Roles("owner")
  generate(@CurrentUser() user: AuthUser) {
    return this.obligations.generate(user.organisationId);
  }

  @Post("confirm-all")
  @Roles("owner")
  confirmAll(@CurrentUser() user: AuthUser) {
    return this.obligations.confirmAll(user.organisationId);
  }

  @Get(":id")
  getOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.obligations.getOne(user.organisationId, id);
  }

  @Patch(":id/status")
  @Roles("owner", "site_manager")
  updateStatus(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateStatusDto) {
    return this.obligations.updateStatus(user.organisationId, id, dto.status);
  }

  @Post(":id/confirm")
  @Roles("owner")
  confirm(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.obligations.confirm(user.organisationId, id);
  }

  @Post(":id/flag")
  @Roles("owner")
  flag(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: FlagObligationDto) {
    return this.obligations.flag(user.organisationId, id, dto.reason);
  }
}
