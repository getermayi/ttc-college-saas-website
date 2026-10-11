import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getFaculty, getSections, getSettings, sectionByKey } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { PageHeader, SectionHeading } from "@/components/site/page-header";
import { RichText } from "@/components/site/rich-text";
import { Photo } from "@/components/site/photo";
import { Eyebrow, MotifBand } from "@/components/site/motif";
import { Icon } from "@/lib/icons";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/about", title: "About TTC Aalo" });
}

export default async function AboutPage() {
  const [sections, settings, faculty] = await Promise.all([
    getSections("about"),
    getSettings(),
    getFaculty(),
  ]);
  const intro = sectionByKey(sections, "about.intro");
  const history = sectionByKey(sections, "about.history");
  const mission = sectionByKey(sections, "about.mission");
  const management = sectionByKey(sections, "about.management");
  const timeline = sectionByKey(sections, "about.timeline");
  const leaders = faculty.filter((f) => f.type === "LEADERSHIP");

  return (
    <>
      <PageHeader
        crumbs={[{ name: "About", href: "/about" }]}
        eyebrow={intro?.eyebrow ?? "About us"}
        title={intro?.title ?? `About ${settings.shortName}`}
        description={intro?.subtitle}
      />

      {history ? (
        <section
          className="container-page grid gap-10 pb-20 lg:grid-cols-12 lg:items-center"
          aria-labelledby="history-title"
        >
          <div className="lg:col-span-6">
            {history.eyebrow ? <Eyebrow>{history.eyebrow}</Eyebrow> : null}
            <h2 id="history-title" className="text-h2 mt-3 font-semibold">
              {history.title}
            </h2>
            <RichText html={history.body} className="mt-6" />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:col-span-6">
            <Photo
              media={history.image}
              label={history.image ? undefined : "Our campus"}
              className="col-span-2 aspect-[16/10]"
              variant={0}
            />
            <Photo media={history.items[0]?.image} label="Early days" className="aspect-square" variant={4} />
            <Photo
              media={history.items[1]?.image}
              label="Students today"
              className="aspect-square"
              variant={1}
            />
          </div>
        </section>
      ) : null}

      {mission?.items.length ? (
        <section className="bg-surface-2/60" aria-labelledby="mission-title">
          <MotifBand className="opacity-30" />
          <div className="container-page section-y">
            <SectionHeading
              id="mission-title"
              eyebrow={mission.eyebrow}
              title={mission.title ?? "Our mission"}
              description={mission.subtitle}
            />
            <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mission.items.map((item, i) => (
                <li key={i} className="reveal border-border bg-surface rounded-3xl border p-6 md:p-7">
                  <div className="flex items-center justify-between">
                    <span className="bg-primary-soft text-primary-soft-foreground grid size-12 place-items-center rounded-2xl">
                      <Icon name={item.icon} className="size-6" />
                    </span>
                    <span className="font-display text-border-strong text-3xl font-semibold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-5 font-sans text-lg font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground mt-2">{item.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      <section
        className="container-page section-y grid gap-12 lg:grid-cols-12"
        aria-labelledby="management-title"
      >
        {management ? (
          <div className="lg:col-span-5">
            {management.eyebrow ? <Eyebrow>{management.eyebrow}</Eyebrow> : null}
            <h2 id="management-title" className="text-h2 mt-3 font-semibold">
              {management.title}
            </h2>
            <RichText html={management.body} className="mt-6" />
          </div>
        ) : null}
        {leaders.length ? (
          <div className="lg:col-span-7">
            <h2 className="sr-only">Leadership</h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {leaders.map((p, i) => (
                <li
                  key={p.id}
                  className="reveal border-border bg-surface overflow-hidden rounded-3xl border shadow-[var(--shadow-soft)]"
                >
                  <Photo
                    media={p.photo}
                    label={p.photo ? undefined : p.name}
                    rounded="rounded-none"
                    className="aspect-[4/3]"
                    variant={i + 2}
                    sizes="(min-width: 640px) 30vw, 100vw"
                  />
                  <div className="p-5">
                    <p className="font-display text-xl font-semibold">{p.name}</p>
                    <p className="text-accent text-sm font-medium">{p.designation}</p>
                    {p.qualifications ? (
                      <p className="text-muted-foreground mt-2 text-sm">{p.qualifications}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {timeline?.items.length ? (
        <section className="container-page pb-8" aria-labelledby="timeline-title">
          <SectionHeading
            id="timeline-title"
            eyebrow={timeline.eyebrow}
            title={timeline.title ?? "Our journey"}
          />
          <ol className="border-border-strong relative mt-12 border-l-2 border-dashed pl-8 md:ml-4">
            {timeline.items.map((item, i) => (
              <li key={i} className="reveal relative pb-10 last:pb-0">
                <span
                  className="bg-accent ring-background absolute top-1 -left-[2.6rem] grid size-5 place-items-center rounded-full ring-4"
                  aria-hidden
                >
                  <span className="size-1.5 rounded-full bg-white" />
                </span>
                <p className="font-display text-primary text-2xl font-semibold">{item.value}</p>
                <h3 className="mt-1 font-sans text-lg font-semibold">{item.title}</h3>
                {item.description ? (
                  <p className="text-muted-foreground mt-1 max-w-xl">{item.description}</p>
                ) : null}
              </li>
            ))}
          </ol>
          <div className="mt-14 flex flex-wrap gap-3">
            <Button asChild variant="accent" size="lg">
              <Link href="/enquire">
                Check eligibility & enquire <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/faculty">Meet our faculty</Link>
            </Button>
          </div>
        </section>
      ) : null}
    </>
  );
}
