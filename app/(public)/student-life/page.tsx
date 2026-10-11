import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";
import { getAlbums, getEventsSplit, getPage, getTestimonials } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { PageHeader, SectionHeading } from "@/components/site/page-header";
import { RichText } from "@/components/site/rich-text";
import { Photo } from "@/components/site/photo";
import { EventCard } from "@/components/site/event-card";
import { LightboxGallery } from "@/components/site/lightbox";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("student-life");
  return buildMetadata({
    path: "/student-life",
    title: page?.seoTitle || "Student life",
    description: page?.seoDescription || page?.excerpt,
    ogImage: page?.ogImage ?? page?.heroImage,
  });
}

export default async function StudentLifePage() {
  const [page, testimonials, albums, events] = await Promise.all([
    getPage("student-life"),
    getTestimonials(),
    getAlbums(),
    getEventsSplit(),
  ]);
  const photos = albums.flatMap((a) => a.images).slice(0, 9);
  const recent = [...events.upcoming, ...events.past].slice(0, 3);
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Student life", href: "/student-life" }]}
        eyebrow="Student life"
        title={page?.title ?? "Student life"}
        description={page?.excerpt}
      />
      <section className="container-page grid gap-10 pb-16 lg:grid-cols-2 lg:items-center">
        <RichText html={page?.body} />
        <Photo
          media={page?.heroImage}
          label={page?.heroImage ? undefined : "Students on campus"}
          className="aspect-[4/3]"
          variant={1}
        />
      </section>

      {testimonials.length ? (
        <section className="bg-surface-2/60" aria-labelledby="voices-h">
          <div className="container-page section-y">
            <SectionHeading id="voices-h" eyebrow="Student voices" title="In their own words" />
            <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t, i) => (
                <li key={t.id}>
                  <figure className="border-border bg-surface flex h-full flex-col rounded-3xl border p-7">
                    <Quote className="text-accent size-7" aria-hidden />
                    <blockquote className="font-display mt-4 flex-1 text-lg leading-snug">
                      “{t.quote}”
                    </blockquote>
                    <figcaption className="border-border mt-6 flex items-center gap-3 border-t pt-5">
                      <Photo
                        media={t.photo}
                        rounded="rounded-full"
                        className="size-12 shrink-0"
                        sizes="48px"
                        variant={i}
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
          </div>
        </section>
      ) : null}

      {photos.length ? (
        <section className="container-page section-y" aria-labelledby="photos-h">
          <SectionHeading
            id="photos-h"
            eyebrow="Snapshots"
            title="Life on campus"
            action={
              <Button asChild variant="outline">
                <Link href="/gallery">
                  Full gallery <ArrowRight aria-hidden />
                </Link>
              </Button>
            }
          />
          <LightboxGallery
            className="mt-10"
            title="Life on campus"
            images={photos.map((p) => ({ media: p.media, caption: p.caption }))}
          />
        </section>
      ) : null}

      {recent.length ? (
        <section className="container-page pb-8" aria-labelledby="events-h">
          <SectionHeading id="events-h" eyebrow="Events" title="Workshops & celebrations" />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((e, i) => (
              <li key={e.id}>
                <EventCard event={e} index={i} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
