import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import type { AuthUser } from "../auth/auth.types";
import { CreateSiteDto, UpdateMemberDto, UpdateSiteDto } from "./dto";
import { TeamService } from "./team.service";

@Controller("team")
@UseGuards(AuthGuard, RolesGuard)
export class TeamController {
  constructor(@Inject(TeamService) private readonly team: TeamService) {}

  @Get()
  @Roles("owner", "site_manager")
  overview(@CurrentUser() user: AuthUser) {
    return this.team.overview(user);
  }

  @Post("sites")
  @Roles("owner")
  createSite(@CurrentUser() user: AuthUser, @Body() dto: CreateSiteDto) {
    return this.team.createSite(user.organisationId, dto);
  }

  @Patch("sites/:id")
  @Roles("owner")
  updateSite(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateSiteDto) {
    return this.team.updateSite(user.organisationId, id, dto);
  }

  @Delete("invites/:id")
  @Roles("owner")
  revokeInvite(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.team.revokeInvite(user.organisationId, id);
  }

  @Patch("members/:id")
  @Roles("owner")
  updateMember(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.team.updateMember(user.organisationId, id, user.role, dto);
  }
}
