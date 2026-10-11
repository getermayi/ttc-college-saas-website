import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth/session";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AuditTable } from "@/components/admin/audit-table";
import { Pagination } from "@/components/admin/pagination";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";

export const instant = false;
export const metadata = { title: "Audit log" };
const PAGE_SIZE = 50;

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await requireCapability("audit");
  const sp = await searchParams;
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const page = Math.max(1, Number(s("page") ?? 1) || 1);
  const where = {
    ...(s("type") ? { entityType: s("type") } : {}),
    ...(s("user") ? { userId: s("user") } : {}),
    ...(s("q") ? { summary: { contains: s("q"), mode: "insensitive" as const } } : {}),
  };
  const [rows, total, types, users] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true } } },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ["entityType"],
      select: { entityType: true },
      orderBy: { entityType: "asc" },
    }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <>
      <AdminPageHeader
        title="Audit log"
        description="Who changed what, and when. Every save, publish, delete, upload and lead update is recorded."
      />
      <form className="mb-4 flex flex-col gap-2 sm:flex-row" role="search">
        <Input
          name="q"
          defaultValue={s("q")}
          placeholder="Search activity"
          aria-label="Search activity"
          className="h-10 sm:max-w-xs"
        />
        <NativeSelect name="type" defaultValue={s("type") ?? ""} aria-label="Type" className="h-10 sm:w-48">
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t.entityType}>{t.entityType}</option>
          ))}
        </NativeSelect>
        <NativeSelect name="user" defaultValue={s("user") ?? ""} aria-label="User" className="h-10 sm:w-48">
          <option value="">All users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="outline" size="sm" className="h-10">
          Filter
        </Button>
      </form>
      <AuditTable
        rows={rows.map((r) => ({
          id: r.id,
          createdAt: r.createdAt.toISOString(),
          user: r.user?.name ?? null,
          action: r.action,
          entityType: r.entityType,
          summary: r.summary,
        }))}
      />
      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        basePath="/admin/audit"
        params={{ q: s("q"), type: s("type"), user: s("user") }}
      />
    </>
  );
}
