import type { SessionUser } from "@/lib/api";

type NavItem = {
  href: string;
  label: string;
  crumb: string;
  title: string;
  icon: string;
  badge?: "obligations" | "monitoring";
  roles?: string[];
};

export const APP_NAV: NavItem[] = [
  { href: "/app", label: "Dashboard", crumb: "Governance", title: "Dashboard", icon: "dashboard" },
  {
    href: "/app/obligations",
    label: "Obligations",
    crumb: "Compliance",
    title: "Obligations",
    icon: "obligations",
    badge: "obligations",
  },
  { href: "/app/logbook", label: "Logbook", crumb: "Operations", title: "Operational Logbook", icon: "logbook" },
  { href: "/app/vault", label: "Evidence Vault", crumb: "Evidence", title: "Evidence Vault", icon: "vault" },
  {
    href: "/app/monitoring",
    label: "Monitoring",
    crumb: "Intelligence",
    title: "Continuous Monitoring",
    icon: "monitoring",
    badge: "monitoring",
    roles: ["owner", "site_manager"],
  },
  {
    href: "/app/reports",
    label: "Statutory Reports",
    crumb: "Reporting",
    title: "Statutory Reports",
    icon: "reports",
    roles: ["owner", "site_manager"],
  },
  {
    href: "/app/share",
    label: "Share",
    crumb: "Reporting",
    title: "Share compliance",
    icon: "share",
    roles: ["owner"],
  },
];

export const ACCOUNT_NAV: NavItem[] = [
  {
    href: "/app/team",
    label: "Team & Sites",
    crumb: "Account",
    title: "Team & Sites",
    icon: "team",
    roles: ["owner", "site_manager"],
  },
  {
    href: "/app/settings",
    label: "Settings",
    crumb: "Account",
    title: "Settings",
    icon: "settings",
    roles: ["owner"],
  },
  {
    href: "/app/profile",
    label: "Your profile",
    crumb: "Account",
    title: "Your profile",
    icon: "profile",
  },
];

export function navForRole(role: string | undefined) {
  const can = (item: NavItem) => !item.roles || (role ? item.roles.includes(role) : true);
  return {
    nav: APP_NAV.filter(can),
    account: ACCOUNT_NAV.filter(can),
  };
}

export function canManageTeam(user: SessionUser | null) {
  return user?.role === "owner";
}

export function canEditObligationStatus(user: SessionUser | null) {
  return user?.role === "owner" || user?.role === "site_manager";
}
