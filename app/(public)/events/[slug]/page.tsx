import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { getEvent, getEvents, getSettings } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { eventJsonLd } from "@/lib/structured-data";
import { formatDate, truncate } from "@/lib/utils";
import { Breadcrumbs } from "@/components/site/page-header";
import { Photo } from "@/components/site/photo";
import { RichText } from "@/components/site/rich-text";
import { JsonLd } from "@/components/site/json-ld";
import { LightboxGallery } from "@/components/site/lightbox";

// Await params at the top so unknown slugs return a real 404 status.
export const instant = false;

export async function generateStaticParams() {
  const events = await getEvents();
  return events.slice(0, 30).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const e = await getEvent(slug);
  if (!e) return { title: "Event not found", robots: { index: false } };
  return buildMetadata({ path: `/events/${e.slug}`, title: e.seoTitle || e.title, description: e.seoDescription || truncate(e.summary), ogImage: e.ogImage ?? e.cover, noindex: e.noindex, type: "article" });
}

export default async function EventPage({ params }: PageProps<"/events/[slug]">) {
  const { slug } = await params;
  const [e, settings] = await Promise.all([getEvent(slug), getSettings()]);
  if (!e) notFound();
  return (
    <article className="container-page max-w-4xl pb-8 pt-6 md:pt-10">
      <Breadcrumbs items={[{ name: "Events", href: "/events" }, { name: truncate(e.title, 40), href: `/events/${e.slug}` }]} />
      <h1 className="mt-8 text-h1 font-semibold">{e.title}</h1>
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="size-5 text-accent" aria-hidden />
          <time dateTime={e.startsAt.toISOString()}>{formatDate(e.startsAt, { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" })}</time>
          {e.endsAt ? <> – {formatDate(e.endsAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</> : null}
        </span>
        {e.location ? (
          <span className="inline-flex items-center gap-2">
            <MapPin className="size-5 text-accent" aria-hidden /> {e.location}
          </span>
        ) : null}
      </div>
      <Photo media={e.cover} label={e.cover ? undefined : e.title} priority className="mt-8 aspect-[16/9]" sizes="(min-width: 1024px) 900px, 100vw" />
      <p className="mt-8 text-lead text-muted-foreground">{e.summary}</p>
      <RichText html={e.body} className="mt-6" />
      {e.albumImages.length ? (
        <section className="mt-12" aria-labelledby="photos-h">
          <h2 id="photos-h" className="text-h3 font-semibold">Photos</h2>
          <LightboxGallery className="mt-5" title={e.title} images={e.albumImages.map((i) => ({ media: i.media, caption: i.caption }))} />
        </section>
      ) : null}
      <Link href="/events" className="mt-12 inline-flex items-center gap-2 font-semibold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> All events
      </Link>
      <JsonLd data={eventJsonLd(e, settings)} />
    </article>
  );
}
