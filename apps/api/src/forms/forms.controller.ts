import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import type { AuthUser } from "../auth/auth.types";
import { SaveAnswersDto } from "./dto";
import { FormsService } from "./forms.service";

@Controller("obligations")
@UseGuards(AuthGuard, RolesGuard)
export class FormsController {
  constructor(@Inject(FormsService) private readonly forms: FormsService) {}

  @Get(":id/form")
  getForm(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.forms.getForObligation(user.organisationId, id);
  }

  @Post(":id/form/generate")
  @Roles("owner", "site_manager")
  generate(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Query("force") force?: string,
  ) {
    return this.forms.generate(user.organisationId, id, force === "1" || force === "true");
  }

  @Put(":id/form/answers")
  @Roles("owner", "site_manager")
  saveAnswers(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: SaveAnswersDto) {
    return this.forms.saveAnswers(user.organisationId, id, dto.answers);
  }

  @Post(":id/form/submit")
  @Roles("owner", "site_manager")
  submit(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: SaveAnswersDto) {
    return this.forms.submit(user.organisationId, id, dto.answers);
  }
}
