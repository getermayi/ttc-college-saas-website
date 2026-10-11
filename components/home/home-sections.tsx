import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Clock3,
  GraduationCap,
  Landmark,
  Megaphone,
  Pin,
  Quote,
  ShieldCheck,
  Trees,
  Users,
} from "lucide-react";
import type {
  FaqItem,
  NoticeListItem,
  PublicProgramme,
  SectionData,
  Settings,
  TestimonialItem,
} from "@/lib/data/public";
import type { GalleryImage } from "@/lib/content-types";
import { cn, formatDate } from "@/lib/utils";
import { NOTICE_CATEGORY_LABELS } from "@/lib/constants";
import { Icon } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Photo } from "@/components/site/photo";
import { Eyebrow, MotifBand, MotifDiamond } from "@/components/site/motif";
import { SectionHeading } from "@/components/site/page-header";
import { CountUp } from "@/components/site/count-up";
import { FaqList } from "@/components/site/faq-list";
import { NewBadge } from "@/components/site/new-badge";

// ── Hero ─────────────────────────────────────────────────────

export function Hero({
  section,
  settings,
  programmes,
}: {
  section: SectionData;
  settings: Settings;
  programmes: PublicProgramme[];
}) {
  const bed = programmes[0];
  return (
    <section className="relative isolate overflow-hidden" aria-labelledby="hero-title">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_85%_-10%,var(--primary-soft),transparent_60%),radial-gradient(40rem_30rem_at_-10%_90%,var(--accent-soft),transparent_60%)]"
      />
      <div
        aria-hidden
        className="motif-texture absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
      />

      <div className="container-page grid items-center gap-12 pt-6 pb-16 md:pt-10 lg:grid-cols-12 lg:gap-10 lg:pb-24">
        <div className="lg:col-span-6">
          <div className="animate-fade-up">
            {settings.admissionsOpen && settings.admissionsBadge ? (
              <Link
                href="/admissions"
                className="group border-success/25 bg-success-soft text-success-soft-foreground inline-flex items-center gap-2.5 rounded-full border py-1.5 pr-4 pl-2 text-sm font-semibold shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lift)]"
              >
                <span className="relative flex size-2.5">
                  <span className="bg-success absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:hidden" />
                  <span className="bg-success relative inline-flex size-2.5 rounded-full" />
                </span>
                {settings.admissionsBadge}
                <ArrowRight
                  className="size-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            ) : section.eyebrow ? (
              <Eyebrow>{section.eyebrow}</Eyebrow>
            ) : null}
          </div>

          <h1
            id="hero-title"
            className="animate-fade-up text-display text-balance-pretty mt-6 font-semibold [animation-delay:80ms]"
          >
            {section.title ?? settings.siteName}
          </h1>
          {section.subtitle ? (
            <p className="animate-fade-up text-lead text-muted-foreground mt-6 max-w-xl [animation-delay:160ms]">
              {section.subtitle}
            </p>
          ) : null}

          <div className="animate-fade-up mt-9 flex flex-col gap-3 [animation-delay:240ms] sm:flex-row sm:items-center">
            {section.ctaLabel && section.ctaHref ? (
              <Button asChild variant="accent" size="lg" className="h-14 px-7 text-[1.02rem]">
                <Link href={section.ctaHref}>
                  {section.ctaLabel}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            ) : null}
            {section.secondaryCtaLabel && section.secondaryCtaHref ? (
              <Button asChild variant="outline" size="lg" className="h-14 px-7">
                <Link href={section.secondaryCtaHref}>{section.secondaryCtaLabel}</Link>
              </Button>
            ) : null}
          </div>

          <dl className="animate-fade-up border-border mt-10 grid max-w-lg grid-cols-3 gap-4 border-t pt-6 [animation-delay:320ms]">
            <div>
              <dt className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Since</dt>
              <dd className="font-display mt-1 text-2xl font-semibold">{settings.established ?? "—"}</dd>
            </div>
            {bed?.intake ? (
              <div>
                <dt className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  {bed.shortName} seats
                </dt>
                <dd className="font-display mt-1 text-2xl font-semibold">{bed.intake}</dd>
              </div>
            ) : null}
            {settings.campusAcres ? (
              <div>
                <dt className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Campus</dt>
                <dd className="font-display mt-1 text-2xl font-semibold">{settings.campusAcres} acres</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="relative lg:col-span-6">
          <div className="grid [height:clamp(22rem,70vw,36rem)] grid-cols-6 grid-rows-6 gap-3 sm:gap-4">
            <Photo
              media={section.image}
              label={section.image ? undefined : "Campus at Bogdo, Aalo"}
              priority
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="col-span-4 row-span-6 shadow-[var(--shadow-lift)]"
              variant={0}
            />
            <Photo
              media={section.items[0]?.image}
              label={section.items[0]?.image ? undefined : "Teaching practice"}
              sizes="(min-width: 1024px) 18vw, 40vw"
              className="col-span-2 row-span-3 shadow-[var(--shadow-soft)]"
              variant={1}
            />
            <Photo
              media={section.items[1]?.image}
              label={section.items[1]?.image ? undefined : "Classroom"}
              sizes="(min-width: 1024px) 18vw, 40vw"
              className="col-span-2 row-span-3 shadow-[var(--shadow-soft)]"
              variant={2}
            />
          </div>
          <div className="animate-fade-up border-border bg-surface/95 absolute right-4 -bottom-6 left-4 flex items-center gap-3 rounded-2xl border p-4 shadow-[var(--shadow-float)] backdrop-blur [animation-delay:400ms] sm:right-8 sm:left-auto sm:w-80">
            <span className="bg-primary text-primary-foreground grid size-11 shrink-0 place-items-center rounded-xl">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <p className="text-sm leading-snug">
              <span className="font-semibold">NCTE recognised B.Ed.</span>
              <span className="text-muted-foreground block">Affiliated to Rajiv Gandhi University</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Trust strip ──────────────────────────────────────────────

const TRUST_ICONS = [Landmark, BadgeCheck, CalendarDays, Trees];

export function TrustStrip({ section }: { section: SectionData }) {
  if (!section.items.length) return null;
  return (
    <section aria-label="Why you can trust TTC Aalo" className="border-border bg-surface border-y">
      <ul className="container-page divide-border grid grid-cols-2 md:grid-cols-4 md:divide-x">
        {section.items.map((item, i) => {
          const I = TRUST_ICONS[i % TRUST_ICONS.length];
          return (
            <li key={i} className="flex items-center gap-3 px-1 py-5 md:justify-center md:px-4">
              <span className="bg-primary-soft text-primary-soft-foreground grid size-10 shrink-0 place-items-center rounded-full">
                <I className="size-[1.15rem]" aria-hidden />
              </span>
              <span className="leading-tight">
                <span className="block text-[0.95rem] font-semibold">{item.title}</span>
                {item.description ? (
                  <span className="text-muted-foreground block text-[0.8rem]">{item.description}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── Stats counters ───────────────────────────────────────────

export function Stats({ section }: { section: SectionData }) {
  if (!section.items.length) return null;
  return (
    <section aria-label="TTC Aalo in numbers" className="container-page section-y pb-0 md:pb-0">
      <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {section.items.map((item, i) => (
          <div
            key={i}
            className={cn(
              "reveal border-border relative overflow-hidden rounded-3xl border p-6 md:p-7",
              i === 0 ? "bg-primary text-primary-foreground" : "bg-surface",
            )}
          >
            {i === 0 ? <div className="motif-texture-light absolute inset-0" aria-hidden /> : null}
            <dd className="font-display relative text-[clamp(2.4rem,1.8rem+2.4vw,3.6rem)] leading-none font-semibold tracking-tight">
              <CountUp value={item.value ?? ""} suffix={item.suffix} />
            </dd>
            <dt className="relative mt-3 font-semibold">{item.title}</dt>
            {item.description ? (
              <p
                className={cn(
                  "relative mt-1 text-sm",
                  i === 0 ? "text-primary-foreground/75" : "text-muted-foreground",
                )}
              >
                {item.description}
              </p>
            ) : null}
          </div>
        ))}
      </dl>
    </section>
  );
}

// ── Programmes ───────────────────────────────────────────────

export function ProgrammeCard({ p, featured = false }: { p: PublicProgramme; featured?: boolean }) {
  return (
    <article
      className={cn(
        "group reveal border-border bg-surface relative flex flex-col overflow-hidden rounded-3xl border shadow-[var(--shadow-soft)] transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]",
        featured && "md:flex-row",
      )}
    >
      <Photo
        media={p.heroImage}
        label={p.heroImage ? undefined : `${p.shortName} students`}
        rounded="rounded-none"
        sizes={featured ? "(min-width: 768px) 40vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
        className={cn("aspect-[16/10]", featured && "md:aspect-auto md:w-[44%] md:shrink-0")}
        variant={0}
      />
      <div className="flex flex-1 flex-col p-6 md:p-8">
        <div className="flex flex-wrap gap-2">
          {p.duration ? (
            <Badge tone="primary">
              <Clock3 aria-hidden /> {p.duration}
            </Badge>
          ) : null}
          {p.intake ? (
            <Badge tone="accent">
              <Users aria-hidden /> {p.intake} seats
            </Badge>
          ) : null}
          {p.semesters ? <Badge>{p.semesters} semesters</Badge> : null}
        </div>
        <h3 className="text-h3 mt-4 font-semibold">
          <Link
            href={`/programmes/${p.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {p.name}
          </Link>
        </h3>
        <p className="text-muted-foreground mt-3">{p.summary}</p>
        {featured && p.eligibility.length ? (
          <ul className="mt-5 space-y-2 text-sm">
            {p.eligibility.slice(0, 2).map((row) => (
              <li key={row.category} className="flex gap-2">
                <BadgeCheck className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  <span className="font-semibold">{row.category}:</span> {row.requirement}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <span className="text-primary mt-auto inline-flex items-center gap-1.5 pt-6 font-semibold">
          Explore {p.shortName}
          <ArrowUpRight
            className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </span>
      </div>
    </article>
  );
}

export function ProgrammesSection({
  section,
  programmes,
}: {
  section: SectionData;
  programmes: PublicProgramme[];
}) {
  if (!programmes.length) return null;
  const [first, ...rest] = programmes;
  return (
    <section className="container-page section-y" aria-labelledby="programmes-title">
      <SectionHeading
        id="programmes-title"
        eyebrow={section.eyebrow}
        title={section.title ?? "Programmes"}
        description={section.subtitle}
        action={
          section.ctaLabel && section.ctaHref ? (
            <Button asChild variant="outline">
              <Link href={section.ctaHref}>
                {section.ctaLabel} <ArrowRight aria-hidden />
              </Link>
            </Button>
          ) : null
        }
      />
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProgrammeCard p={first} featured />
        </div>
        <div className="grid gap-4">
          {rest.map((p) => (
            <ProgrammeCard key={p.id} p={p} />
          ))}
          <Link
            href="/admissions#eligibility"
            className="group reveal bg-accent text-accent-foreground relative flex flex-col justify-between overflow-hidden rounded-3xl p-6 shadow-[var(--shadow-soft)] transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] md:p-8"
          >
            <MotifDiamond className="absolute -top-4 -right-4 size-32 text-white/15" />
            <GraduationCap className="size-8" aria-hidden />
            <div className="mt-8">
              <p className="font-display text-2xl leading-tight font-semibold">Am I eligible?</p>
              <p className="text-accent-foreground/85 mt-2">
                Answer three quick questions and find out in under a minute.
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 font-semibold">
                Check now{" "}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </div>
          </Link>
          <div className="reveal border-border bg-surface-2 rounded-3xl border p-6 md:p-8">
            <BookOpen className="text-primary size-7" aria-hidden />
            <p className="font-display mt-6 text-xl leading-tight font-semibold">Already teaching?</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Eligible in-service teachers get preference. Keep a No Objection Certificate from your employer
              ready.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Why TTC Aalo ─────────────────────────────────────────────

export function WhySection({ section }: { section: SectionData }) {
  if (!section.items.length) return null;
  return (
    <section className="bg-surface-2/60 relative overflow-hidden" aria-labelledby="why-title">
      <MotifBand className="opacity-30" />
      <div className="container-page section-y">
        <SectionHeading
          id="why-title"
          eyebrow={section.eyebrow}
          title={section.title ?? "Why TTC Aalo"}
          description={section.subtitle}
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {section.items.map((item, i) => (
            <li
              key={i}
              className={cn(
                "group reveal border-border bg-surface relative overflow-hidden rounded-3xl border p-6 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] md:p-7",
                i === 0 &&
                  "lg:bg-primary lg:text-primary-foreground lg:row-span-2 lg:flex lg:flex-col lg:justify-between",
                i === 5 &&
                  section.items.length === 6 &&
                  "lg:col-span-3 lg:flex lg:items-center lg:gap-6 [&_h3]:lg:mt-0",
              )}
            >
              {i === 0 ? (
                <div className="motif-texture-light absolute inset-0 hidden lg:block" aria-hidden />
              ) : null}
              <span
                className={cn(
                  "bg-primary-soft text-primary-soft-foreground relative grid size-12 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3",
                  i === 0 && "lg:text-primary-foreground lg:bg-white/12",
                )}
              >
                <Icon name={item.icon} className="size-6" />
              </span>
              <div className="relative">
                <h3
                  className={cn(
                    "mt-5 font-sans text-lg font-semibold",
                    i === 0 && "lg:font-display lg:mt-24 lg:text-3xl lg:leading-tight",
                  )}
                >
                  {item.title}
                </h3>
                <p
                  className={cn(
                    "text-muted-foreground mt-2 leading-relaxed",
                    i === 0 && "lg:text-primary-foreground/80 lg:text-lg",
                  )}
                >
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Campus life gallery ──────────────────────────────────────

export function CampusSection({ section, images }: { section: SectionData; images: GalleryImage[] }) {
  const placeholders = section.items.length ? section.items : [{ title: "Campus" }];
  const tiles = images.length
    ? images.slice(0, 5).map((img) => ({ key: img.mediaId, media: img.media, label: img.caption }))
    : placeholders.slice(0, 5).map((p, i) => ({ key: String(i), media: p.image ?? null, label: p.title }));
  const spans = [
    "col-span-2 row-span-2 md:col-span-2 md:row-span-2",
    "col-span-1 row-span-1",
    "col-span-1 row-span-1",
    "col-span-1 row-span-1 md:col-span-1",
    "col-span-1 row-span-1 md:col-span-1",
  ];
  return (
    <section className="container-page section-y" aria-labelledby="campus-title">
      <SectionHeading
        id="campus-title"
        eyebrow={section.eyebrow}
        title={section.title ?? "Campus life"}
        description={section.subtitle}
        action={
          section.ctaLabel && section.ctaHref ? (
            <Button asChild variant="outline">
              <Link href={section.ctaHref}>
                {section.ctaLabel} <ArrowRight aria-hidden />
              </Link>
            </Button>
          ) : null
        }
      />
      <div className="mt-10 grid auto-rows-[9.5rem] grid-cols-2 gap-3 sm:auto-rows-[12rem] md:grid-cols-4 md:gap-4">
        {tiles.map((t, i) => (
          <figure key={t.key} className={cn("reveal group relative overflow-hidden rounded-3xl", spans[i])}>
            <Photo
              media={t.media}
              label={t.media ? undefined : t.label}
              variant={i}
              className="size-full transition-transform duration-700 group-hover:scale-[1.03]"
              sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
            />
            {t.media && t.label ? (
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-10 text-sm font-medium text-white">
                {t.label}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  );
}

// ── Principal's message ──────────────────────────────────────

export function PrincipalSection({ section, settings }: { section: SectionData; settings: Settings }) {
  if (!settings.principalMessage) return null;
  return (
    <section className="container-page section-y pt-0 md:pt-0" aria-labelledby="principal-title">
      <div className="reveal border-border bg-surface grid overflow-hidden rounded-[2rem] border shadow-[var(--shadow-soft)] md:grid-cols-12">
        <Photo
          media={settings.principalPhoto}
          label={settings.principalPhoto ? undefined : (settings.principalName ?? "Principal")}
          rounded="rounded-none"
          className="aspect-[4/3] md:col-span-5 md:aspect-auto md:min-h-[26rem]"
          variant={3}
          sizes="(min-width: 768px) 40vw, 100vw"
        />
        <div className="relative p-7 md:col-span-7 md:p-12">
          <Quote className="text-accent/15 absolute top-8 right-8 size-16" aria-hidden />
          {section.eyebrow ? <Eyebrow>{section.eyebrow}</Eyebrow> : null}
          <h2 id="principal-title" className="text-h2 mt-3 font-semibold">
            {section.title ?? "A message from the Principal"}
          </h2>
          <div className="text-lead text-foreground/85 mt-6 space-y-4 leading-relaxed">
            {settings.principalMessage.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <p className="border-border mt-8 border-t pt-5">
            <span className="font-display block text-xl font-semibold">{settings.principalName}</span>
            <span className="text-muted-foreground text-sm">
              {settings.principalTitle}, {settings.shortName}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Notices ──────────────────────────────────────────────────

export function NoticesSection({ section, notices }: { section: SectionData; notices: NoticeListItem[] }) {
  if (!notices.length) return null;
  const latest = notices.slice(0, 4);
  return (
    <section className="bg-primary text-primary-foreground" aria-labelledby="notices-title">
      <div className="overflow-hidden border-b border-white/10 py-3" aria-hidden>
        <div className="animate-marquee flex w-max gap-10 text-sm font-medium whitespace-nowrap [--marquee-duration:45s] hover:[animation-play-state:paused] motion-reduce:animate-none">
          {[...latest, ...latest].map((n, i) => (
            <span key={`${n.id}-${i}`} className="inline-flex items-center gap-3">
              <Megaphone className="size-4 text-[#f0b597]" />
              {n.title}
              <span className="text-primary-foreground/50">·</span>
            </span>
          ))}
        </div>
      </div>
      <div className="motif-texture-light">
        <div className="container-page section-y">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              {section.eyebrow ? <Eyebrow className="text-[#f0b597]">{section.eyebrow}</Eyebrow> : null}
              <h2 id="notices-title" className="text-h2 mt-3 font-semibold">
                {section.title ?? "Latest notices"}
              </h2>
            </div>
            {section.ctaLabel && section.ctaHref ? (
              <Button asChild variant="light">
                <Link href={section.ctaHref}>
                  {section.ctaLabel} <ArrowRight aria-hidden />
                </Link>
              </Button>
            ) : null}
          </div>
          <ul className="mt-10 grid gap-3 md:grid-cols-2">
            {latest.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/notices/${n.slug}`}
                  className="group flex h-full gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5 transition-colors hover:bg-white/[0.12]"
                >
                  <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-white/10 py-2 text-center">
                    <span className="font-display text-2xl leading-none font-semibold">
                      {formatDate(n.publishedAt, { day: "numeric" })}
                    </span>
                    <span className="text-primary-foreground/70 mt-1 text-[0.7rem] font-semibold tracking-wider uppercase">
                      {formatDate(n.publishedAt, { month: "short" })}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-white/12 px-2 py-0.5">
                        {NOTICE_CATEGORY_LABELS[n.category]}
                      </span>
                      {n.pinned ? (
                        <span className="inline-flex items-center gap-1 text-[#f0b597]">
                          <Pin className="size-3" aria-hidden /> Pinned
                        </span>
                      ) : null}
                      <NewBadge date={n.publishedAt.toISOString()} variant="light" />
                    </div>
                    <p className="mt-2 leading-snug font-semibold group-hover:underline group-hover:underline-offset-4">
                      {n.title}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ─────────────────────────────────────────────

export function TestimonialsSection({
  section,
  testimonials,
}: {
  section: SectionData;
  testimonials: TestimonialItem[];
}) {
  const items = testimonials.filter((t) => t.showOnHome);
  if (!items.length) return null;
  return (
    <section className="section-y" aria-labelledby="testimonials-title">
      <div className="container-page">
        <SectionHeading
          id="testimonials-title"
          eyebrow={section.eyebrow}
          title={section.title ?? "In their words"}
          description={section.subtitle}
        />
      </div>
      <ul
        className="mt-10 flex snap-x snap-mandatory [scrollbar-width:thin] gap-4 overflow-x-auto px-[max(1rem,calc((100vw-78rem)/2+2rem))] pb-4"
        aria-label="Testimonials"
      >
        {items.map((t) => (
          <li key={t.id} className="w-[min(86vw,26rem)] shrink-0 snap-start">
            <figure className="border-border bg-surface flex h-full flex-col rounded-3xl border p-7 shadow-[var(--shadow-soft)]">
              <Quote className="text-accent size-8" aria-hidden />
              <blockquote className="font-display mt-4 flex-1 text-xl leading-snug">“{t.quote}”</blockquote>
              <figcaption className="border-border mt-6 flex items-center gap-3 border-t pt-5">
                <Photo
                  media={t.photo}
                  rounded="rounded-full"
                  className="size-12 shrink-0"
                  sizes="48px"
                  variant={2}
                />
                <span>
                  <span className="block font-semibold">{t.name}</span>
                  <span className="text-muted-foreground text-sm">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── FAQ preview ──────────────────────────────────────────────

export function FaqSection({ section, faqs }: { section: SectionData; faqs: FaqItem[] }) {
  const items = faqs.filter((f) => f.showOnHome).slice(0, 6);
  if (!items.length) return null;
  return (
    <section className="container-page section-y" aria-labelledby="faq-title">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading
            id="faq-title"
            eyebrow={section.eyebrow}
            title={section.title ?? "Questions"}
            description={section.subtitle}
          />
          {section.ctaLabel && section.ctaHref ? (
            <Link
              href={section.ctaHref}
              className="text-primary mt-6 inline-flex items-center gap-1.5 font-semibold hover:underline"
            >
              {section.ctaLabel} <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : null}
        </div>
        <div className="border-border bg-surface rounded-3xl border px-6 shadow-[var(--shadow-soft)] md:px-8 lg:col-span-8">
          <FaqList items={items} />
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ────────────────────────────────────────────────

export function CtaBand({ section }: { section: SectionData }) {
  return (
    <section className="container-page" aria-labelledby="cta-title">
      <div className="reveal relative isolate overflow-hidden rounded-[2rem] bg-[#173b2c] px-6 py-14 text-[#fbf7f0] shadow-[var(--shadow-lift)] md:px-14 md:py-20">
        <div className="motif-texture-light absolute inset-0 -z-10" aria-hidden />
        <div
          aria-hidden
          className="absolute -top-24 -right-24 -z-10 size-80 rounded-full bg-[#b14f26]/40 blur-3xl"
        />
        <MotifDiamond className="absolute right-10 -bottom-10 -z-10 size-48 text-white/10" />
        <div className="max-w-2xl">
          <h2 id="cta-title" className="text-h2 text-balance-pretty font-semibold">
            {section.title ?? "Ready to take the first step?"}
          </h2>
          {section.subtitle ? <p className="text-lead mt-4 text-[#fbf7f0]/80">{section.subtitle}</p> : null}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {section.ctaLabel && section.ctaHref ? (
              <Button asChild variant="accent" size="lg" className="h-14 px-7">
                <Link href={section.ctaHref}>
                  {section.ctaLabel} <ArrowRight aria-hidden />
                </Link>
              </Button>
            ) : null}
            {section.secondaryCtaLabel && section.secondaryCtaHref ? (
              <Button asChild variant="light" size="lg" className="h-14 px-7">
                <Link href={section.secondaryCtaHref}>{section.secondaryCtaLabel}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
