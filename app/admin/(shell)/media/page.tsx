import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { MediaLibrary } from "@/components/admin/media-library";

export const instant = false;
export const metadata = { title: "Media library" };

export default async function MediaPage({ searchParams }: PageProps<"/admin/media">) {
  await requireCapability("media");
  const sp = await searchParams;
  const kind = sp.kind === "IMAGE" || sp.kind === "DOCUMENT" ? sp.kind : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const items = await prisma.media.findMany({
    where: {
      ...(kind ? { kind } : {}),
      ...(q
        ? {
            OR: [
              { alt: { contains: q, mode: "insensitive" } },
              { filename: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  const tabs = [
    { label: "All", href: "/admin/media", active: !kind },
    { label: "Images", href: "/admin/media?kind=IMAGE", active: kind === "IMAGE" },
    { label: "Documents", href: "/admin/media?kind=DOCUMENT", active: kind === "DOCUMENT" },
  ];
  return (
    <>
      <AdminPageHeader
        title="Media library"
        description="Photos and PDFs used across the website. Alt text is required for every image — it helps blind visitors and search engines."
      />
      <div className="mb-4 flex gap-1.5">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium",
              t.active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <MediaLibrary items={items.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))} />
    </>
  );
}
