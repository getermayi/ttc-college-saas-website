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
  const [sections, settings, programmes] = await Promise.all([getSections("admissions"), getSettings(), getActiveProgrammes()]);
  const docs = sectionByKey(sections, "admissions.documents");
  return (
    <div className="container-page max-w-3xl pb-10 pt-6 md:pt-10">
      <Breadcrumbs className="no-print" items={[{ name: "Admissions", href: "/admissions" }, { name: "Checklist", href: "/admissions/checklist" }]} />
      <div className="mt-8 rounded-3xl border border-border bg-surface p-6 print:border-0 print:p-0 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">{settings.siteName}</p>
        <h1 className="mt-2 text-h2 font-semibold">Admission document checklist {settings.admissionsSession}</h1>
        <p className="mt-3 text-muted-foreground">{docs?.subtitle}</p>
        <div className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
          <p className="border-b border-dashed border-border-strong pb-1">Name: </p>
          <p className="border-b border-dashed border-border-strong pb-1">Programme: {programmes.length === 1 ? programmes[0].shortName : ""}</p>
        </div>
        <ul className="mt-8 space-y-4">
          {docs?.items.map((d, i) => (
            <li key={i} className="flex gap-4">
              <span className="mt-0.5 size-6 shrink-0 rounded-md border-2 border-foreground/60" aria-hidden />
              <span>
                <span className="font-semibold">{d.title}</span>
                {d.description ? <span className="block text-sm text-muted-foreground">{d.description}</span> : null}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-muted-foreground">
          {settings.addressLine}, {settings.district}, {settings.state} – {settings.postalCode}
          {settings.phone ? ` · ${settings.phone}` : ""}
        </p>
        <PrintButton className="no-print mt-8" />
      </div>
    </div>
  );
}
