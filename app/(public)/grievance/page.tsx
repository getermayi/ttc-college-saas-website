import type { Metadata } from "next";
import { Lock, Scale, Timer } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/site/page-header";
import { GrievanceForm } from "@/components/site/grievance-form";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/grievance", title: "Submit a grievance" });
}

export default function GrievancePage() {
  const points = [
    { icon: Lock, title: "Confidential", text: "Only the grievance committee sees your details. You can also stay anonymous." },
    { icon: Timer, title: "Tracked", text: "You get a ticket number, and every grievance is logged and reviewed." },
    { icon: Scale, title: "Fair", text: "Concerns about ragging, harassment or unfair treatment are taken seriously." },
  ];
  return (
    <>
      <PageHeader crumbs={[{ name: "Grievance", href: "/grievance" }]} eyebrow="Grievance redressal" title="Tell us what's wrong" description="If something isn't right — in class, on campus, or with admissions — let us know. We will listen." />
      <div className="container-page grid gap-10 pb-8 lg:grid-cols-12">
        <aside className="space-y-4 lg:col-span-4">
          {points.map((p) => (
            <div key={p.title} className="flex gap-4 rounded-3xl border border-border bg-surface p-5">
              <p.icon className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden />
              <div>
                <h2 className="font-sans font-semibold">{p.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
              </div>
            </div>
          ))}
          <p className="rounded-3xl bg-danger-soft p-5 text-sm text-danger-soft-foreground">
            <strong>In an emergency</strong>, or if you feel unsafe, call the national emergency number <a href="tel:112" className="font-semibold underline">112</a>. For ragging, you can also call the UGC anti-ragging helpline <a href="tel:18001805522" className="font-semibold underline">1800-180-5522</a>.
          </p>
        </aside>
        <div className="rounded-[2rem] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] sm:p-8 lg:col-span-8">
          <GrievanceForm />
        </div>
      </div>
    </>
  );
}
