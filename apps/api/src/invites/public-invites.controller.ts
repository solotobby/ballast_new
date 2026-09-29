import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { InvitesService } from "./invites.service";
import { AcceptInviteDto } from "./dto";

@Controller("public/invites")
export class PublicInvitesController {
  constructor(@Inject(InvitesService) private readonly invites: InvitesService) {}

  @Get(":token")
  preview(@Param("token") token: string) {
    return this.invites.preview(token);
  }
}
