import type { Metadata } from "next";
import Link from "next/link";
import { Images } from "lucide-react";
import { getAlbums } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { pluralise } from "@/lib/utils";
import { EmptyState, PageHeader } from "@/components/site/page-header";
import { Photo } from "@/components/site/photo";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/gallery", title: "Gallery" });
}

export default async function GalleryPage() {
  const albums = await getAlbums();
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Gallery", href: "/gallery" }]}
        eyebrow="Gallery"
        title="Moments from campus"
        description="Classrooms, teaching practice, celebrations and everyday life at TTC Aalo."
      />
      <section className="container-page pb-8">
        {albums.length ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((a, i) => (
              <li key={a.id}>
                <Link href={`/gallery/${a.slug}`} className="group block">
                  <div className="relative">
                    <Photo
                      media={a.cover ?? a.images[0]?.media}
                      label={a.cover || a.images[0] ? undefined : a.title}
                      className="aspect-[4/3] transition-transform duration-500 group-hover:scale-[1.01]"
                      variant={i}
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                    <span className="absolute right-3 bottom-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      {pluralise(a.images.length, "photo")}
                    </span>
                  </div>
                  <p className="text-accent mt-3 text-xs font-semibold tracking-wider uppercase">
                    {a.category}
                  </p>
                  <h2 className="group-hover:text-primary mt-1 font-sans text-lg font-semibold">{a.title}</h2>
                  {a.description ? (
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{a.description}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<Images />}
            title="Photos are coming soon"
            description="We're putting together albums from campus life, teaching practice and events."
          />
        )}
      </section>
    </>
  );
}
