import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, getPublishedPageSlugs } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { atLeastOne } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/site/page-header";
import { RichText } from "@/components/site/rich-text";
import { Photo } from "@/components/site/photo";

// Pages with their own routes are not served here.
const RESERVED = new Set(["student-life"]);

// Await params at the top so unknown slugs return a real 404 status.
export const instant = false;

export async function generateStaticParams() {
  const pages = await getPublishedPageSlugs();
  return atLeastOne(
    pages.filter((p) => !RESERVED.has(p.slug)).map((p) => ({ slug: p.slug })),
    "slug",
  );
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = RESERVED.has(slug) ? null : await getPage(slug);
  if (!page) return { title: "Page not found", robots: { index: false } };
  return buildMetadata({
    path: `/${page.slug}`,
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.excerpt,
    ogImage: page.ogImage ?? page.heroImage,
    noindex: page.noindex,
  });
}

export default async function CustomPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const page = RESERVED.has(slug) ? null : await getPage(slug);
  if (!page) notFound();
  return (
    <>
      <PageHeader
        crumbs={[{ name: page.title, href: `/${page.slug}` }]}
        title={page.title}
        description={page.excerpt}
      />
      <div className="container-page pb-8">
        {page.heroImage ? (
          <Photo media={page.heroImage} priority className="mb-10 aspect-[21/9]" sizes="100vw" />
        ) : null}
        <RichText html={page.body} />
        <p className="text-muted-foreground mt-12 text-sm">
          Last updated {formatDate(page.updatedAt, { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
    </>
  );
}
