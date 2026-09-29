import type { UserRole } from "@ballast/domain";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  organisationId: string;
  organisationName: string;
  role: UserRole;
  siteId: string | null;
};
