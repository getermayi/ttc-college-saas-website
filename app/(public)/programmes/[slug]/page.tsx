import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  FileText,
  Landmark,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { getActiveProgrammes, getAdmissionDates, getProgramme, getSettings } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { atLeastOne } from "@/lib/utils";
import { formatDate, stripHtml, telLink, truncate, whatsappLink } from "@/lib/utils";
import { courseJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/site/json-ld";
import { Breadcrumbs } from "@/components/site/page-header";
import { RichText } from "@/components/site/rich-text";
import { Photo } from "@/components/site/photo";
import { Eyebrow } from "@/components/site/motif";
import { LazyEnquiryForm } from "@/components/site/lazy-enquiry-form";
import { Button } from "@/components/ui/button";

// Unknown slugs wait for a full static render, so they return a real 404 status
// (and newly published content is generated on first visit, then cached).
export const ensureStatic = "navigation";
export const instant = false;

export async function generateStaticParams() {
  const programmes = await getActiveProgrammes();
  return atLeastOne(
    programmes.map((p) => ({ slug: p.slug })),
    "slug",
  );
}

export async function generateMetadata({ params }: PageProps<"/programmes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProgramme(slug);
  if (!p) return { title: "Programme not found", robots: { index: false } };
  return buildMetadata({
    path: `/programmes/${p.slug}`,
    title: p.seoTitle || p.name,
    description: p.seoDescription || truncate(p.summary, 160),
    ogImage: p.ogImage ?? p.heroImage,
    noindex: p.noindex,
  });
}

export default async function ProgrammePage({ params }: PageProps<"/programmes/[slug]">) {
  const { slug } = await params;
  const [p, settings, allDates] = await Promise.all([getProgramme(slug), getSettings(), getAdmissionDates()]);
  if (!p) notFound();
  const dates = allDates.filter((d) => !d.programmeId || d.programmeId === p.id);
  const wa = whatsappLink(
    settings.whatsappNumber,
    `Hello TTC Aalo, I'd like to know more about the ${p.shortName}.`,
  );

  const facts = [
    p.duration ? { icon: Clock3, label: "Duration", value: p.duration } : null,
    p.semesters ? { icon: CalendarDays, label: "Semesters", value: String(p.semesters) } : null,
    p.intake ? { icon: Users, label: "Intake", value: `${p.intake} seats` } : null,
    p.affiliation
      ? { icon: Landmark, label: "Affiliation", value: p.affiliation.replace(/\s*\(.*?\)/, "").split(",")[0] }
      : null,
    p.recognition
      ? {
          icon: ShieldCheck,
          label: "Recognition",
          value: p.recognition.match(/\(([^)]+)\)/)?.[1] ?? p.recognition,
        }
      : null,
  ].filter((x): x is NonNullable<typeof x> => Boolean(x));

  const toc = [
    { id: "overview", label: "Overview" },
    p.eligibility.length ? { id: "eligibility", label: "Eligibility" } : null,
    p.subjects.length ? { id: "subjects", label: "What you'll study" } : null,
    p.careers.length ? { id: "careers", label: "Career pathways" } : null,
    { id: "fees", label: "Fees" },
    p.documents.length ? { id: "documents", label: "Documents" } : null,
    { id: "enquire", label: "Enquire" },
  ].filter((x): x is { id: string; label: string } => Boolean(x));

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          className="motif-texture absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]"
          aria-hidden
        />
        <div className="container-page relative pt-6 pb-12 md:pt-10">
          <Breadcrumbs
            items={[
              { name: "Programmes", href: "/programmes" },
              { name: p.shortName, href: `/programmes/${p.slug}` },
            ]}
          />
          <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Eyebrow>{p.level}</Eyebrow>
              <h1 className="text-h1 mt-3 font-semibold">{p.name}</h1>
              {p.tagline ? <p className="font-display text-primary mt-4 text-2xl">{p.tagline}</p> : null}
              <p className="text-lead text-muted-foreground mt-4 max-w-2xl">{p.summary}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="accent" size="lg">
                  <a href="#enquire">
                    Enquire about {p.shortName} <ArrowRight aria-hidden />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/admissions#eligibility">Check eligibility</Link>
                </Button>
              </div>
            </div>
            <Photo
              media={p.heroImage}
              label={p.heroImage ? undefined : `${p.shortName} classroom`}
              priority
              className="aspect-[4/3] lg:col-span-5"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {facts.map((f) => (
              <div key={f.label} className="border-border bg-surface rounded-2xl border p-4">
                <dt className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                  <f.icon className="text-accent size-4" aria-hidden /> {f.label}
                </dt>
                <dd className="mt-1.5 leading-snug font-semibold">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="container-page grid gap-12 lg:grid-cols-12">
        <nav aria-label="On this page" className="hidden lg:col-span-3 lg:block">
          <ul className="border-border sticky top-28 space-y-1 border-l">
            {toc.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  className="text-muted-foreground hover:border-accent hover:text-foreground -ml-px block border-l-2 border-transparent py-1.5 pl-4 text-sm"
                >
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-16 lg:col-span-9">
          <section id="overview" aria-labelledby="overview-h" className="scroll-mt-28">
            <h2 id="overview-h" className="text-h2 font-semibold">
              Overview
            </h2>
            <RichText html={p.overview} className="mt-5" />
          </section>

          {p.eligibility.length ? (
            <section id="eligibility" aria-labelledby="elig-h" className="scroll-mt-28">
              <h2 id="elig-h" className="text-h2 font-semibold">
                Who can apply
              </h2>
              <div className="border-border bg-surface mt-6 overflow-hidden rounded-2xl border">
                <table className="w-full text-left">
                  <caption className="sr-only">Eligibility for {p.name}</caption>
                  <thead className="bg-surface-2 text-sm">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">
                        For
                      </th>
                      <th scope="col" className="px-5 py-3 font-semibold">
                        Requirement
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {p.eligibility.map((row) => (
                      <tr key={row.category} className="align-top">
                        <th scope="row" className="w-2/5 px-5 py-4 font-semibold">
                          {row.category}
                        </th>
                        <td className="text-muted-foreground px-5 py-4">{row.requirement}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {p.eligibilityNotes ? (
                <p className="mt-4 flex items-start gap-2 text-sm font-medium">
                  <BadgeCheck className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
                  {p.eligibilityNotes}
                </p>
              ) : null}
              <Link
                href="/admissions#eligibility"
                className="text-primary mt-4 inline-flex items-center gap-1.5 font-semibold hover:underline"
              >
                Try the eligibility checker <ArrowRight className="size-4" aria-hidden />
              </Link>
            </section>
          ) : null}

          {p.subjects.length ? (
            <section id="subjects" aria-labelledby="subj-h" className="scroll-mt-28">
              <h2 id="subj-h" className="text-h2 font-semibold">
                What you&apos;ll study
              </h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {p.subjects.map((s) => (
                  <li
                    key={s}
                    className="border-border bg-surface flex items-center gap-3 rounded-2xl border px-4 py-3.5"
                  >
                    <BookOpen className="text-primary size-5 shrink-0" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground mt-3 text-sm">
                Course structure follows the university syllabus and may be updated by the university.
              </p>
            </section>
          ) : null}

          {p.careers.length ? (
            <section id="careers" aria-labelledby="career-h" className="scroll-mt-28">
              <h2 id="career-h" className="text-h2 font-semibold">
                Where it can lead
              </h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {p.careers.map((c) => (
                  <li key={c.title} className="border-border bg-surface rounded-2xl border p-5">
                    <BriefcaseBusiness className="text-accent size-5" aria-hidden />
                    <h3 className="mt-3 font-sans font-semibold">{c.title}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">{c.description}</p>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground mt-3 text-sm">
                These are common pathways, not guarantees. Jobs depend on each employer&apos;s recruitment
                rules and your own effort.
              </p>
            </section>
          ) : null}

          <section id="fees" aria-labelledby="fees-h" className="scroll-mt-28">
            <h2 id="fees-h" className="text-h2 font-semibold">
              Fees
            </h2>
            {p.fees.length ? (
              <div className="border-border bg-surface mt-6 overflow-hidden rounded-2xl border">
                <table className="w-full text-left">
                  <caption className="sr-only">Fees for {p.name}</caption>
                  <tbody className="divide-border divide-y">
                    {p.fees.map((f) => (
                      <tr key={f.label}>
                        <th scope="row" className="px-5 py-4 font-medium">
                          {f.label}
                          {f.note ? (
                            <span className="text-muted-foreground block text-sm font-normal">{f.note}</span>
                          ) : null}
                        </th>
                        <td className="px-5 py-4 text-right font-semibold tabular-nums">{f.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border-border-strong bg-surface mt-6 flex items-start gap-4 rounded-2xl border border-dashed p-5">
                <Wallet className="text-primary mt-0.5 size-6 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">
                    Fees for {settings.admissionsSession} will be published here once confirmed.
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Call or WhatsApp the office and we&apos;ll tell you the current fee details.
                  </p>
                </div>
              </div>
            )}
            {p.feesNote ? <p className="text-muted-foreground mt-3 text-sm">{p.feesNote}</p> : null}
            {p.seatsAvailable !== null || p.applicationDeadline || dates.length ? (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {p.seatsAvailable !== null ? (
                  <li className="bg-primary-soft text-primary-soft-foreground rounded-2xl p-4">
                    <span className="block text-sm">Seats available</span>
                    <span className="font-display text-2xl font-semibold">{p.seatsAvailable}</span>
                  </li>
                ) : null}
                {p.applicationDeadline ? (
                  <li className="bg-accent-soft text-accent-soft-foreground rounded-2xl p-4">
                    <span className="block text-sm">Last date to apply</span>
                    <span className="font-display text-2xl font-semibold">
                      {formatDate(p.applicationDeadline)}
                    </span>
                  </li>
                ) : null}
                {dates.slice(0, 4).map((d) => (
                  <li key={d.id} className="border-border bg-surface rounded-2xl border p-4">
                    <span className="text-muted-foreground block text-sm">{d.label}</span>
                    <span className="font-semibold">{d.date ? formatDate(d.date) : "To be announced"}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {p.documents.length ? (
            <section id="documents" aria-labelledby="docs-h" className="scroll-mt-28">
              <h2 id="docs-h" className="text-h2 font-semibold">
                Documents you&apos;ll need
              </h2>
              <ul className="mt-6 space-y-2.5">
                {p.documents.map((d) => (
                  <li key={d} className="flex items-start gap-3">
                    <FileText className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
                    {d}
                  </li>
                ))}
              </ul>
              <Link
                href="/admissions/checklist"
                className="text-primary mt-5 inline-flex items-center gap-1.5 font-semibold hover:underline"
              >
                Printable document checklist <ArrowRight className="size-4" aria-hidden />
              </Link>
            </section>
          ) : null}

          <section
            id="enquire"
            aria-labelledby="enq-h"
            className="border-border bg-surface scroll-mt-28 rounded-[2rem] border p-5 shadow-[var(--shadow-soft)] sm:p-8 md:p-10"
          >
            <Eyebrow>Enquire</Eyebrow>
            <h2 id="enq-h" className="text-h2 mt-3 font-semibold">
              Questions about the {p.shortName}?
            </h2>
            <p className="text-muted-foreground mt-2">Leave your details and we&apos;ll call you back.</p>
            <LazyEnquiryForm
              className="mt-8"
              programmes={[{ id: p.id, name: p.name, shortName: p.shortName }]}
              defaultProgrammeId={p.id}
              formName={`programme:${p.slug}`}
              whatsappUrl={wa}
              phoneHref={telLink(settings.phone)}
            />
          </section>
        </div>
      </div>
      <JsonLd
        data={courseJsonLd({ ...p, summary: p.summary || truncate(stripHtml(p.overview)) }, settings)}
      />
    </>
  );
}
