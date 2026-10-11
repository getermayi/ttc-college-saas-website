"use server";

import { after } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { getClientInfo } from "@/lib/request";
import { adminRecipients, sendEmail } from "@/lib/email";
import { deriveSource } from "@/lib/leads";
import { getSettings } from "@/lib/data/public";
import { absoluteUrl, displayPhone, normaliseIndianPhone, whatsappLink } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  CONSENT_TEXT,
  QUALIFICATION_LABELS,
  type CategoryValue,
  type QualificationValue,
} from "@/lib/constants";
import {
  enquirySchema,
  grievanceSchema,
  zodFieldErrors,
  type EnquiryInput,
  type FormState,
  type GrievanceInput,
} from "@/lib/validation/enquiry";
import {
  EnquiryAutoReplyEmail,
  EnquiryNotificationEmail,
  GrievanceNotificationEmail,
  GrievanceReceiptEmail,
} from "@/emails/enquiry-emails";

const GENERIC_ERROR = "Something went wrong on our side. Please try again, or call or WhatsApp us.";

export async function submitEnquiry(
  input: EnquiryInput,
): Promise<FormState<{ firstName: string; programme: string }>> {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }
  const data = parsed.data;
  // Honeypot filled → silently pretend success to bots.
  if (data.website) return { ok: true, data: { firstName: "", programme: "" } };

  const client = await getClientInfo();
  const limit = await rateLimit(`enquiry:${client.ipHash}`, { limit: 5, windowSeconds: 3600 });
  if (!limit.success) {
    return {
      ok: false,
      message: "You've sent several enquiries already. Please wait a little, or call us directly.",
    };
  }
  if (!(await verifyTurnstile(data.turnstileToken, client.ip))) {
    return {
      ok: false,
      message: "We couldn't confirm you're human. Please complete the check and try again.",
    };
  }

  try {
    const programme = await prisma.programme.findFirst({
      where: { id: data.programmeId, status: "ACTIVE" },
      select: { id: true, name: true, shortName: true },
    });
    if (!programme)
      return {
        ok: false,
        message: "Please choose a programme.",
        fieldErrors: { programmeId: "Please choose a programme." },
      };

    const phone = normaliseIndianPhone(data.phone)!;
    const now = new Date();
    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        phone,
        email: data.email,
        programmeId: programme.id,
        programmeName: programme.name,
        district: data.district,
        qualification: data.qualification,
        percentage: data.percentage,
        category: data.category,
        preferredTime: data.preferredTime,
        message: data.message,
        formName: data.formName ?? "enquiry",
        consent: true,
        consentText: CONSENT_TEXT,
        consentAt: now,
        source: deriveSource(data.utmSource, data.referrer, data.utmMedium),
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        utmTerm: data.utmTerm,
        utmContent: data.utmContent,
        referrer: data.referrer,
        landingPage: data.landingPage,
        userAgent: client.userAgent,
        activities: {
          create: {
            type: "SYSTEM",
            body: `Enquiry received via the website (${data.formName ?? "enquiry"} form).`,
          },
        },
      },
    });

    after(async () => {
      const settings = await getSettings();
      const rows: [string, string | null | undefined][] = [
        ["Name", data.name],
        ["Phone", displayPhone(phone)],
        ["Email", data.email],
        ["Programme", programme.name],
        ["District", data.district],
        ["Qualification", QUALIFICATION_LABELS[data.qualification as QualificationValue]],
        ["Marks", data.percentage !== undefined ? `${data.percentage}%` : null],
        ["Category", CATEGORY_LABELS[data.category as CategoryValue]],
        ["Best time to call", data.preferredTime],
        ["Message", data.message],
        ["Source", lead.source],
        ["Campaign", data.utmCampaign],
      ];
      await sendEmail({
        to: adminRecipients(settings),
        subject: `New enquiry: ${data.name} — ${programme.shortName}`,
        react: EnquiryNotificationEmail({
          rows,
          adminUrl: absoluteUrl(`/admin/leads/${lead.id}`),
          name: data.name,
        }),
        replyTo: data.email,
      });
      if (data.email) {
        await sendEmail({
          to: data.email,
          subject: "We received your enquiry — TTC Aalo",
          react: EnquiryAutoReplyEmail({
            name: data.name,
            programme: programme.name,
            phone: settings.phone,
            whatsappUrl: whatsappLink(settings.whatsappNumber, settings.whatsappMessage),
            siteUrl: absoluteUrl(""),
          }),
          replyTo: settings.admissionsEmail ?? settings.email ?? undefined,
        });
      }
    });

    return { ok: true, data: { firstName: data.name.split(" ")[0], programme: programme.shortName } };
  } catch (err) {
    console.error("[enquiry] failed", err);
    return { ok: false, message: GENERIC_ERROR };
  }
}

async function nextTicket() {
  const year = new Date().getFullYear();
  const count = await prisma.grievance.count({ where: { ticket: { startsWith: `GRV-${year}-` } } });
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `GRV-${year}-${String(count + 1).padStart(4, "0")}-${rand}`;
}

export async function submitGrievance(input: GrievanceInput): Promise<FormState<{ ticket: string }>> {
  const parsed = grievanceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }
  const data = parsed.data;
  if (data.website) return { ok: true, data: { ticket: "" } };

  const client = await getClientInfo();
  const limit = await rateLimit(`grievance:${client.ipHash}`, { limit: 3, windowSeconds: 3600 });
  if (!limit.success) return { ok: false, message: "Too many submissions. Please try again later." };
  if (!(await verifyTurnstile(data.turnstileToken, client.ip))) {
    return {
      ok: false,
      message: "We couldn't confirm you're human. Please complete the check and try again.",
    };
  }

  try {
    const ticket = await nextTicket();
    const phone = data.phone ? normaliseIndianPhone(data.phone) : null;
    const g = await prisma.grievance.create({
      data: {
        ticket,
        anonymous: data.anonymous,
        name: data.anonymous ? null : data.name,
        email: data.anonymous ? null : data.email,
        phone: data.anonymous ? null : phone,
        role: data.role,
        category: data.category,
        subject: data.subject,
        description: data.description,
      },
    });

    after(async () => {
      const settings = await getSettings();
      await sendEmail({
        to: adminRecipients({
          admissionsEmail: process.env.GRIEVANCE_NOTIFY_EMAIL ?? null,
          email: settings.email,
        }),
        subject: `New grievance ${ticket}: ${data.subject}`,
        react: GrievanceNotificationEmail({
          ticket,
          adminUrl: absoluteUrl(`/admin/grievances/${g.id}`),
          rows: [
            ["From", data.anonymous ? "Anonymous" : data.name],
            ["Role", data.role],
            ["Category", data.category],
            ["Subject", data.subject],
          ],
        }),
      });
      if (!data.anonymous && data.email) {
        await sendEmail({
          to: data.email,
          subject: `Grievance received — ticket ${ticket}`,
          react: GrievanceReceiptEmail({ name: data.name, ticket, subject: data.subject }),
        });
      }
    });

    return { ok: true, data: { ticket } };
  } catch (err) {
    console.error("[grievance] failed", err);
    return { ok: false, message: GENERIC_ERROR };
  }
}
