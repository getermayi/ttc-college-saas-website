"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileText, Pin, Search } from "lucide-react";
import type { NoticeListItem } from "@/lib/data/public";
import { NOTICE_CATEGORIES, NOTICE_CATEGORY_LABELS, type NoticeCategoryValue } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { NewBadge } from "./new-badge";

export function NoticeBoard({ notices }: { notices: NoticeListItem[] }) {
  const [category, setCategory] = useState<NoticeCategoryValue | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notices.filter(
      (n) => (category === "ALL" || n.category === category) && (!q || n.title.toLowerCase().includes(q) || n.summary?.toLowerCase().includes(q)),
    );
  }, [notices, category, query]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: notices.length };
    for (const n of notices) c[n.category] = (c[n.category] ?? 0) + 1;
    return c;
  }, [notices]);

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="Filter by category" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {(["ALL", ...NOTICE_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
                category === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary/50",
              )}
            >
              {c === "ALL" ? "All" : NOTICE_CATEGORY_LABELS[c]}
              <span className={cn("rounded-full px-1.5 text-xs", category === c ? "bg-white/20" : "bg-surface-2")}>{counts[c] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <label htmlFor="notice-search" className="sr-only">
            Search notices
          </label>
          <Input id="notice-search" type="search" placeholder="Search notices" value={query} onChange={(e) => setQuery(e.target.value)} className="h-11 pl-10" />
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {filtered.length} notices shown
      </p>

      {filtered.length ? (
        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-surface">
          {filtered.map((n) => (
            <li key={n.id} className={cn(n.pinned && "bg-accent-soft/40")}>
              <Link href={`/notices/${n.slug}`} className="group flex gap-4 p-5 transition-colors hover:bg-surface-2/60 md:items-center md:p-6">
                <time dateTime={n.publishedAt.toISOString()} className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-surface-2 py-2 text-center">
                  <span className="font-display text-xl font-semibold leading-none">{formatDate(n.publishedAt, { day: "numeric" })}</span>
                  <span className="mt-1 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">{formatDate(n.publishedAt, { month: "short" })}</span>
                  <span className="text-[0.65rem] text-muted-foreground">{formatDate(n.publishedAt, { year: "numeric" })}</span>
                </time>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-primary-soft-foreground">{NOTICE_CATEGORY_LABELS[n.category]}</span>
                    {n.pinned ? (
                      <span className="inline-flex items-center gap-1 text-accent">
                        <Pin className="size-3" aria-hidden /> Pinned
                      </span>
                    ) : null}
                    <NewBadge date={n.publishedAt.toISOString()} />
                    {n.attachment ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <FileText className="size-3" aria-hidden /> PDF
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-[1.05rem] font-semibold leading-snug group-hover:text-primary">{n.title}</p>
                  {n.summary ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{n.summary}</p> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-3xl border border-dashed border-border-strong p-10 text-center text-muted-foreground">
          {notices.length ? "No notices match your filter." : "There are no notices right now. Please check back soon."}
        </p>
      )}
    </div>
  );
}
