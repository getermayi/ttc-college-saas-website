"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { assertCapability, AuthorizationError } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { CALL_OUTCOMES, LEAD_STAGES, LEAD_STAGE_LABELS, type LeadStageValue } from "@/lib/constants";
import { normaliseIndianPhone } from "@/lib/utils";
import { audit } from "./audit";

type Result<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; message: string };

function fail(err: unknown): { ok: false; message: string } {
  if (err instanceof AuthorizationError) return { ok: false, message: err.message };
  console.error("[leads]", err);
  return { ok: false, message: "Something went wrong. Please try again." };
}

export async function changeLeadStage(ids: string[], stage: string, lostReason?: string): Promise<Result> {
  try {
    const user = await assertCapability("leads");
    const parsed = z.enum(LEAD_STAGES).safeParse(stage);
    if (!parsed.success || !ids.length) return { ok: false, message: "Choose a valid stage." };
    const next = parsed.data as LeadStageValue;
    if ((next === "LOST" || next === "NOT_ELIGIBLE") && !lostReason?.trim())
      return { ok: false, message: "Please add a reason." };
    const leads = await prisma.lead.findMany({
      where: { id: { in: ids } },
      select: { id: true, stage: true, name: true },
    });
    const now = new Date();
    await prisma.$transaction([
      prisma.lead.updateMany({
        where: { id: { in: leads.filter((l) => l.stage !== next).map((l) => l.id) } },
        data: {
          stage: next,
          stageChangedAt: now,
          lostReason: next === "LOST" || next === "NOT_ELIGIBLE" ? lostReason!.trim().slice(0, 300) : null,
        },
      }),
      prisma.leadActivity.createMany({
        data: leads
          .filter((l) => l.stage !== next)
          .map((l) => ({
            leadId: l.id,
            type: "STAGE_CHANGE" as const,
            body: `Stage changed from ${LEAD_STAGE_LABELS[l.stage]} to ${LEAD_STAGE_LABELS[next]}${lostReason ? ` — ${lostReason.trim()}` : ""}`,
            authorId: user.id,
          })),
      }),
    ]);
    await audit(
      user,
      "stage",
      "lead",
      ids.length === 1 ? ids[0] : null,
      `Moved ${ids.length === 1 ? `"${leads[0]?.name}"` : `${ids.length} leads`} to ${LEAD_STAGE_LABELS[next]}`,
    );
    return {
      ok: true,
      message:
        ids.length === 1
          ? `Moved to ${LEAD_STAGE_LABELS[next]}.`
          : `${ids.length} leads moved to ${LEAD_STAGE_LABELS[next]}.`,
    };
  } catch (err) {
    return fail(err);
  }
}

export async function assignLeads(ids: string[], userId: string | null): Promise<Result> {
  try {
    const user = await assertCapability("leads");
    let assigneeName = "nobody";
    if (userId) {
      const assignee = await prisma.user.findFirst({ where: { id: userId, active: true } });
      if (!assignee || !can(assignee.role, "leads"))
        return { ok: false, message: "That person can't be assigned leads." };
      assigneeName = assignee.name;
    }
    await prisma.$transaction([
      prisma.lead.updateMany({ where: { id: { in: ids } }, data: { assignedToId: userId } }),
      prisma.leadActivity.createMany({
        data: ids.map((leadId) => ({
          leadId,
          type: "ASSIGNMENT" as const,
          body: `Assigned to ${assigneeName}`,
          authorId: user.id,
        })),
      }),
    ]);
    await audit(
      user,
      "update",
      "lead",
      ids.length === 1 ? ids[0] : null,
      `Assigned ${ids.length} lead(s) to ${assigneeName}`,
    );
    return { ok: true, message: `Assigned to ${assigneeName}.` };
  } catch (err) {
    return fail(err);
  }
}

const activitySchema = z.object({
  type: z.enum(["NOTE", "CALL", "WHATSAPP", "EMAIL"]),
  body: z.string().trim().max(3000).default(""),
  outcome: z
    .enum(CALL_OUTCOMES)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export async function addLeadActivity(
  leadId: string,
  input: z.input<typeof activitySchema>,
): Promise<Result> {
  try {
    const user = await assertCapability("leads");
    const parsed = activitySchema.safeParse(input);
    if (!parsed.success) return { ok: false, message: "Please check the note." };
    const { type, body, outcome } = parsed.data;
    if (!body && !outcome) return { ok: false, message: "Write a note or choose a call outcome." };
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { stage: true } });
    if (!lead) return { ok: false, message: "Lead not found." };
    const contacted = type !== "NOTE";
    const reached = contacted && (!outcome || outcome.startsWith("Spoke"));
    await prisma.$transaction([
      prisma.leadActivity.create({
        data: { leadId, type, body: body || outcome || "", outcome, authorId: user.id },
      }),
      ...(contacted
        ? [
            prisma.lead.update({
              where: { id: leadId },
              data: {
                lastContactedAt: new Date(),
                ...(lead.stage === "NEW" && reached
                  ? { stage: "CONTACTED", stageChangedAt: new Date() }
                  : {}),
              },
            }),
          ]
        : []),
      ...(lead.stage === "NEW" && reached
        ? [
            prisma.leadActivity.create({
              data: {
                leadId,
                type: "STAGE_CHANGE",
                body: "Stage changed from New enquiry to Contacted (automatic after a successful contact)",
                authorId: user.id,
              },
            }),
          ]
        : []),
    ]);
    return { ok: true, message: type === "NOTE" ? "Note added." : "Contact logged." };
  } catch (err) {
    return fail(err);
  }
}

export async function addFollowUp(
  leadId: string,
  input: { dueAt: string; note?: string; assignedToId?: string | null },
): Promise<Result> {
  try {
    const user = await assertCapability("leads");
    const due = new Date(`${input.dueAt}:00+05:30`);
    if (Number.isNaN(due.getTime())) return { ok: false, message: "Choose a date and time." };
    await prisma.followUp.create({
      data: {
        leadId,
        dueAt: due,
        note: input.note?.trim().slice(0, 500) || null,
        assignedToId: input.assignedToId || user.id,
      },
    });
    await prisma.leadActivity.create({
      data: {
        leadId,
        type: "SYSTEM",
        body: `Follow-up scheduled${input.note ? `: ${input.note.trim()}` : ""}`,
        authorId: user.id,
      },
    });
    return { ok: true, message: "Follow-up scheduled." };
  } catch (err) {
    return fail(err);
  }
}

export async function completeFollowUp(id: string, done = true): Promise<Result> {
  try {
    await assertCapability("leads");
    await prisma.followUp.update({ where: { id }, data: { doneAt: done ? new Date() : null } });
    return { ok: true, message: done ? "Marked as done." : "Reopened." };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteFollowUp(id: string): Promise<Result> {
  try {
    await assertCapability("leads");
    await prisma.followUp.delete({ where: { id } });
    return { ok: true, message: "Follow-up removed." };
  } catch (err) {
    return fail(err);
  }
}

const detailsSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .refine((v) => normaliseIndianPhone(v) !== null, "Invalid phone"),
  email: z.union([z.literal(""), z.email()]).optional(),
  district: z.string().trim().max(60).optional(),
  percentage: z.union([z.literal(""), z.coerce.number().min(0).max(100)]).optional(),
});

export async function updateLeadDetails(id: string, input: z.input<typeof detailsSchema>): Promise<Result> {
  try {
    const user = await assertCapability("leads");
    const parsed = detailsSchema.safeParse(input);
    if (!parsed.success)
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the details." };
    const d = parsed.data;
    await prisma.lead.update({
      where: { id },
      data: {
        name: d.name,
        phone: normaliseIndianPhone(d.phone)!,
        email: d.email || null,
        district: d.district || null,
        percentage: d.percentage === "" || d.percentage === undefined ? null : d.percentage,
      },
    });
    await audit(user, "update", "lead", id, `Edited details for lead "${d.name}"`);
    return { ok: true, message: "Details saved." };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteLeads(ids: string[]): Promise<Result> {
  try {
    const user = await assertCapability("leads");
    if (!can(user.role, "settings")) return { ok: false, message: "Only Admins can delete leads." };
    const res = await prisma.lead.deleteMany({ where: { id: { in: ids } } });
    await audit(user, "delete", "lead", null, `Deleted ${res.count} lead(s)`);
    return { ok: true, message: `Deleted ${res.count} lead(s).` };
  } catch (err) {
    return fail(err);
  }
}

// ── Campaigns ───────────────────────────────────────────────

const campaignSchema = z.object({
  name: z.string().trim().min(2, "Enter a name.").max(120),
  utmCampaign: z
    .string()
    .trim()
    .min(1, "Enter the utm_campaign value.")
    .max(120)
    .regex(/^[\w.\-+%]+$/, "Use the exact utm_campaign value from your ad links (no spaces)."),
  channel: z.string().trim().max(60).default("Meta Ads"),
  spend: z.union([z.literal(""), z.coerce.number().min(0, "Spend can't be negative.")]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export async function saveCampaign(
  id: string | null,
  input: z.input<typeof campaignSchema>,
): Promise<Result> {
  try {
    const user = await assertCapability("leads");
    const parsed = campaignSchema.safeParse(input);
    if (!parsed.success)
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the form." };
    const d = parsed.data;
    const data = {
      name: d.name,
      utmCampaign: d.utmCampaign,
      channel: d.channel || "Meta Ads",
      spend: d.spend === "" || d.spend === undefined ? null : d.spend,
      startDate: d.startDate ? new Date(`${d.startDate}T00:00:00+05:30`) : null,
      endDate: d.endDate ? new Date(`${d.endDate}T23:59:59+05:30`) : null,
      notes: d.notes || null,
    };
    const clash = await prisma.campaign.findFirst({
      where: { utmCampaign: data.utmCampaign, ...(id ? { NOT: { id } } : {}) },
    });
    if (clash) return { ok: false, message: "A campaign with this utm_campaign already exists." };
    if (id) await prisma.campaign.update({ where: { id }, data });
    else await prisma.campaign.create({ data });
    await audit(
      user,
      id ? "update" : "create",
      "campaign",
      id,
      `${id ? "Updated" : "Added"} campaign "${data.name}"`,
    );
    return { ok: true, message: "Campaign saved." };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteCampaign(id: string): Promise<Result> {
  try {
    const user = await assertCapability("leads");
    const c = await prisma.campaign.delete({ where: { id } });
    await audit(user, "delete", "campaign", id, `Deleted campaign "${c.name}"`);
    return { ok: true, message: "Campaign deleted. Its leads are kept." };
  } catch (err) {
    return fail(err);
  }
}

// ── Grievances ──────────────────────────────────────────────

export async function updateGrievance(
  id: string,
  input: { status: string; resolution?: string; internalNotes?: string; assignedToId?: string | null },
): Promise<Result> {
  try {
    const user = await assertCapability("grievances");
    const status = z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"]).parse(input.status);
    const before = await prisma.grievance.findUnique({ where: { id } });
    if (!before) return { ok: false, message: "Grievance not found." };
    await prisma.grievance.update({
      where: { id },
      data: {
        status,
        resolution: input.resolution?.trim().slice(0, 5000) || null,
        internalNotes: input.internalNotes?.trim().slice(0, 5000) || null,
        assignedToId: input.assignedToId || null,
        resolvedAt:
          (status === "RESOLVED" || status === "CLOSED") && !before.resolvedAt
            ? new Date()
            : status === "OPEN" || status === "IN_REVIEW"
              ? null
              : before.resolvedAt,
      },
    });
    await audit(
      user,
      "update",
      "grievance",
      id,
      `Updated grievance ${before.ticket}${before.status !== status ? ` → ${status}` : ""}`,
    );
    return { ok: true, message: "Grievance updated." };
  } catch (err) {
    return fail(err);
  }
}
