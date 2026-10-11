import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { EventItem } from "@/lib/data/public";
import { formatDate } from "@/lib/utils";
import { Photo } from "./photo";

export function EventCard({ event: e, index = 0 }: { event: EventItem; index?: number }) {
  return (
    <article className="group border-border bg-surface relative flex flex-col overflow-hidden rounded-3xl border shadow-[var(--shadow-soft)] transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <div className="relative">
        <Photo
          media={e.cover}
          label={e.cover ? undefined : "Event"}
          rounded="rounded-none"
          className="aspect-[16/10]"
          variant={index}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
        <time
          dateTime={e.startsAt.toISOString()}
          className="bg-surface/95 absolute top-4 left-4 rounded-2xl px-3 py-2 text-center shadow-[var(--shadow-soft)]"
        >
          <span className="font-display block text-2xl leading-none font-semibold">
            {formatDate(e.startsAt, { day: "numeric" })}
          </span>
          <span className="text-muted-foreground text-[0.7rem] font-semibold tracking-wider uppercase">
            {formatDate(e.startsAt, { month: "short", year: "2-digit" })}
          </span>
        </time>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-sans text-lg leading-snug font-semibold">
          <Link href={`/events/${e.slug}`} className="group-hover:text-primary after:absolute after:inset-0">
            {e.title}
          </Link>
        </h3>
        <p className="text-muted-foreground mt-2 line-clamp-3 text-sm">{e.summary}</p>
        <div className="text-muted-foreground mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden />
            {formatDate(e.startsAt, {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
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
