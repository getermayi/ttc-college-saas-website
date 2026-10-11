import type { Metadata } from "next";
import { Users } from "lucide-react";
import { getFaculty } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, PageHeader } from "@/components/site/page-header";
import { FacultyDirectory } from "@/components/site/faculty-directory";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/faculty", title: "Faculty & staff" });
}

export default async function FacultyPage() {
  const people = await getFaculty();
  const onlyLeadership = people.every((p) => p.type === "LEADERSHIP");
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Faculty & staff", href: "/faculty" }]}
        eyebrow="Our people"
        title="Faculty & staff"
        description="The teachers and staff who guide you through your training — experienced, approachable and invested in your growth."
      />
      <section className="container-page pb-8">
        {people.length ? <FacultyDirectory people={people} /> : null}
        {onlyLeadership ? (
          <EmptyState
            className="mt-10"
            icon={<Users />}
            title="Full faculty profiles are on their way"
            description="We are adding photos and qualifications for every member of our teaching and support staff."
          />
        ) : null}
      </section>
    </>
  );
}
