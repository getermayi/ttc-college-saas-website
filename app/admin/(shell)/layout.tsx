import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/constants";
import { RESOURCES, RESOURCE_GROUPS } from "@/lib/admin/resources";
import { AdminShell, type NavGroup } from "@/components/admin/shell";

export const instant = false;

export default async function ShellLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser();
  const [newLeads, openGrievances] = await Promise.all([
    can(user.role, "leads") ? prisma.lead.count({ where: { stage: "NEW" } }) : 0,
    can(user.role, "grievances") ? prisma.grievance.count({ where: { status: "OPEN" } }) : 0,
  ]);

  const groups: NavGroup[] = [
    {
      label: "Overview",
      items: [
        { href: "/admin", label: "Dashboard", icon: "dashboard" },
        ...(can(user.role, "leads")
          ? [
              { href: "/admin/leads", label: "Leads", icon: "leads", badge: newLeads },
              { href: "/admin/campaigns", label: "Campaigns", icon: "campaigns" },
            ]
          : []),
        ...(can(user.role, "grievances") ? [{ href: "/admin/grievances", label: "Grievances", icon: "grievances", badge: openGrievances }] : []),
      ],
    },
    ...(can(user.role, "content")
      ? RESOURCE_GROUPS.map((g) => ({
          label: g.label,
          items: g.keys.map((k) => {
            const r = RESOURCES.find((x) => x.key === k)!;
            return { href: `/admin/content/${k}`, label: r.label, icon: k };
          }),
        }))
      : []),
    {
      label: "System",
      items: [
        ...(can(user.role, "media") ? [{ href: "/admin/media", label: "Media library", icon: "media" }] : []),
        ...(can(user.role, "settings") ? [{ href: "/admin/settings", label: "Site settings", icon: "settings" }] : []),
        ...(can(user.role, "users") ? [{ href: "/admin/users", label: "Users", icon: "users" }] : []),
        ...(can(user.role, "audit") ? [{ href: "/admin/audit", label: "Audit log", icon: "audit" }] : []),
      ],
    },
  ].filter((g) => g.items.length);

  return (
    <AdminShell user={{ name: user.name, email: user.email, roleLabel: ROLE_LABELS[user.role] }} groups={groups}>
      {children}
    </AdminShell>
  );
}
