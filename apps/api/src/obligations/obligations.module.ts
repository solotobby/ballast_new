import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { AuthModule } from "../auth/auth.module";
import { FormsModule } from "../forms/forms.module";
import { ObligationsController } from "./obligations.controller";
import { ObligationsService } from "./obligations.service";

@Module({
  imports: [AuthModule, AiModule, FormsModule],
  controllers: [ObligationsController],
  providers: [ObligationsService],
})
export class ObligationsModule {}
