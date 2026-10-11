import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth/session";
import { GRIEVANCE_STATUSES, GRIEVANCE_STATUS_LABELS, type GrievanceStatusValue } from "@/lib/constants";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";

export const instant = false;
export const metadata = { title: "Grievances" };

const TONE: Record<GrievanceStatusValue, "danger" | "warning" | "success" | "neutral"> = { OPEN: "danger", IN_REVIEW: "warning", RESOLVED: "success", CLOSED: "neutral" };

export default async function GrievancesPage({ searchParams }: PageProps<"/admin/grievances">) {
  await requireCapability("grievances");
  const sp = await searchParams;
  const status = typeof sp.status === "string" && (GRIEVANCE_STATUSES as readonly string[]).includes(sp.status) ? (sp.status as GrievanceStatusValue) : undefined;
  const [items, counts] = await Promise.all([
    prisma.grievance.findMany({ where: status ? { status } : {}, orderBy: [{ createdAt: "desc" }], take: 300, include: { assignedTo: { select: { name: true } } } }),
    prisma.grievance.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const count = (s?: GrievanceStatusValue) => (s ? (counts.find((c) => c.status === s)?._count._all ?? 0) : counts.reduce((a, c) => a + c._count._all, 0));
  return (
    <>
      <AdminPageHeader title="Grievances" description="Concerns raised through the website. Review each one, record the outcome and close it." />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {[undefined, ...GRIEVANCE_STATUSES].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/grievances?status=${s}` : "/admin/grievances"}
            aria-current={status === s ? "page" : undefined}
            className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", status === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface")}
          >
            {s ? GRIEVANCE_STATUS_LABELS[s] : "All"} <span className="opacity-70">{count(s)}</span>
          </Link>
        ))}
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {items.map((g) => (
          <li key={g.id}>
            <Link href={`/admin/grievances/${g.id}`} className="flex flex-col gap-1 px-5 py-4 hover:bg-surface-2/60 sm:flex-row sm:items-center sm:gap-4">
              <span className="w-40 shrink-0 font-mono text-xs text-muted-foreground">{g.ticket}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{g.subject}</span>
                <span className="text-xs text-muted-foreground">
                  {g.category} · {g.anonymous ? "Anonymous" : (g.name ?? "—")} ({g.role}){g.assignedTo ? ` · ${g.assignedTo.name}` : ""}
                </span>
              </span>
              <span className="text-xs text-muted-foreground" title={formatDateTime(g.createdAt)}>
                {timeAgo(g.createdAt)}
              </span>
              <Badge tone={TONE[g.status]}>{GRIEVANCE_STATUS_LABELS[g.status]}</Badge>
            </Link>
          </li>
        ))}
      </ul>
      {!items.length ? <p className="py-14 text-center text-muted-foreground">No grievances here.</p> : null}
    </>
  );
}
