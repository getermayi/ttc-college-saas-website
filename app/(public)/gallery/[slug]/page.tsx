import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAlbum, getAlbums } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/site/page-header";
import { LightboxGallery } from "@/components/site/lightbox";

// Await params at the top so unknown slugs return a real 404 status.
export const instant = false;

export async function generateStaticParams() {
  const albums = await getAlbums();
  return albums.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/gallery/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAlbum(slug);
  if (!a) return { title: "Album not found", robots: { index: false } };
  return buildMetadata({ path: `/gallery/${a.slug}`, title: a.title, description: a.description, ogImage: a.cover ?? a.images[0]?.media });
}

export default async function AlbumPage({ params }: PageProps<"/gallery/[slug]">) {
  const { slug } = await params;
  const a = await getAlbum(slug);
  if (!a) notFound();
  return (
    <>
      <PageHeader crumbs={[{ name: "Gallery", href: "/gallery" }, { name: a.title, href: `/gallery/${a.slug}` }]} eyebrow={a.category} title={a.title} description={a.description} />
      <section className="container-page pb-8">
        {a.images.length ? <LightboxGallery title={a.title} images={a.images.map((i) => ({ media: i.media, caption: i.caption }))} /> : <p className="text-muted-foreground">Photos will be added soon.</p>}
      </section>
    </>
  );
}
