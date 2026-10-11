import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth/session";
import { AdminPageHeader } from "@/components/admin/page-header";
import { UsersManager } from "@/components/admin/users-manager";

export const instant = false;
export const metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requireCapability("users");
  const [users, invites] = await Promise.all([
    prisma.user.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    prisma.invite.findMany({ where: { acceptedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <>
      <AdminPageHeader title="Users" description="Invite staff, choose what they can access, and remove access when someone leaves." />
      <UsersManager
        me={me.id}
        myRole={me.role}
        users={users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, lastLoginAt: u.lastLoginAt?.toISOString() ?? null, hasPassword: Boolean(u.passwordHash) }))}
        invites={invites.map((i) => ({ id: i.id, email: i.email, role: i.role, expiresAt: i.expiresAt.toISOString(), purpose: i.purpose }))}
      />
    </>
  );
}
