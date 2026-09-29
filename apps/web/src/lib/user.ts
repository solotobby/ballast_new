export function initials(name: string | null | undefined, email: string) {
  if (name?.trim()) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }
  return email.slice(0, 2).toUpperCase();
}

export function roleLabel(role: string) {
  if (role === "site_manager") return "Site manager";
  if (role === "owner") return "Owner";
  return role.charAt(0).toUpperCase() + role.slice(1);
}
