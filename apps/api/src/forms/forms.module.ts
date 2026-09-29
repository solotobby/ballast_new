import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { AuthModule } from "../auth/auth.module";
import { FormsController } from "./forms.controller";
import { FormsService } from "./forms.service";

@Module({
  imports: [AuthModule, AiModule],
  controllers: [FormsController],
  providers: [FormsService],
  exports: [FormsService],
})
export class FormsModule {}
