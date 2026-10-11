import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNotice, getNotices } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { stripHtml, truncate } from "@/lib/utils";
import { NoticeArticle } from "@/components/site/notice-article";

// Await params at the top so unknown slugs return a real 404 status.
export const instant = false;

export async function generateStaticParams() {
  const notices = await getNotices();
  return notices.slice(0, 50).map((n) => ({ slug: n.slug }));
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
