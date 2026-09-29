import { ForbiddenException, Injectable } from "@nestjs/common";
import type { UserRole } from "@ballast/domain";
import type { AuthUser } from "./auth.types";

@Injectable()
export class AccessService {
  assertRole(user: AuthUser, ...roles: UserRole[]) {
    if (!roles.includes(user.role)) {
      throw new ForbiddenException("You do not have permission to do that");
    }
  }

  assertOwner(user: AuthUser) {
    this.assertRole(user, "owner");
  }

  assertCanManageTeam(user: AuthUser) {
    this.assertRole(user, "owner");
  }

  assertCanShare(user: AuthUser) {
    this.assertRole(user, "owner");
  }

  assertCanManageOrgProfile(user: AuthUser) {
    this.assertRole(user, "owner");
  }

  assertCanManageObligations(user: AuthUser) {
    this.assertRole(user, "owner");
  }

  assertCanViewReports(user: AuthUser) {
    this.assertRole(user, "owner", "site_manager");
  }

  assertCanGenerateReports(user: AuthUser) {
    this.assertRole(user, "owner", "site_manager");
  }

  siteScope(user: AuthUser): string | undefined {
    if (user.role === "owner") return undefined;
    if (!user.siteId) {
      throw new ForbiddenException("Your account is not assigned to a site yet");
    }
    return user.siteId;
  }

  assertSiteAccess(user: AuthUser, siteId: string) {
    if (user.role === "owner") return;
    if (user.siteId !== siteId) {
      throw new ForbiddenException("That site is outside your access scope");
    }
  }

  logbookSiteFilter(user: AuthUser) {
    return this.siteScope(user);
  }

  evidenceSiteFilter(user: AuthUser) {
    if (user.role === "owner") return undefined;
    if (!user.siteId) {
      throw new ForbiddenException("Your account is not assigned to a site yet");
    }
    return user.siteId;
  }
}
