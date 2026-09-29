import { Controller, Get, Inject, Param } from "@nestjs/common";
import { SharesService } from "./shares.service";

@Controller("public/shares")
export class PublicSharesController {
  constructor(@Inject(SharesService) private readonly shares: SharesService) {}

  @Get(":token")
  view(@Param("token") token: string) {
    return this.shares.publicView(token);
  }
}
