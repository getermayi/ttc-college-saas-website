import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { getEventsSplit } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, PageHeader } from "@/components/site/page-header";
import { EventCard } from "@/components/site/event-card";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/events", title: "Events" });
}

export default async function EventsPage() {
  const { upcoming, past } = await getEventsSplit();
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Events", href: "/events" }]}
        eyebrow="Events"
        title="Workshops, seminars & celebrations"
        description="Learning doesn't stop at the classroom door. See what's coming up and what we've done together."
      />
      <div className="container-page space-y-16 pb-8">
        <section aria-labelledby="upcoming-h">
          <h2 id="upcoming-h" className="text-h2 font-semibold">
            Upcoming
          </h2>
          {upcoming.length ? (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e, i) => (
                <li key={e.id}>
                  <EventCard event={e} index={i} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              className="mt-8"
              icon={<CalendarDays />}
              title="No upcoming events right now"
              description="New workshops and events will be listed here. Check the Notices page for the latest updates."
            />
          )}
        </section>
        {past.length ? (
          <section aria-labelledby="past-h">
            <h2 id="past-h" className="text-h2 font-semibold">
              Past events
            </h2>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((e, i) => (
                <li key={e.id}>
                  <EventCard event={e} index={i + 1} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
