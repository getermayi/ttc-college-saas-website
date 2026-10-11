import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { getActiveProgrammes, getSettings } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { telLink, whatsappLink } from "@/lib/utils";
import { PageHeader } from "@/components/site/page-header";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { MapEmbed } from "@/components/site/map-embed";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/contact", title: "Contact" });
}

export default async function ContactPage() {
  const [s, programmes] = await Promise.all([getSettings(), getActiveProgrammes()]);
  const wa = whatsappLink(s.whatsappNumber, s.whatsappMessage);
  const tel = telLink(s.phone);
  const cards = [
    {
      icon: MapPin,
      title: "Visit",
      lines: [`${s.addressLine},`, `${s.district}, ${s.state} – ${s.postalCode}`],
      href: s.mapLink,
      cta: "Get directions",
    },
    s.phone
      ? {
          icon: Phone,
          title: "Call",
          lines: [s.phone, s.altPhone].filter(Boolean) as string[],
          href: tel,
          cta: "Call now",
        }
      : null,
    wa
      ? {
          icon: MessageCircle,
          title: "WhatsApp",
          lines: ["Quick questions? Message us."],
          href: wa,
          cta: "Open WhatsApp",
        }
      : null,
    s.email
      ? {
          icon: Mail,
          title: "Email",
          lines: [s.email, s.admissionsEmail].filter(Boolean) as string[],
          href: `mailto:${s.email}`,
          cta: "Send email",
        }
      : null,
  ].filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Contact", href: "/contact" }]}
        eyebrow="Contact"
        title="We'd love to hear from you"
        description="Visit the campus, call the office, or send an enquiry — whatever is easiest for you."
      />
      <div className="container-page space-y-12 pb-8">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <li
              key={c.title}
              className="border-border bg-surface flex flex-col rounded-3xl border p-6 shadow-[var(--shadow-soft)]"
            >
              <span className="bg-primary-soft text-primary-soft-foreground grid size-11 place-items-center rounded-2xl">
                <c.icon className="size-5" aria-hidden />
              </span>
              <h2 className="mt-4 font-sans text-lg font-semibold">{c.title}</h2>
              {c.lines.map((l) => (
                <p key={l} className="text-muted-foreground break-words">
                  {l}
                </p>
              ))}
              {c.href ? (
                <a
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="text-primary mt-auto pt-4 font-semibold hover:underline"
                >
                  {c.cta} →
                </a>
              ) : null}
            </li>
          ))}
        </ul>
        {s.officeHours ? (
          <p className="text-muted-foreground flex items-center gap-2">
            <Clock className="text-accent size-5" aria-hidden /> Office hours: {s.officeHours}
          </p>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="border-border bg-surface-2 overflow-hidden rounded-[2rem] border lg:col-span-5">
            {s.mapEmbedUrl ? <MapEmbed src={s.mapEmbedUrl} title={`Map showing ${s.siteName}`} /> : null}
            <div className="flex items-center justify-between gap-4 p-5">
              <p className="text-muted-foreground text-sm">
                {s.addressLine}, {s.district}
              </p>
              {s.mapLink ? (
                <Button asChild size="sm" variant="outline">
                  <a href={s.mapLink} target="_blank" rel="noopener noreferrer">
                    <Navigation aria-hidden /> Directions
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
          <section
            aria-labelledby="enq-h"
            className="border-border bg-surface rounded-[2rem] border p-5 shadow-[var(--shadow-soft)] sm:p-8 lg:col-span-7"
          >
            <h2 id="enq-h" className="font-display text-2xl font-semibold">
              Send us an enquiry
            </h2>
            <p className="text-muted-foreground mt-1">We usually call back within one working day.</p>
            <EnquiryForm
              className="mt-6"
              programmes={programmes.map((p) => ({ id: p.id, name: p.name, shortName: p.shortName }))}
              formName="contact"
              whatsappUrl={wa}
              phoneHref={tel}
            />
          </section>
        </div>
      </div>
    </>
  );
}
