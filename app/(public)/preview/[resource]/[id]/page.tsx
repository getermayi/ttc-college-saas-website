import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Eye } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth/session";
import { mediaSelect } from "@/lib/data/public";
import { NoticeArticle } from "@/components/site/notice-article";
import { PageHeader } from "@/components/site/page-header";
import { RichText } from "@/components/site/rich-text";
import { Photo } from "@/components/site/photo";
import { formatDate } from "@/lib/utils";

export const instant = false;
export const metadata = { title: "Preview", robots: { index: false, follow: false } };

async function PreviewContent({ params }: { params: Promise<{ resource: string; id: string }> }) {
  await requireCapability("content");
  const { resource, id } = await params;
  let body: React.ReactNode = null;

  if (resource === "notices") {
    const n = await prisma.notice.findUnique({
      where: { id },
      include: { attachment: { select: mediaSelect } },
    });
    if (!n) notFound();
    body = <NoticeArticle notice={n} />;
  } else if (resource === "pages") {
    const p = await prisma.page.findUnique({
      where: { id },
      include: { heroImage: { select: mediaSelect } },
    });
    if (!p) notFound();
    body = (
      <>
        <PageHeader
          crumbs={[{ name: p.title, href: `/${p.slug}` }]}
          title={p.title}
          description={p.excerpt}
        />
        <div className="container-page pb-8">
          {p.heroImage ? <Photo media={p.heroImage} className="mb-10 aspect-[21/9]" /> : null}
          <RichText html={p.body} />
        </div>
      </>
    );
  } else if (resource === "events") {
    const e = await prisma.event.findUnique({ where: { id }, include: { cover: { select: mediaSelect } } });
    if (!e) notFound();
    body = (
      <article className="container-page max-w-4xl pt-10 pb-8">
        <h1 className="text-h1 font-semibold">{e.title}</h1>
        <p className="text-muted-foreground mt-3">
          {formatDate(e.startsAt, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
          {e.location ? ` · ${e.location}` : ""}
        </p>
        <Photo media={e.cover} label={e.cover ? undefined : e.title} className="mt-8 aspect-[16/9]" />
        <p className="text-lead text-muted-foreground mt-8">{e.summary}</p>
        <RichText html={e.body} className="mt-6" />
      </article>
    );
  } else if (resource === "programmes") {
    const p = await prisma.programme.findUnique({ where: { id } });
    if (!p) notFound();
    body = (
      <>
        <PageHeader
          crumbs={[
            { name: "Programmes", href: "/programmes" },
            { name: p.shortName, href: `/programmes/${p.slug}` },
          ]}
          eyebrow={p.level}
          title={p.name}
          description={p.summary}
        />
        <div className="container-page pb-8">
          <RichText html={p.overview} />
        </div>
      </>
    );
  } else notFound();

  return (
    <>
      <div className="bg-warning sticky top-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-black">
        <Eye className="size-4" aria-hidden /> Preview — this is how it will look. Drafts are not visible to
        the public.
      </div>
      {body}
    </>
  );
}

export default function PreviewPage({ params }: PageProps<"/preview/[resource]/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="container-page text-muted-foreground py-20 text-center">Loading preview…</div>
      }
    >
      <PreviewContent params={params} />
    </Suspense>
  );
}
