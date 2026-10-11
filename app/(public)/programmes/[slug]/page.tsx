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
import { formatDate, stripHtml, telLink, truncate, whatsappLink } from "@/lib/utils";
import { courseJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/site/json-ld";
import { Breadcrumbs } from "@/components/site/page-header";
import { RichText } from "@/components/site/rich-text";
import { Photo } from "@/components/site/photo";
import { Eyebrow } from "@/components/site/motif";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { Button } from "@/components/ui/button";

// Await params at the top so unknown slugs return a real 404 status.
export const instant = false;

export async function generateStaticParams() {
  const programmes = await getActiveProgrammes();
  return programmes.map((p) => ({ slug: p.slug }));
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
  const wa = whatsappLink(settings.whatsappNumber, `Hello TTC Aalo, I'd like to know more about the ${p.shortName}.`);

  const facts = [
    p.duration ? { icon: Clock3, label: "Duration", value: p.duration } : null,
    p.semesters ? { icon: CalendarDays, label: "Semesters", value: String(p.semesters) } : null,
    p.intake ? { icon: Users, label: "Intake", value: `${p.intake} seats` } : null,
    p.affiliation ? { icon: Landmark, label: "Affiliation", value: p.affiliation.replace(/\s*\(.*?\)/, "").split(",")[0] } : null,
    p.recognition ? { icon: ShieldCheck, label: "Recognition", value: p.recognition.match(/\(([^)]+)\)/)?.[1] ?? p.recognition } : null,
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
        <div className="motif-texture absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
        <div className="container-page relative pb-12 pt-6 md:pt-10">
          <Breadcrumbs items={[{ name: "Programmes", href: "/programmes" }, { name: p.shortName, href: `/programmes/${p.slug}` }]} />
          <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Eyebrow>{p.level}</Eyebrow>
              <h1 className="mt-3 text-h1 font-semibold">{p.name}</h1>
              {p.tagline ? <p className="mt-4 font-display text-2xl text-primary">{p.tagline}</p> : null}
              <p className="mt-4 max-w-2xl text-lead text-muted-foreground">{p.summary}</p>
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
            <Photo media={p.heroImage} label={p.heroImage ? undefined : `${p.shortName} classroom`} priority className="aspect-[4/3] lg:col-span-5" sizes="(min-width: 1024px) 40vw, 100vw" />
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {facts.map((f) => (
              <div key={f.label} className="rounded-2xl border border-border bg-surface p-4">
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <f.icon className="size-4 text-accent" aria-hidden /> {f.label}
                </dt>
                <dd className="mt-1.5 font-semibold leading-snug">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="container-page grid gap-12 lg:grid-cols-12">
        <nav aria-label="On this page" className="hidden lg:col-span-3 lg:block">
          <ul className="sticky top-28 space-y-1 border-l border-border">
            {toc.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-sm text-muted-foreground hover:border-accent hover:text-foreground">
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-16 lg:col-span-9">
          <section id="overview" aria-labelledby="overview-h" className="scroll-mt-28">
            <h2 id="overview-h" className="text-h2 font-semibold">Overview</h2>
            <RichText html={p.overview} className="mt-5" />
          </section>

          {p.eligibility.length ? (
            <section id="eligibility" aria-labelledby="elig-h" className="scroll-mt-28">
              <h2 id="elig-h" className="text-h2 font-semibold">Who can apply</h2>
              <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
                <table className="w-full text-left">
                  <caption className="sr-only">Eligibility for {p.name}</caption>
                  <thead className="bg-surface-2 text-sm">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">For</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Requirement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {p.eligibility.map((row) => (
                      <tr key={row.category} className="align-top">
                        <th scope="row" className="w-2/5 px-5 py-4 font-semibold">{row.category}</th>
                        <td className="px-5 py-4 text-muted-foreground">{row.requirement}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {p.eligibilityNotes ? (
                <p className="mt-4 flex items-start gap-2 text-sm font-medium">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {p.eligibilityNotes}
                </p>
              ) : null}
              <Link href="/admissions#eligibility" className="mt-4 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
                Try the eligibility checker <ArrowRight className="size-4" aria-hidden />
              </Link>
            </section>
          ) : null}

          {p.subjects.length ? (
            <section id="subjects" aria-labelledby="subj-h" className="scroll-mt-28">
              <h2 id="subj-h" className="text-h2 font-semibold">What you&apos;ll study</h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {p.subjects.map((s) => (
                  <li key={s} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5">
                    <BookOpen className="size-5 shrink-0 text-primary" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">Course structure follows the university syllabus and may be updated by the university.</p>
            </section>
          ) : null}

          {p.careers.length ? (
            <section id="careers" aria-labelledby="career-h" className="scroll-mt-28">
              <h2 id="career-h" className="text-h2 font-semibold">Where it can lead</h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {p.careers.map((c) => (
                  <li key={c.title} className="rounded-2xl border border-border bg-surface p-5">
                    <BriefcaseBusiness className="size-5 text-accent" aria-hidden />
                    <h3 className="mt-3 font-sans font-semibold">{c.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                These are common pathways, not guarantees. Jobs depend on each employer&apos;s recruitment rules and your own effort.
              </p>
            </section>
          ) : null}

          <section id="fees" aria-labelledby="fees-h" className="scroll-mt-28">
            <h2 id="fees-h" className="text-h2 font-semibold">Fees</h2>
            {p.fees.length ? (
              <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
                <table className="w-full text-left">
                  <caption className="sr-only">Fees for {p.name}</caption>
                  <tbody className="divide-y divide-border">
                    {p.fees.map((f) => (
                      <tr key={f.label}>
                        <th scope="row" className="px-5 py-4 font-medium">
                          {f.label}
                          {f.note ? <span className="block text-sm font-normal text-muted-foreground">{f.note}</span> : null}
                        </th>
                        <td className="px-5 py-4 text-right font-semibold tabular-nums">{f.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-6 flex items-start gap-4 rounded-2xl border border-dashed border-border-strong bg-surface p-5">
                <Wallet className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="font-semibold">Fees for {settings.admissionsSession} will be published here once confirmed.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Call or WhatsApp the office and we&apos;ll tell you the current fee details.</p>
                </div>
              </div>
            )}
            {p.feesNote ? <p className="mt-3 text-sm text-muted-foreground">{p.feesNote}</p> : null}
            {p.seatsAvailable !== null || p.applicationDeadline || dates.length ? (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {p.seatsAvailable !== null ? (
                  <li className="rounded-2xl bg-primary-soft p-4 text-primary-soft-foreground">
                    <span className="block text-sm">Seats available</span>
                    <span className="font-display text-2xl font-semibold">{p.seatsAvailable}</span>
                  </li>
                ) : null}
                {p.applicationDeadline ? (
                  <li className="rounded-2xl bg-accent-soft p-4 text-accent-soft-foreground">
                    <span className="block text-sm">Last date to apply</span>
                    <span className="font-display text-2xl font-semibold">{formatDate(p.applicationDeadline)}</span>
                  </li>
                ) : null}
                {dates.slice(0, 4).map((d) => (
                  <li key={d.id} className="rounded-2xl border border-border bg-surface p-4">
                    <span className="block text-sm text-muted-foreground">{d.label}</span>
                    <span className="font-semibold">{d.date ? formatDate(d.date) : "To be announced"}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {p.documents.length ? (
            <section id="documents" aria-labelledby="docs-h" className="scroll-mt-28">
              <h2 id="docs-h" className="text-h2 font-semibold">Documents you&apos;ll need</h2>
              <ul className="mt-6 space-y-2.5">
                {p.documents.map((d) => (
                  <li key={d} className="flex items-start gap-3">
                    <FileText className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    {d}
                  </li>
                ))}
              </ul>
              <Link href="/admissions/checklist" className="mt-5 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
                Printable document checklist <ArrowRight className="size-4" aria-hidden />
              </Link>
            </section>
          ) : null}

          <section id="enquire" aria-labelledby="enq-h" className="scroll-mt-28 rounded-[2rem] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] sm:p-8 md:p-10">
            <Eyebrow>Enquire</Eyebrow>
            <h2 id="enq-h" className="mt-3 text-h2 font-semibold">Questions about the {p.shortName}?</h2>
            <p className="mt-2 text-muted-foreground">Leave your details and we&apos;ll call you back.</p>
            <EnquiryForm
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
      <JsonLd data={courseJsonLd({ ...p, summary: p.summary || truncate(stripHtml(p.overview)) }, settings)} />
    </>
  );
}
