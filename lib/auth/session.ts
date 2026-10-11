import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { can, type Capability } from "@/lib/auth/permissions";
import type { RoleValue } from "@/lib/constants";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: RoleValue;
};

/**
 * Data Access Layer: reads the session and re-checks the user against the database
 * on every request, so deactivated users and role changes take effect immediately.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  if (!user || !user.active) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Use in pages: redirects to login, or to the "no access" page when the role lacks access. */
export async function requireCapability(capability: Capability) {
  const user = await requireUser();
  if (!can(user.role, capability)) redirect("/admin/no-access");
  return user;
}

export class AuthorizationError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/** Use in server actions: throws instead of redirecting. */
export async function assertCapability(capability: Capability) {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("Your session has expired. Please sign in again.");
  if (!can(user.role, capability)) throw new AuthorizationError();
  return user;
}
