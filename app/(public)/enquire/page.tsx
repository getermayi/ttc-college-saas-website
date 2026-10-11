import type { Metadata } from "next";
import { Clock, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { getEligibilityConfig, getSettings } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { telLink, whatsappLink } from "@/lib/utils";
import { PageHeader } from "@/components/site/page-header";
import { EligibilityAndEnquiry } from "@/components/site/eligibility-checker";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/enquire", title: "Check eligibility & enquire" });
}

export default async function EnquirePage() {
  const [settings, config] = await Promise.all([getSettings(), getEligibilityConfig()]);
  const wa = whatsappLink(settings.whatsappNumber, settings.whatsappMessage);
  const tel = telLink(settings.phone);
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Enquire", href: "/enquire" }]}
        eyebrow={settings.admissionsOpen ? settings.admissionsBadge : "Admissions"}
        title="Check your eligibility, then say hello"
        description="It takes about a minute. Our admissions team will call you back and help with every step."
      />
      <div className="container-page grid gap-10 lg:grid-cols-12">
        <div className="border-border bg-surface/70 rounded-[2rem] border p-5 shadow-[var(--shadow-soft)] sm:p-8 lg:col-span-8">
          <EligibilityAndEnquiry config={config} whatsappUrl={wa} phoneHref={tel} />
        </div>
        <aside className="space-y-4 lg:col-span-4" aria-label="Other ways to reach us">
          <div className="bg-primary text-primary-foreground rounded-3xl p-6">
            <h2 className="font-display text-xl font-semibold">Prefer to talk now?</h2>
            <ul className="mt-4 space-y-3">
              {tel ? (
                <li>
                  <a href={tel} className="flex items-center gap-3 font-semibold hover:underline">
                    <Phone className="size-5" aria-hidden /> {settings.phone}
                  </a>
                </li>
              ) : null}
              {wa ? (
                <li>
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 font-semibold hover:underline"
                  >
                    <MessageCircle className="size-5" aria-hidden /> Chat on WhatsApp
                  </a>
                </li>
              ) : null}
              {settings.officeHours ? (
                <li className="text-primary-foreground/80 flex items-center gap-3">
                  <Clock className="size-5" aria-hidden /> {settings.officeHours}
                </li>
              ) : null}
              {!tel && !wa ? (
                <li className="text-primary-foreground/80">
                  Visit us at {settings.addressLine}, {settings.district}.
                </li>
              ) : null}
            </ul>
          </div>
          <div className="border-border bg-surface rounded-3xl border p-6">
            <ShieldCheck className="text-primary size-6" aria-hidden />
            <h2 className="mt-3 font-sans font-semibold">Your details are safe</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              We only use them to help with your admission, and never share or sell them.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
