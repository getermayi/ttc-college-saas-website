import type { Metadata } from "next";
import { getActiveProgrammes, getSections, getSettings, sectionByKey } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/page-header";
import { PrintButton } from "@/components/site/print-button";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/admissions/checklist",
    title: "Printable document checklist",
    description: "Tick off each document before you visit the college for admission.",
  });
}

export default async function ChecklistPage() {
  const [sections, settings, programmes] = await Promise.all([
    getSections("admissions"),
    getSettings(),
    getActiveProgrammes(),
  ]);
  const docs = sectionByKey(sections, "admissions.documents");
  return (
    <div className="container-page max-w-3xl pt-6 pb-10 md:pt-10">
      <Breadcrumbs
        className="no-print"
        items={[
          { name: "Admissions", href: "/admissions" },
          { name: "Checklist", href: "/admissions/checklist" },
        ]}
      />
      <div className="border-border bg-surface mt-8 rounded-3xl border p-6 md:p-10 print:border-0 print:p-0">
        <p className="text-accent text-sm font-semibold tracking-widest uppercase">{settings.siteName}</p>
        <h1 className="text-h2 mt-2 font-semibold">
          Admission document checklist {settings.admissionsSession}
        </h1>
        <p className="text-muted-foreground mt-3">{docs?.subtitle}</p>
        <div className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
          <p className="border-border-strong border-b border-dashed pb-1">Name: </p>
          <p className="border-border-strong border-b border-dashed pb-1">
            Programme: {programmes.length === 1 ? programmes[0].shortName : ""}
          </p>
        </div>
        <ul className="mt-8 space-y-4">
          {docs?.items.map((d, i) => (
            <li key={i} className="flex gap-4">
              <span className="border-foreground/60 mt-0.5 size-6 shrink-0 rounded-md border-2" aria-hidden />
              <span>
                <span className="font-semibold">{d.title}</span>
                {d.description ? (
                  <span className="text-muted-foreground block text-sm">{d.description}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground mt-10 text-sm">
          {settings.addressLine}, {settings.district}, {settings.state} – {settings.postalCode}
          {settings.phone ? ` · ${settings.phone}` : ""}
        </p>
        <PrintButton className="no-print mt-8" />
      </div>
    </div>
  );
}
