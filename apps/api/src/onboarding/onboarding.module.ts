import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { AuthModule } from "../auth/auth.module";
import { OnboardingController } from "./onboarding.controller";

@Module({
  imports: [AuthModule, AiModule],
  controllers: [OnboardingController],
})
export class OnboardingModule {}
