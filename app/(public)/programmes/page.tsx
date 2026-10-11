import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { getActiveProgrammes } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, PageHeader } from "@/components/site/page-header";
import { ProgrammeCard } from "@/components/home/home-sections";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/programmes", title: "Programmes" });
}

export default async function ProgrammesPage() {
  const programmes = await getActiveProgrammes();
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Programmes", href: "/programmes" }]}
        eyebrow="Programmes"
        title="Find the right programme for you"
        description="Clear information on duration, seats, eligibility and the documents you need — so you can plan with confidence."
      />
      <section className="container-page pb-8">
        {programmes.length ? (
          <div className="grid gap-5">
            {programmes.map((p, i) => (
              <ProgrammeCard key={p.id} p={p} featured={i === 0 || programmes.length === 1} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<GraduationCap />}
            title="Programme details are being updated"
            description="Please check back soon, or contact the college office."
          />
        )}
      </section>
    </>
  );
}
