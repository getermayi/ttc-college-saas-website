import type { Metadata } from "next";
import { getNotices } from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/site/page-header";
import { NoticeBoard } from "@/components/site/notice-board";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/notices", title: "Notices" });
}

export default async function NoticesPage() {
  const notices = await getNotices();
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Notices", href: "/notices" }]}
        eyebrow="Notice board"
        title="Notices"
        description="Admission, exam, academic and general updates. Pinned notices stay at the top."
      />
      <section className="container-page pb-8">
        <NoticeBoard notices={notices} />
      </section>
    </>
  );
}
