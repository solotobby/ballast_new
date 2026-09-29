import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AccessService } from "../auth/access.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import type { AuthUser } from "../auth/auth.types";
import { CreateInviteDto, OnboardingStepDto, UpdateProfileDto, UpdateSiteDto } from "./dto";
import { OrganisationsService } from "./organisations.service";

@Controller("organisations")
@UseGuards(AuthGuard, RolesGuard)
export class OrganisationsController {
  constructor(
    @Inject(OrganisationsService) private readonly organisations: OrganisationsService,
    @Inject(AccessService) private readonly access: AccessService,
  ) {}

  @Get("me")
  getMine(@CurrentUser() user: AuthUser) {
    return this.organisations.getMine(user.organisationId);
  }

  @Patch("me/profile")
  @Roles("owner")
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.organisations.updateProfile(user.organisationId, dto);
  }

  @Get("me/sites")
  listSites(@CurrentUser() user: AuthUser) {
    return this.organisations.listSites(user.organisationId);
  }

  @Patch("me/sites/:id")
  @Roles("owner", "site_manager")
  updateSite(
    @CurrentUser() user: AuthUser,
    @Param("id") siteId: string,
    @Body() dto: UpdateSiteDto,
  ) {
    return this.organisations.updateSite(user.organisationId, siteId, dto);
  }

  @Patch("me/onboarding")
  @Roles("owner")
  setOnboarding(@CurrentUser() user: AuthUser, @Body() dto: OnboardingStepDto) {
    return this.organisations.setOnboardingStep(user.organisationId, dto.step);
  }

  @Get("me/invites")
  @Roles("owner")
  listInvites(@CurrentUser() user: AuthUser) {
    return this.organisations.listInvites(user.organisationId);
  }

  @Post("me/invites")
  @Roles("owner")
  createInvite(@CurrentUser() user: AuthUser, @Body() dto: CreateInviteDto) {
    return this.organisations.createInvite(
      user.organisationId,
      dto,
      user.name?.trim() || user.email,
    );
  }
}

