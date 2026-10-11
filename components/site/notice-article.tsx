import Link from "next/link";
import { ArrowLeft, Download, ExternalLink, FileText, Pin } from "lucide-react";
import { NOTICE_CATEGORY_LABELS, type NoticeCategoryValue } from "@/lib/constants";
import type { MediaLite } from "@/lib/content-types";
import { formatDate, truncate } from "@/lib/utils";
import { Breadcrumbs } from "@/components/site/page-header";
import { RichText } from "@/components/site/rich-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type NoticeArticleData = {
  title: string;
  slug: string;
  category: NoticeCategoryValue;
  pinned: boolean;
  publishedAt: Date;
  summary: string | null;
  body: string;
  externalLink: string | null;
  attachment: MediaLite | null;
};

export function NoticeArticle({ notice: n }: { notice: NoticeArticleData }) {
  return (
    <article className="container-page max-w-3xl pt-6 pb-8 md:pt-10">
      <Breadcrumbs
        items={[
          { name: "Notices", href: "/notices" },
          { name: truncate(n.title, 40), href: `/notices/${n.slug}` },
        ]}
      />
      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">{NOTICE_CATEGORY_LABELS[n.category]}</Badge>
          {n.pinned ? (
            <Badge tone="accent">
              <Pin aria-hidden /> Pinned
            </Badge>
          ) : null}
          <time dateTime={n.publishedAt.toISOString()} className="text-muted-foreground text-sm">
            {formatDate(n.publishedAt, { day: "numeric", month: "long", year: "numeric" })}
          </time>
        </div>
        <h1 className="text-h1 mt-4 font-semibold">{n.title}</h1>
        {n.summary ? <p className="text-lead text-muted-foreground mt-4">{n.summary}</p> : null}
      </header>
      <RichText html={n.body} className="mt-8" />
      {n.attachment || n.externalLink ? (
        <div className="border-border bg-surface mt-10 flex flex-col gap-3 rounded-3xl border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <FileText className="text-danger size-6" aria-hidden />
            <span className="font-semibold">{n.attachment ? n.attachment.filename : "Related link"}</span>
          </div>
          <div className="flex gap-2">
            {n.attachment ? (
              <Button asChild>
                <a href={n.attachment.url} target="_blank" rel="noopener noreferrer">
                  <Download aria-hidden /> Download PDF
                </a>
              </Button>
            ) : null}
            {n.externalLink ? (
              <Button asChild variant="outline">
                <a href={n.externalLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden /> Open link
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      <Link
        href="/notices"
        className="text-primary mt-10 inline-flex items-center gap-2 font-semibold hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden /> All notices
      </Link>
    </article>
  );
}
