import type { RoleValue } from "@/lib/constants";

export type Capability =
  "dashboard" | "leads" | "content" | "media" | "settings" | "users" | "grievances" | "audit";

const MATRIX: Record<RoleValue, Capability[]> = {
  SUPER_ADMIN: ["dashboard", "leads", "content", "media", "settings", "users", "grievances", "audit"],
  ADMIN: ["dashboard", "leads", "content", "media", "settings", "users", "grievances", "audit"],
  ADMISSIONS_OFFICER: ["dashboard", "leads"],
  EDITOR: ["dashboard", "content", "media"],
};

export function can(role: RoleValue | null | undefined, capability: Capability) {
  if (!role) return false;
  return MATRIX[role].includes(capability);
}

/** Only Super Admins may create, edit or remove other Super Admins. */
export function canManageRole(actor: RoleValue, target: RoleValue) {
  if (!can(actor, "users")) return false;
  if (target === "SUPER_ADMIN") return actor === "SUPER_ADMIN";
  return true;
}
