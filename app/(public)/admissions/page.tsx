import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Download, FileText, Printer } from "lucide-react";
import {
  getAdmissionDates,
  getDownloads,
  getEligibilityConfig,
  getFaqs,
  getSections,
  getSettings,
  sectionByKey,
} from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { faqJsonLd } from "@/lib/structured-data";
import { formatDate, telLink, whatsappLink } from "@/lib/utils";
import { JsonLd } from "@/components/site/json-ld";
import { EmptyState, PageHeader, SectionHeading } from "@/components/site/page-header";
import { EligibilityAndEnquiry } from "@/components/site/eligibility-checker";
import { FaqList } from "@/components/site/faq-list";
import { FileLink } from "@/components/site/file-link";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/admissions", title: "Admissions" });
}

export default async function AdmissionsPage() {
  const [sections, settings, config, dates, downloads, faqs] = await Promise.all([
    getSections("admissions"),
    getSettings(),
    getEligibilityConfig(),
    getAdmissionDates(),
    getDownloads(),
    getFaqs(),
  ]);
  const intro = sectionByKey(sections, "admissions.intro");
  const steps = sectionByKey(sections, "admissions.steps");
  const docs = sectionByKey(sections, "admissions.documents");
  const forms = downloads.filter((d) => d.category === "ADMISSION_FORM" || d.category === "PROSPECTUS");
  const admissionFaqs = faqs.filter((f) =>
    ["Admissions", "Fees & documents", "Programmes"].includes(f.category),
  );

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Admissions", href: "/admissions" }]}
        eyebrow={intro?.eyebrow ?? `Admissions ${settings.admissionsSession}`}
        title={intro?.title ?? "Admissions"}
        description={intro?.subtitle}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="accent" size="lg">
            <a href="#eligibility">
              Check my eligibility <ArrowRight aria-hidden />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="#documents">Documents needed</a>
          </Button>
        </div>
      </PageHeader>

      {steps?.items.length ? (
        <section className="container-page pb-20" aria-labelledby="steps-title">
          <SectionHeading id="steps-title" eyebrow={steps.eyebrow} title={steps.title ?? "How it works"} />
          <ol className="mt-10 grid gap-4 md:grid-cols-5">
            {steps.items.map((s, i) => (
              <li key={i} className="reveal border-border bg-surface relative rounded-3xl border p-6">
                <span className="bg-primary font-display text-primary-foreground grid size-10 place-items-center rounded-full text-lg font-semibold">
                  {i + 1}
                </span>
                <h3 className="mt-5 font-sans text-[1.05rem] leading-snug font-semibold">{s.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{s.description}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section id="eligibility" className="bg-surface-2/60 scroll-mt-24" aria-labelledby="elig-title">
        <div className="container-page section-y grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading
              id="elig-title"
              eyebrow="Eligibility checker"
              title="Am I eligible?"
              description="Answer three quick questions. You'll see your result instantly, with clear next steps."
            />
          </div>
          <div className="lg:col-span-8">
            <div className="border-border bg-background rounded-[2rem] border p-5 shadow-[var(--shadow-soft)] sm:p-8">
              <EligibilityAndEnquiry
                config={config}
                whatsappUrl={whatsappLink(settings.whatsappNumber, settings.whatsappMessage)}
                phoneHref={telLink(settings.phone)}
              />
            </div>
          </div>
        </div>
      </section>

      <section
        className="container-page section-y grid gap-12 lg:grid-cols-2"
        aria-label="Dates and documents"
      >
        <div id="dates" className="scroll-mt-24">
          <h2 className="text-h2 font-semibold">Important dates</h2>
          {dates.length ? (
            <ol className="mt-8 space-y-3">
              {dates.map((d) => (
                <li
                  key={d.id}
                  className="border-border bg-surface flex items-center gap-4 rounded-2xl border p-4"
                >
                  <span className="bg-accent-soft text-accent-soft-foreground grid size-14 shrink-0 place-items-center rounded-xl text-center">
                    {d.date ? (
                      <span className="leading-none">
                        <span className="font-display block text-xl font-semibold">
                          {formatDate(d.date, { day: "numeric" })}
                        </span>
                        <span className="text-[0.7rem] font-semibold uppercase">
                          {formatDate(d.date, { month: "short" })}
                        </span>
                      </span>
                    ) : (
                      <CalendarDays className="size-6" aria-hidden />
                    )}
                  </span>
                  <div>
                    <p className="font-semibold">
                      {d.label}
                      {d.programme ? (
                        <span className="text-muted-foreground ml-2 text-sm font-normal">
                          {d.programme.shortName}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {d.date
                        ? `${formatDate(d.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${d.endDate ? ` – ${formatDate(d.endDate)}` : ""}`
                        : "To be announced"}
                      {d.note ? ` · ${d.note}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              className="mt-8"
              icon={<CalendarDays />}
              title="Dates will be announced soon"
              description="Important dates for this session will appear here and on the Notices page as soon as they are confirmed."
              action={
                <Button asChild variant="outline">
                  <Link href="/notices">See notices</Link>
                </Button>
              }
            />
          )}

          <h2 className="text-h3 mt-14 font-semibold">Forms & prospectus</h2>
          {forms.length ? (
            <ul className="mt-5 space-y-3">
              {forms.map((d) => (
                <li key={d.id}>
                  <FileLink download={d} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-border-strong text-muted-foreground mt-4 flex items-start gap-3 rounded-2xl border border-dashed p-4">
              <Download className="mt-0.5 size-5 shrink-0" aria-hidden />
              Downloadable forms will be published here when the application process opens.
            </p>
          )}
        </div>

        {docs?.items.length ? (
          <div id="documents" className="scroll-mt-24">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-h2 font-semibold">{docs.title ?? "Document checklist"}</h2>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href="/admissions/checklist">
                  <Printer aria-hidden /> Print
                </Link>
              </Button>
            </div>
            {docs.subtitle ? <p className="text-muted-foreground mt-3">{docs.subtitle}</p> : null}
            <ul className="divide-border border-border bg-surface mt-8 divide-y rounded-3xl border">
              {docs.items.map((d, i) => (
                <li key={i} className="flex gap-4 p-4">
                  <FileText className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
                  <span>
                    <span className="font-semibold">{d.title}</span>
                    {d.description ? (
                      <span className="text-muted-foreground block text-sm">{d.description}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {admissionFaqs.length ? (
        <section id="faq" className="container-page scroll-mt-24 pb-8" aria-labelledby="faq-title">
          <SectionHeading id="faq-title" eyebrow="FAQ" title="Questions students often ask" />
          <div className="border-border bg-surface mt-8 rounded-3xl border px-6 md:px-8">
            <FaqList items={admissionFaqs} />
          </div>
          <JsonLd data={faqJsonLd(admissionFaqs)} />
        </section>
      ) : null}
    </>
  );
}
