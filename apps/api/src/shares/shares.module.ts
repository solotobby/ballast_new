import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PublicSharesController } from "./public-shares.controller";
import { SharesController } from "./shares.controller";
import { SharesService } from "./shares.service";

@Module({
  imports: [AuthModule],
  controllers: [SharesController, PublicSharesController],
  providers: [SharesService],
})
export class SharesModule {}
