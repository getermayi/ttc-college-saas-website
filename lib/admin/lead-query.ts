import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { LEAD_STAGES, type LeadStageValue } from "@/lib/constants";

export const ACTIVE_STAGES: LeadStageValue[] = ["NEW", "CONTACTED", "ELIGIBLE", "APPLICATION_STARTED", "APPLICATION_SUBMITTED"];
export const STALE_HOURS = 48;

export type LeadFilters = {
  q?: string;
  stage?: string;
  programme?: string;
  source?: string;
  campaign?: string;
  assigned?: string;
  stale?: string;
  from?: string;
  to?: string;
};

export function staleWhere(now = new Date()): Prisma.LeadWhereInput {
  const cutoff = new Date(now.getTime() - STALE_HOURS * 3600_000);
  return {
    stage: { in: ACTIVE_STAGES },
    OR: [{ lastContactedAt: null, createdAt: { lt: cutoff } }, { lastContactedAt: { lt: cutoff } }],
  };
}

export function buildLeadWhere(f: LeadFilters, currentUserId?: string): Prisma.LeadWhereInput {
  const and: Prisma.LeadWhereInput[] = [];
  if (f.q) {
    const digits = f.q.replace(/\D/g, "");
    and.push({
      OR: [
        { name: { contains: f.q, mode: "insensitive" } },
        { email: { contains: f.q, mode: "insensitive" } },
        ...(digits.length >= 4 ? [{ phone: { contains: digits } }] : []),
        { district: { contains: f.q, mode: "insensitive" } },
      ],
    });
  }
  if (f.stage && (LEAD_STAGES as readonly string[]).includes(f.stage)) and.push({ stage: f.stage as LeadStageValue });
  if (f.stage === "OPEN") and.push({ stage: { in: ACTIVE_STAGES } });
  if (f.programme) and.push({ programmeId: f.programme });
  if (f.source) and.push({ source: f.source });
  if (f.campaign) and.push({ utmCampaign: f.campaign });
  if (f.assigned === "me" && currentUserId) and.push({ assignedToId: currentUserId });
  else if (f.assigned === "none") and.push({ assignedToId: null });
  else if (f.assigned) and.push({ assignedToId: f.assigned });
  if (f.stale === "1") and.push(staleWhere());
  if (f.from) and.push({ createdAt: { gte: new Date(`${f.from}T00:00:00+05:30`) } });
  if (f.to) and.push({ createdAt: { lte: new Date(`${f.to}T23:59:59+05:30`) } });
  return and.length ? { AND: and } : {};
}

export function readFilters(sp: Record<string, string | string[] | undefined>): LeadFilters {
  const s = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string).slice(0, 120) : undefined);
  return { q: s("q"), stage: s("stage"), programme: s("programme"), source: s("source"), campaign: s("campaign"), assigned: s("assigned"), stale: s("stale"), from: s("from"), to: s("to") };
}
