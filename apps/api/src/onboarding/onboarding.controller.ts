import { BadRequestException, Body, Controller, Get, Inject, Post, Query, UseGuards } from "@nestjs/common";
import { SECTORS, type Sector } from "@ballast/domain";
import { AuthGuard } from "../auth/auth.guard";
import { AiService } from "../ai/ai.service";
import type { SuggestActivitiesInput } from "../ai/ai.types";

@Controller("onboarding")
@UseGuards(AuthGuard)
export class OnboardingController {
  constructor(@Inject(AiService) private readonly ai: AiService) {}

  @Get("activities")
  activities(@Query("sector") sector: string) {
    if (!SECTORS.some((item) => item.id === sector)) {
      throw new BadRequestException("Select a sector first");
    }
    return this.ai.activitiesForSector(sector as Sector);
  }

  @Post("suggest-activities")
  suggestActivities(@Body() body: SuggestActivitiesInput) {
    if (!body?.sector || !SECTORS.some((item) => item.id === body.sector)) {
      throw new BadRequestException("Select a valid sector first");
    }
    return this.ai.suggestActivitiesForProfile(body);
  }
}
