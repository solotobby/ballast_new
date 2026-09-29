import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { OpsAuthGuard } from "./ops-auth.guard";
import { OpsAuthService } from "./ops-auth.service";
import { OpsController } from "./ops.controller";
import { OpsService } from "./ops.service";

@Module({
  imports: [AuthModule],
  controllers: [OpsController],
  providers: [OpsService, OpsAuthService, OpsAuthGuard],
})
export class OpsModule {}
