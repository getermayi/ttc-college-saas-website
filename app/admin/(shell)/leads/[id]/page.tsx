import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth/session";
import { CATEGORY_LABELS, QUALIFICATION_LABELS, type CategoryValue, type QualificationValue } from "@/lib/constants";
import { displayPhone, formatDateTime, timeAgo } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FollowUps, LeadActions, LeadTimeline, StageBadge } from "@/components/admin/leads/lead-detail";

export const instant = false;
export const metadata = { title: "Lead" };

export default async function LeadPage({ params }: PageProps<"/admin/leads/[id]">) {
  const user = await requireCapability("leads");
  const { id } = await params;
  const [lead, staff] = await Promise.all([
    prisma.lead.findUnique({
      where: { id },
      include: {
        programme: { select: { name: true } },
        activities: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
        followUps: { orderBy: [{ doneAt: "asc" }, { dueAt: "asc" }], include: { assignedTo: { select: { name: true } } } },
      },
    }),
    prisma.user.findMany({ where: { active: true, role: { in: ["SUPER_ADMIN", "ADMIN", "ADMISSIONS_OFFICER"] } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!lead) notFound();
  const staffOpts = staff.map((s) => ({ value: s.id, label: s.name }));

  const facts: [string, React.ReactNode][] = [
    ["Phone", displayPhone(lead.phone)],
    ["Email", lead.email ?? "—"],
    ["Programme", lead.programme?.name ?? lead.programmeName ?? "—"],
    ["District", lead.district ?? "—"],
    ["Qualification", lead.qualification ? (QUALIFICATION_LABELS[lead.qualification as QualificationValue] ?? lead.qualification) : "—"],
    ["Marks", lead.percentage !== null ? `${lead.percentage}%` : "—"],
    ["Category", lead.category ? CATEGORY_LABELS[lead.category as CategoryValue] : "—"],
    ["Best time to call", lead.preferredTime ?? "—"],
    ["Received", `${formatDateTime(lead.createdAt)} (${timeAgo(lead.createdAt)})`],
    ["Last contacted", lead.lastContactedAt ? `${formatDateTime(lead.lastContactedAt)} (${timeAgo(lead.lastContactedAt)})` : "Not yet"],
  ];
  const attribution: [string, string | null][] = [
    ["Source", lead.source],
    ["Form", lead.formName],
    ["utm_source", lead.utmSource],
    ["utm_medium", lead.utmMedium],
    ["utm_campaign", lead.utmCampaign],
    ["utm_term", lead.utmTerm],
    ["utm_content", lead.utmContent],
    ["Referrer", lead.referrer],
    ["Landing page", lead.landingPage],
  ];

  return (
    <>
      <AdminPageHeader back={{ href: "/admin/leads", label: "Leads" }} title={lead.name} description={<span className="inline-flex flex-wrap items-center gap-2"><StageBadge stage={lead.stage} />{lead.lostReason ? <span className="text-sm">Reason: {lead.lostReason}</span> : null}</span>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {facts.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 break-words">{v}</dd>
                  </div>
                ))}
              </dl>
              {lead.message ? (
                <div className="mt-5 rounded-xl bg-surface-2 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Their message</p>
                  <p className="mt-1 whitespace-pre-line">{lead.message}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
          <LeadTimeline
            leadId={lead.id}
            activities={lead.activities.map((a) => ({ id: a.id, type: a.type, body: a.body, outcome: a.outcome, author: a.author?.name ?? null, createdAt: a.createdAt.toISOString() }))}
          />
        </div>
        <aside className="space-y-6">
          <LeadActions
            lead={{ id: lead.id, name: lead.name, phone: lead.phone, email: lead.email, stage: lead.stage, assignedToId: lead.assignedToId, programme: lead.programme?.name ?? lead.programmeName, district: lead.district, percentage: lead.percentage }}
            staff={staffOpts}
          />
          <FollowUps
            leadId={lead.id}
            meId={user.id}
            staff={staffOpts}
            items={lead.followUps.map((f) => ({ id: f.id, dueAt: f.dueAt.toISOString(), note: f.note, doneAt: f.doneAt?.toISOString() ?? null, assignedTo: f.assignedTo?.name ?? null }))}
          />
          <Card>
            <CardHeader>
              <CardTitle>Where they came from</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                {attribution
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="break-all text-right font-medium">{v}</dd>
                    </div>
                  ))}
              </dl>
              <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                Consent given {formatDateTime(lead.consentAt)}: “{lead.consentText}”
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
