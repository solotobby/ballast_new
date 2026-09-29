import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { InvitesModule } from "../invites/invites.module";
import { OrganisationsController } from "./organisations.controller";
import { OrganisationsService } from "./organisations.service";

@Module({
  imports: [AuthModule, InvitesModule],
  controllers: [OrganisationsController],
  providers: [OrganisationsService],
  exports: [OrganisationsService],
})
export class OrganisationsModule {}
