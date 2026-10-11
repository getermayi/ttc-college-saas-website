import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth/session";
import { AdminPageHeader } from "@/components/admin/page-header";
import { CampaignsManager, type CampaignRow } from "@/components/admin/campaigns-manager";

export const instant = false;
export const metadata = { title: "Campaigns" };

const ist = (d: Date | null) => (d ? new Date(d.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10) : "");

export default async function CampaignsPage() {
  await requireCapability("leads");
  const [campaigns, stats] = await Promise.all([
    prisma.campaign.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.lead.groupBy({ by: ["utmCampaign", "stage"], where: { utmCampaign: { not: null } }, _count: { _all: true } }),
  ]);
  const byCampaign = new Map<string, { leads: number; contacted: number; enrolled: number }>();
  for (const s of stats) {
    const k = s.utmCampaign!;
    const cur = byCampaign.get(k) ?? { leads: 0, contacted: 0, enrolled: 0 };
    cur.leads += s._count._all;
    if (s.stage !== "NEW") cur.contacted += s._count._all;
    if (s.stage === "ENROLLED") cur.enrolled += s._count._all;
    byCampaign.set(k, cur);
  }
  const rows: CampaignRow[] = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    utmCampaign: c.utmCampaign,
    channel: c.channel,
    spend: c.spend,
    startDate: ist(c.startDate),
    endDate: ist(c.endDate),
    notes: c.notes ?? "",
    ...(byCampaign.get(c.utmCampaign) ?? { leads: 0, contacted: 0, enrolled: 0 }),
  }));
  for (const [utm, s] of byCampaign) {
    if (!campaigns.some((c) => c.utmCampaign === utm)) rows.push({ id: null, name: "", utmCampaign: utm, channel: "Unknown", spend: null, startDate: "", endDate: "", notes: "", ...s });
  }
  return (
    <>
      <AdminPageHeader title="Campaigns" description="Cost per lead and cost per enrolment for each ad campaign, matched by utm_campaign." />
      <CampaignsManager rows={rows} />
    </>
  );
}
