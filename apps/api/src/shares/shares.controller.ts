import { Body, Controller, Get, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import type { AuthUser } from "../auth/auth.types";
import { CreateShareDto } from "./dto";
import { SharesService } from "./shares.service";

@Controller("shares")
@UseGuards(AuthGuard, RolesGuard)
@Roles("owner")
export class SharesController {
  constructor(@Inject(SharesService) private readonly shares: SharesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.shares.list(user.organisationId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateShareDto) {
    return this.shares.create(user.organisationId, user.name?.trim() || user.email, dto);
  }

  @Post(":id/revoke")
  revoke(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.shares.revoke(user.organisationId, id);
  }
}
