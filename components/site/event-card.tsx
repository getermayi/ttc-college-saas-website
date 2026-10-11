import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { EventItem } from "@/lib/data/public";
import { formatDate } from "@/lib/utils";
import { Photo } from "./photo";

export function EventCard({ event: e, index = 0 }: { event: EventItem; index?: number }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow-soft)] transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <div className="relative">
        <Photo media={e.cover} label={e.cover ? undefined : "Event"} rounded="rounded-none" className="aspect-[16/10]" variant={index} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
        <time dateTime={e.startsAt.toISOString()} className="absolute left-4 top-4 rounded-2xl bg-surface/95 px-3 py-2 text-center shadow-[var(--shadow-soft)]">
          <span className="block font-display text-2xl font-semibold leading-none">{formatDate(e.startsAt, { day: "numeric" })}</span>
          <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">{formatDate(e.startsAt, { month: "short", year: "2-digit" })}</span>
        </time>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-sans text-lg font-semibold leading-snug">
          <Link href={`/events/${e.slug}`} className="after:absolute after:inset-0 group-hover:text-primary">
            {e.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{e.summary}</p>
        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden />
            {formatDate(e.startsAt, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
          </span>
          {e.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden />
              {e.location}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
