import Link from "next/link";
import { AlarmClock, ArrowRight, CircleAlert, CircleCheck, Inbox, Megaphone, TrendingDown, TrendingUp, UserCheck, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { staleWhere } from "@/lib/admin/lead-query";
import { LEAD_STAGE_LABELS, PIPELINE_STAGES } from "@/lib/constants";
import { cn, formatDate, formatDateTime, timeAgo } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeadsTrendChart } from "@/components/admin/dashboard-charts";
import { BarList } from "@/components/admin/bar-list";

export const instant = false;
export const metadata = { title: "Dashboard" };

const DAY = 86_400_000;
const istDay = (d: Date) => new Date(d.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10);

async function leadStats() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY);
  const twoWeeksAgo = new Date(now.getTime() - 14 * DAY);
  const thirtyAgo = new Date(now.getTime() - 29 * DAY);
  const [thisWeek, lastWeek, newCount, stale, bySource, byProgramme, byStage, recent, daily, programmes] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.lead.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    prisma.lead.count({ where: { stage: "NEW" } }),
    prisma.lead.count({ where: staleWhere(now) }),
    prisma.lead.groupBy({ by: ["source"], where: { createdAt: { gte: thirtyAgo } }, _count: { _all: true }, orderBy: { _count: { source: "desc" } }, take: 8 }),
    prisma.lead.groupBy({ by: ["programmeId"], where: { createdAt: { gte: thirtyAgo } }, _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["stage"], _count: { _all: true } }),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, name: true, programmeName: true, source: true, createdAt: true, stage: true } }),
    prisma.lead.findMany({ where: { createdAt: { gte: new Date(istDay(thirtyAgo) + "T00:00:00+05:30") } }, select: { createdAt: true } }),
    prisma.programme.findMany({ select: { id: true, shortName: true } }),
  ]);
  const days = Array.from({ length: 30 }, (_, i) => istDay(new Date(thirtyAgo.getTime() + i * DAY)));
  const perDay = new Map(days.map((d) => [d, 0]));
  for (const l of daily) {
    const k = istDay(l.createdAt);
    if (perDay.has(k)) perDay.set(k, perDay.get(k)! + 1);
  }
  const stageCount = (s: string) => byStage.find((b) => b.stage === s)?._count._all ?? 0;
  // Funnel: everyone who reached at least this stage (later pipeline stages imply earlier ones).
  const reached = PIPELINE_STAGES.map((s, i) => ({
    stage: s,
    value: PIPELINE_STAGES.slice(i).reduce((a, x) => a + stageCount(x), 0) + (i <= 1 ? stageCount("NOT_ELIGIBLE") + stageCount("LOST") : 0),
  }));
  reached[0].value = byStage.reduce((a, b) => a + b._count._all, 0);
  return {
    thisWeek,
    lastWeek,
    newCount,
    stale,
    enrolled: stageCount("ENROLLED"),
    total: reached[0].value,
    bySource: bySource.map((s) => ({ label: s.source, value: s._count._all })),
    byProgramme: byProgramme
      .map((p) => ({ label: programmes.find((x) => x.id === p.programmeId)?.shortName ?? "Not specified", value: p._count._all }))
      .sort((a, b) => b.value - a.value),
    funnel: reached,
    recent,
    trend: days.map((d) => ({ date: d, label: formatDate(new Date(`${d}T12:00:00+05:30`), { day: "numeric", month: "short" }), leads: perDay.get(d) ?? 0 })),
  };
}

async function setupChecklist() {
  const [s, photos, facultyCount, bed, dates] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "site" } }),
    prisma.media.count({ where: { kind: "IMAGE" } }),
    prisma.facultyMember.count({ where: { status: "PUBLISHED", type: { not: "LEADERSHIP" } } }),
    prisma.programme.findFirst({ where: { status: "ACTIVE" }, orderBy: { order: "asc" }, select: { fees: true, shortName: true, id: true } }),
    prisma.admissionDate.count({ where: { status: "PUBLISHED" } }),
  ]);
  const feesSet = Array.isArray(bed?.fees) && bed.fees.length > 0;
  return [
    { done: Boolean(s?.phone), label: "Add the office phone number", href: "/admin/settings#Contact" },
    { done: Boolean(s?.whatsappNumber), label: "Add a WhatsApp number (turns on WhatsApp buttons)", href: "/admin/settings#Contact" },
    { done: Boolean(s?.admissionsEmail || s?.email), label: "Add an admissions email for enquiry alerts", href: "/admin/settings#Contact" },
    { done: Boolean(s?.officeHours), label: "Add office hours", href: "/admin/settings#Contact" },
    { done: Boolean(s?.principalMessage), label: "Add the Principal's message (in their own words)", href: "/admin/settings#Principal-s-message" },
    { done: photos >= 6, label: "Upload real campus photos (at least 6)", href: "/admin/media" },
    { done: facultyCount > 0, label: "Add faculty profiles", href: "/admin/content/faculty" },
    { done: feesSet, label: `Add confirmed ${bed?.shortName ?? "B.Ed."} fees (or leave the 'coming soon' message)`, href: bed ? `/admin/content/programmes/${bed.id}` : "/admin/content/programmes" },
    { done: dates > 0, label: "Publish important admission dates once confirmed", href: "/admin/content/admission-dates" },
    { done: Boolean(s?.gaMeasurementId || s?.metaPixelId), label: "Connect GA4 / Meta Pixel for ad tracking (optional)", href: "/admin/settings#Analytics-loads-only-after-cookie-consent-" },
  ];
}

export default async function DashboardPage() {
  const user = await requireUser();
  const showLeads = can(user.role, "leads");
  const showContent = can(user.role, "content");
  const [stats, checklist, notices, followUps] = await Promise.all([
    showLeads ? leadStats() : null,
    showContent || can(user.role, "settings") ? setupChecklist() : [],
    prisma.notice.findMany({ orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, title: true, status: true, publishedAt: true } }),
    showLeads
      ? prisma.followUp.findMany({ where: { doneAt: null, assignedToId: user.id, dueAt: { lte: new Date(Date.now() + DAY) } }, orderBy: { dueAt: "asc" }, take: 5, include: { lead: { select: { id: true, name: true } } } })
      : [],
  ]);
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const pending = checklist.filter((c) => !c.done);

  const kpis = stats
    ? [
        { label: "Leads this week", value: stats.thisWeek, icon: Users, href: "/admin/leads", delta: stats.thisWeek - stats.lastWeek, hint: `${stats.lastWeek} the week before` },
        { label: "New, not yet contacted", value: stats.newCount, icon: Inbox, href: "/admin/leads?stage=NEW", tone: stats.newCount ? "accent" : undefined },
        { label: "No contact in 48 hours", value: stats.stale, icon: AlarmClock, href: "/admin/leads?stale=1", tone: stats.stale ? "danger" : undefined },
        { label: "Enrolled", value: stats.enrolled, icon: UserCheck, href: "/admin/leads?stage=ENROLLED", hint: stats.total ? `${((stats.enrolled / stats.total) * 100).toFixed(1)}% of all leads` : undefined },
      ]
    : [];

  return (
    <>
      <AdminPageHeader title={`${greet}, ${user.name.split(" ")[0]}`} description="Here's what's happening with admissions and the website." />

      {kpis.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => (
            <Link key={k.label} href={k.href} className={cn("group rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lift)]", k.tone === "danger" && "border-danger/30 bg-danger-soft/40", k.tone === "accent" && "border-accent/30 bg-accent-soft/40")}>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                {k.label}
                <k.icon className="size-4" aria-hidden />
              </div>
              <p className="mt-2 font-display text-4xl font-semibold tabular-nums">{k.value}</p>
              {"delta" in k && k.delta !== undefined ? (
                <p className={cn("mt-1 inline-flex items-center gap-1 text-xs font-semibold", k.delta >= 0 ? "text-success" : "text-danger")}>
                  {k.delta >= 0 ? <TrendingUp className="size-3.5" aria-hidden /> : <TrendingDown className="size-3.5" aria-hidden />}
                  {k.delta >= 0 ? "+" : ""}
                  {k.delta} vs last week
                </p>
              ) : k.hint ? (
                <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
              ) : null}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {stats ? (
          <>
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Leads per day · last 30 days</CardTitle>
              </CardHeader>
              <CardContent>
                <LeadsTrendChart data={stats.trend} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Conversion funnel · all time</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2.5">
                  {stats.funnel.map((f, i) => {
                    const pct = stats.funnel[0].value ? (f.value / stats.funnel[0].value) * 100 : 0;
                    return (
                      <li key={f.stage}>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{LEAD_STAGE_LABELS[f.stage]}</span>
                          <span className="tabular-nums text-muted-foreground">
                            <span className="font-semibold text-foreground">{f.value}</span> {i > 0 ? `· ${pct.toFixed(0)}%` : ""}
                          </span>
                        </div>
                        <div className="mt-1 h-2.5 rounded-full bg-surface-2" aria-hidden>
                          <div className="h-2.5 rounded-full bg-primary" style={{ width: `${Math.max(1.5, pct)}%`, opacity: 1 - i * 0.1 }} />
                        </div>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-3 text-xs text-muted-foreground">Percent of all leads that reached each stage.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Leads by source · 30 days</CardTitle>
              </CardHeader>
              <CardContent>
                <BarList items={stats.bySource} hrefFor={(l) => `/admin/leads?source=${encodeURIComponent(l)}`} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Leads by programme · 30 days</CardTitle>
              </CardHeader>
              <CardContent>
                <BarList items={stats.byProgramme} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Latest enquiries
                  <Link href="/admin/leads" className="text-sm font-medium text-primary hover:underline">
                    All leads
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.recent.length ? (
                  <ul className="divide-y divide-border">
                    {stats.recent.map((l) => (
                      <li key={l.id}>
                        <Link href={`/admin/leads/${l.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-primary">
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">{l.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {l.source} · {timeAgo(l.createdAt)}
                            </span>
                          </span>
                          <Badge tone={l.stage === "NEW" ? "info" : "neutral"}>{LEAD_STAGE_LABELS[l.stage]}</Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">No enquiries yet. Share the enquiry page link in your ads and on WhatsApp.</p>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}

        {followUps.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Your follow-ups due</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border text-sm">
                {followUps.map((f) => (
                  <li key={f.id} className="py-2">
                    <Link href={`/admin/leads/${f.lead.id}`} className="hover:underline">
                      <span className="font-semibold">{f.lead.name}</span>{" "}
                      <span className={f.dueAt < new Date() ? "text-danger" : "text-muted-foreground"}>{formatDateTime(f.dueAt)}</span>
                    </Link>
                    {f.note ? <p className="text-xs text-muted-foreground">{f.note}</p> : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {checklist.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Website setup checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                {pending.length ? `${checklist.length - pending.length} of ${checklist.length} done. These fill the empty spots on the website.` : "Everything is set up. Great work!"}
              </p>
              <ul className="space-y-1.5">
                {checklist.map((c) => (
                  <li key={c.label}>
                    <Link href={c.href} className="flex items-start gap-2 rounded-lg p-1.5 text-sm hover:bg-surface-2">
                      {c.done ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-label="Done" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-label="To do" />}
                      <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {showContent ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent notices
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/content/notices/new">
                    <Megaphone aria-hidden /> New notice
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {notices.map((n) => (
                  <li key={n.id}>
                    <Link href={`/admin/content/notices/${n.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-primary">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{n.title}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(n.publishedAt)}</span>
                      </span>
                      <Badge tone={n.status === "PUBLISHED" ? "success" : "warning"}>{n.status === "PUBLISHED" ? "Live" : "Draft"}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/admin/content/notices" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                All notices <ArrowRight className="size-4" aria-hidden />
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
