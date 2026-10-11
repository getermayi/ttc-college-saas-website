import type { Metadata } from "next";
import Link from "next/link";
import { FileClock, ShieldAlert } from "lucide-react";
import { getDownloads, getSettings } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { DISCLOSURE_CATEGORIES, DOWNLOAD_CATEGORY_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/site/page-header";
import { FileLink } from "@/components/site/file-link";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/disclosures", title: "Mandatory disclosures" });
}

const DESCRIPTIONS: Partial<Record<(typeof DISCLOSURE_CATEGORIES)[number], string>> = {
  NCTE_RECOGNITION: "Recognition orders from the National Council for Teacher Education.",
  RGU_AFFILIATION: "Affiliation letters from Rajiv Gandhi University.",
  MANDATORY_DISCLOSURE: "Information the college is required to publish under NCTE regulations.",
  RTI: "Right to Information officers and how to file a request.",
  GRIEVANCE_REDRESSAL: "Grievance redressal committee and process.",
  ANTI_RAGGING: "Anti-ragging committee, squad and undertaking.",
  ADMISSION_COMMITTEE: "Members of the admission committee.",
  IQAC: "Internal Quality Assurance Cell reports and minutes.",
};

export default async function DisclosuresPage() {
  const [downloads, settings] = await Promise.all([getDownloads(), getSettings()]);
  const groups = DISCLOSURE_CATEGORIES.map((c) => ({ category: c, items: downloads.filter((d) => d.category === c) }));
  const visible = groups.filter((g) => g.items.length || g.category !== "OTHER");
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Mandatory disclosures", href: "/disclosures" }]}
        eyebrow="Transparency"
        title="Mandatory disclosures"
        description={`Official documents for students, parents, the university and NCTE. ${settings.recognition}. ${settings.affiliation}.`}
      />
      <div className="container-page grid gap-10 pb-8 lg:grid-cols-12">
        <nav aria-label="Disclosure sections" className="hidden lg:col-span-3 lg:block">
          <ul className="sticky top-28 space-y-1">
            {visible.map((g) => (
              <li key={g.category}>
                <a href={`#${g.category.toLowerCase()}`} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-surface-2">
                  {DOWNLOAD_CATEGORY_LABELS[g.category]}
                  <span className="text-xs text-muted-foreground">{g.items.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-10 lg:col-span-9">
          <div className="flex items-start gap-3 rounded-2xl border border-info/25 bg-info-soft p-4 text-sm text-info-soft-foreground">
            <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p>
              Need to raise a concern? Use our{" "}
              <Link href="/grievance" className="font-semibold underline underline-offset-2">
                grievance form
              </Link>
              . Every grievance gets a ticket number and is reviewed by the committee.
            </p>
          </div>
          {visible.map((g) => (
            <section key={g.category} id={g.category.toLowerCase()} className="scroll-mt-28" aria-labelledby={`${g.category}-h`}>
              <h2 id={`${g.category}-h`} className="text-h3 font-semibold">
                {DOWNLOAD_CATEGORY_LABELS[g.category]}
              </h2>
              {DESCRIPTIONS[g.category] ? <p className="mt-1 text-sm text-muted-foreground">{DESCRIPTIONS[g.category]}</p> : null}
              {g.items.length ? (
                <ul className="mt-4 space-y-3">
                  {g.items.map((d) => (
                    <li key={d.id}>
                      <FileLink download={d} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-border-strong p-4 text-sm text-muted-foreground">
                  <FileClock className="size-5 shrink-0" aria-hidden />
                  Documents for this section will be published here.
                </p>
              )}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
