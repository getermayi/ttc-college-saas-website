import { Button, Column, Row, Section, Text } from "@react-email/components";
import { EmailLayout, button, colors, heading, text } from "./layout";

type Row = [string, string | null | undefined];

function Details({ rows }: { rows: Row[] }) {
  return (
    <Section style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: "8px 16px", margin: "8px 0 20px" }}>
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <Row key={k}>
            <Column style={{ width: "42%", padding: "6px 0", color: colors.muted, fontSize: 13, verticalAlign: "top" }}>{k}</Column>
            <Column style={{ padding: "6px 0", color: colors.ink, fontSize: 14, fontWeight: 600 }}>{v}</Column>
          </Row>
        ))}
    </Section>
  );
}

export function EnquiryNotificationEmail({ rows, adminUrl, name }: { rows: Row[]; adminUrl: string; name: string }) {
  return (
    <EmailLayout preview={`New enquiry from ${name}`}>
      <Text style={heading}>New admission enquiry</Text>
      <Text style={text}>A new enquiry just came in through the website. Please call within 24 hours — quick replies convert best.</Text>
      <Details rows={rows} />
      <Button href={adminUrl} style={button}>
        Open in the CRM
      </Button>
    </EmailLayout>
  );
}

export function EnquiryAutoReplyEmail({
  name,
  programme,
  phone,
  whatsappUrl,
  siteUrl,
}: {
  name: string;
  programme: string;
  phone?: string | null;
  whatsappUrl?: string | null;
  siteUrl: string;
}) {
  const first = name.split(" ")[0];
  return (
    <EmailLayout preview="Thank you — we received your enquiry">
      <Text style={heading}>Thank you, {first}!</Text>
      <Text style={text}>
        We have received your enquiry about <strong>{programme}</strong> at Teacher Training College, Aalo. A member of our admissions team will call you soon.
      </Text>
      <Text style={text}>While you wait, you can:</Text>
      <Text style={{ ...text, margin: "0 0 6px" }}>• Keep your mark sheets and certificates ready.</Text>
      <Text style={{ ...text, margin: "0 0 6px" }}>• Check the latest admission notices on our website.</Text>
      <Text style={text}>• Write down any questions you have for us.</Text>
      <Button href={`${siteUrl}/admissions`} style={button}>
        See admission details
      </Button>
      {phone || whatsappUrl ? (
        <Text style={{ ...text, marginTop: 20 }}>
          Need help sooner?{phone ? ` Call us at ${phone}.` : ""}
          {whatsappUrl ? (
            <>
              {" "}
              Or <a href={whatsappUrl}>message us on WhatsApp</a>.
            </>
          ) : null}
        </Text>
      ) : null}
      <Text style={{ ...text, color: colors.muted, fontSize: 13 }}>
        You are receiving this because you sent an enquiry on our website. If this wasn&apos;t you, you can ignore this email.
      </Text>
    </EmailLayout>
  );
}

export function GrievanceReceiptEmail({ name, ticket, subject }: { name?: string | null; ticket: string; subject: string }) {
  return (
    <EmailLayout preview={`Grievance received — ticket ${ticket}`}>
      <Text style={heading}>We have received your grievance</Text>
      <Text style={text}>{name ? `Dear ${name},` : "Hello,"}</Text>
      <Text style={text}>
        Thank you for telling us. Your grievance <strong>&quot;{subject}&quot;</strong> has been recorded with ticket number{" "}
        <strong>{ticket}</strong>. The grievance redressal committee will review it and get back to you.
      </Text>
      <Text style={text}>Please keep this ticket number for your records.</Text>
    </EmailLayout>
  );
}

export function GrievanceNotificationEmail({ ticket, rows, adminUrl }: { ticket: string; rows: Row[]; adminUrl: string }) {
  return (
    <EmailLayout preview={`New grievance ${ticket}`}>
      <Text style={heading}>New grievance: {ticket}</Text>
      <Details rows={rows} />
      <Button href={adminUrl} style={button}>
        Open grievance
      </Button>
    </EmailLayout>
  );
}

export function InviteEmail({ name, inviter, role, url, reset }: { name?: string | null; inviter?: string | null; role: string; url: string; reset?: boolean }) {
  return (
    <EmailLayout preview={reset ? "Reset your TTC Aalo admin password" : "You're invited to the TTC Aalo website admin"}>
      <Text style={heading}>{reset ? "Set a new password" : "You're invited"}</Text>
      <Text style={text}>{name ? `Hello ${name},` : "Hello,"}</Text>
      <Text style={text}>
        {reset
          ? "Use the button below to set a new password for the TTC Aalo website admin."
          : `${inviter ?? "An administrator"} has invited you to manage the TTC Aalo website as ${role}.`}{" "}
        The link works once and expires in 72 hours.
      </Text>
      <Button href={url} style={button}>
        {reset ? "Set new password" : "Accept invitation"}
      </Button>
      <Text style={{ ...text, color: colors.muted, fontSize: 13, marginTop: 20 }}>If you weren&apos;t expecting this, you can ignore this email.</Text>
    </EmailLayout>
  );
}
