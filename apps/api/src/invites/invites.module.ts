import { Module } from "@nestjs/common";
import { InvitesService } from "./invites.service";
import { PublicInvitesController } from "./public-invites.controller";

@Module({
  controllers: [PublicInvitesController],
  providers: [InvitesService],
  exports: [InvitesService],
})
export class InvitesModule {}
