import type { Metadata } from "next";
import { Check, Trees } from "lucide-react";
import { getFacilities, getSettings } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { EmptyState, PageHeader } from "@/components/site/page-header";
import { Photo } from "@/components/site/photo";
import { RichText } from "@/components/site/rich-text";
import { LightboxGallery } from "@/components/site/lightbox";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/campus", title: "Campus & facilities" });
}

export default async function CampusPage() {
  const [facilities, settings] = await Promise.all([getFacilities(), getSettings()]);
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Campus & facilities", href: "/campus" }]}
        eyebrow="Campus & facilities"
        title={settings.campusAcres ? `${settings.campusAcres} green acres to learn and grow` : "Our campus"}
        description={`Our campus at ${settings.addressLine}, ${settings.district} is a calm place to study, practise and make friends.`}
      />
      <div className="container-page space-y-20 pb-8">
        {facilities.length ? (
          <nav aria-label="Facilities on this page" className="-mt-4 flex flex-wrap gap-2">
            {facilities.map((f) => (
              <a key={f.id} href={`#${f.slug}`} className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-primary/50">
                {f.name}
              </a>
            ))}
          </nav>
        ) : (
          <EmptyState icon={<Trees />} title="Facility details are being updated" description="Photos and details of our classrooms, library and other spaces will appear here soon." />
        )}
        {facilities.map((f, i) => (
          <section key={f.id} id={f.slug} className="scroll-mt-28" aria-labelledby={`${f.slug}-h`}>
            <div className={cn("grid items-center gap-8 lg:grid-cols-2 lg:gap-14", i % 2 === 1 && "lg:[&>*:first-child]:order-2")}>
              <Photo media={f.cover} label={f.cover ? undefined : f.name} className="aspect-[4/3]" variant={i} />
              <div>
                <Badge tone="primary">{f.category}</Badge>
                <h2 id={`${f.slug}-h`} className="mt-3 text-h2 font-semibold">
                  {f.name}
                </h2>
                <p className="mt-3 text-lead text-muted-foreground">{f.summary}</p>
                <RichText html={f.description} className="mt-4" />
                {f.highlights.length ? (
                  <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                    {f.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-sm font-medium">
                        <span className="grid size-5 place-items-center rounded-full bg-success-soft text-success-soft-foreground">
                          <Check className="size-3" aria-hidden />
                        </span>
                        {h}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
            {f.images.length ? <LightboxGallery className="mt-8" title={f.name} images={f.images.map((img) => ({ media: img.media, caption: img.caption }))} /> : null}
          </section>
        ))}
      </div>
    </>
  );
}
