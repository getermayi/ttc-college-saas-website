import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNotice, getNotices } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { atLeastOne } from "@/lib/utils";
import { stripHtml, truncate } from "@/lib/utils";
import { NoticeArticle } from "@/components/site/notice-article";

// Unknown slugs wait for a full static render, so they return a real 404 status
// (and newly published content is generated on first visit, then cached).
export const ensureStatic = "navigation";
export const instant = false;

export async function generateStaticParams() {
  const notices = await getNotices();
  return atLeastOne(
    notices.slice(0, 50).map((n) => ({ slug: n.slug })),
    "slug",
  );
}

export async function generateMetadata({ params }: PageProps<"/notices/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const n = await getNotice(slug);
  if (!n) return { title: "Notice not found", robots: { index: false } };
  return buildMetadata({
    path: `/notices/${n.slug}`,
    title: n.seoTitle || n.title,
    description: n.seoDescription || n.summary || truncate(stripHtml(n.body)),
    ogImage: n.ogImage,
    noindex: n.noindex,
    type: "article",
  });
}

export default async function NoticePage({ params }: PageProps<"/notices/[slug]">) {
  const { slug } = await params;
  const n = await getNotice(slug);
  if (!n) notFound();
  return <NoticeArticle notice={n} />;
}
