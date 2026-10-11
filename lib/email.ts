import "server-only";
import type { ReactElement } from "react";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "TTC Aalo <no-reply@ttcaalo.org.in>";

/**
 * Sends an email through Resend. Never throws: a failed email must not lose a lead.
 * Without RESEND_API_KEY (local dev) the email is logged instead.
 */
export async function sendEmail({
  to,
  subject,
  react,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  react: ReactElement;
  replyTo?: string;
}) {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!recipients.length) return { ok: false as const, reason: "no-recipient" };
  if (!resend) {
    console.info(`[email:dev] To: ${recipients.join(", ")} | ${subject}`);
    return { ok: true as const, dev: true };
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to: recipients, subject, react, replyTo });
    if (error) {
      console.error("[email] send failed", error);
      return { ok: false as const, reason: error.message };
    }
    return { ok: true as const };
  } catch (err) {
    console.error("[email] send threw", err);
    return { ok: false as const, reason: "exception" };
  }
}

export function adminRecipients(settings: { admissionsEmail: string | null; email: string | null }) {
  const env = process.env.ADMISSIONS_NOTIFY_EMAIL?.split(",").map((s) => s.trim()) ?? [];
  return [
    ...new Set([...env, settings.admissionsEmail, settings.email].filter((v): v is string => Boolean(v))),
  ];
}
