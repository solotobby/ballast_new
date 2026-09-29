import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Inject } from "@nestjs/common";
import type { Request } from "express";
import { OpsAuthService } from "./ops-auth.service";

@Injectable()
export class OpsAuthGuard implements CanActivate {
  constructor(@Inject(OpsAuthService) private readonly auth: OpsAuthService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const session = await this.auth.sessionFromRequest(req);
    if (!session) throw new UnauthorizedException("Ops sign-in required");
    (req as Request & { opsUser?: typeof session }).opsUser = session;
    return true;
  }
}
