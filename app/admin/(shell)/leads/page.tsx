import Link from "next/link";
import { AlarmClock, CalendarCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import {
  buildLeadWhere,
  readFilters,
  requestNow,
  staleWhere,
  STALE_HOURS,
  ACTIVE_STAGES,
} from "@/lib/admin/lead-query";
import { formatDateTime } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { LeadsBoard, LeadsTable, LeadsToolbar, type LeadRow } from "@/components/admin/leads/leads-views";
import { Pagination } from "@/components/admin/pagination";
import { FollowUpDoneButton } from "@/components/admin/leads/follow-up-done";

export const instant = false;
export const metadata = { title: "Leads" };
const PAGE_SIZE = 50;

export default async function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  const user = await requireCapability("leads");
  const sp = await searchParams;
  const filters = readFilters(sp);
  const view = sp.view === "board" ? "board" : "table";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const where = buildLeadWhere(filters, user.id);
  const now = requestNow();
  const boardWhere =
    view === "board"
      ? {
          AND: [
            where,
            {
              OR: [
                { stage: { in: ACTIVE_STAGES } },
                { stageChangedAt: { gte: new Date(now - 60 * 86_400_000) } },
              ],
            },
          ],
        }
      : where;
  const staleCutoff = now - STALE_HOURS * 3600_000;

  const [leads, total, programmes, sources, campaigns, staff, followUps, staleCount] = await Promise.all([
    prisma.lead.findMany({
      where: boardWhere,
      orderBy: { createdAt: "desc" },
      skip: view === "table" ? (page - 1) * PAGE_SIZE : 0,
      take: view === "table" ? PAGE_SIZE : 600,
      include: {
        programme: { select: { shortName: true } },
        assignedTo: { select: { name: true } },
        followUps: { where: { doneAt: null }, orderBy: { dueAt: "asc" }, take: 1, select: { dueAt: true } },
      },
    }),
    prisma.lead.count({ where }),
    prisma.programme.findMany({ orderBy: { order: "asc" }, select: { id: true, shortName: true } }),
    prisma.lead.findMany({ distinct: ["source"], select: { source: true }, orderBy: { source: "asc" } }),
    prisma.lead.findMany({
      where: { utmCampaign: { not: null } },
      distinct: ["utmCampaign"],
      select: { utmCampaign: true },
      orderBy: { utmCampaign: "asc" },
    }),
    prisma.user.findMany({
      where: { active: true, role: { in: ["SUPER_ADMIN", "ADMIN", "ADMISSIONS_OFFICER"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.followUp.findMany({
      where: {
        doneAt: null,
        dueAt: { lte: new Date(now + 86_400_000) },
        OR: [{ assignedToId: user.id }, { assignedToId: null }],
      },
      orderBy: { dueAt: "asc" },
      take: 8,
      include: { lead: { select: { id: true, name: true, phone: true } } },
    }),
    prisma.lead.count({ where: staleWhere() }),
  ]);

  const rows: LeadRow[] = leads.map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    email: l.email,
    programme: l.programme?.shortName ?? l.programmeName,
    district: l.district,
    percentage: l.percentage,
    category: l.category,
    stage: l.stage,
    source: l.source,
    utmCampaign: l.utmCampaign,
    assignedTo: l.assignedTo?.name ?? null,
    createdAt: l.createdAt.toISOString(),
    lastContactedAt: l.lastContactedAt?.toISOString() ?? null,
    stale: ACTIVE_STAGES.includes(l.stage) && (l.lastContactedAt ?? l.createdAt).getTime() < staleCutoff,
    nextFollowUp: l.followUps[0]?.dueAt.toISOString() ?? null,
  }));

  return (
    <>
      <AdminPageHeader
        title="Leads"
        description="Every enquiry from the website, with its source and stage. Call new leads quickly — the first 24 hours matter most."
      />
      {followUps.length || staleCount ? (
        <div className="mb-6 grid gap-3 md:grid-cols-2">
          {staleCount ? (
            <Link
              href="/admin/leads?stale=1"
              className="border-danger/30 bg-danger-soft text-danger-soft-foreground flex items-center gap-3 rounded-2xl border p-4 hover:shadow-[var(--shadow-lift)]"
            >
              <AlarmClock className="size-6 shrink-0" aria-hidden />
              <span>
                <span className="block font-semibold">
                  {staleCount} open lead(s) with no contact in 48 hours
                </span>
                <span className="text-sm opacity-90">Open them and log a call or WhatsApp.</span>
              </span>
            </Link>
          ) : null}
          {followUps.length ? (
            <div className="border-border bg-surface rounded-2xl border p-4">
              <p className="flex items-center gap-2 font-semibold">
                <CalendarCheck className="text-accent size-5" aria-hidden /> Your follow-ups due by tomorrow
              </p>
              <ul className="divide-border mt-2 divide-y text-sm">
                {followUps.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-2 py-2">
                    <Link href={`/admin/leads/${f.lead.id}`} className="min-w-0 hover:underline">
                      <span className="font-medium">{f.lead.name}</span>
                      <span
                        className={
                          f.dueAt.getTime() < now ? "text-danger ml-2" : "text-muted-foreground ml-2"
                        }
                      >
                        {formatDateTime(f.dueAt)}
                      </span>
                      {f.note ? (
                        <span className="text-muted-foreground block truncate text-xs">{f.note}</span>
                      ) : null}
                    </Link>
                    <FollowUpDoneButton id={f.id} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      <LeadsToolbar
        view={view}
        programmes={programmes.map((p) => ({ value: p.id, label: p.shortName }))}
        sources={sources.map((s) => s.source)}
        campaigns={campaigns.map((c) => c.utmCampaign!).filter(Boolean)}
        staff={staff.map((s) => ({ value: s.id, label: s.name }))}
      />
      <div className="mt-4">
        {view === "board" ? (
          <LeadsBoard key={rows.map((r) => r.id + r.stage).join()} rows={rows} />
        ) : (
          <>
            <LeadsTable
              key={rows.map((r) => r.id + r.stage + (r.assignedTo ?? "")).join()}
              rows={rows}
              staff={staff.map((s) => ({ value: s.id, label: s.name }))}
              canDelete={can(user.role, "settings")}
            />
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              basePath="/admin/leads"
              params={Object.fromEntries(Object.entries(filters).map(([k, v]) => [k, v]))}
            />
          </>
        )}
      </div>
    </>
  );
}
