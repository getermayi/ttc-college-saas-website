import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { requireCapability } from "@/lib/auth/session";
import { getResource } from "@/lib/admin/resources";
import { listRecords } from "@/lib/admin/resource-data";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ResourceList } from "@/components/admin/resource-list";
import { Button } from "@/components/ui/button";

export const instant = false;

export async function generateMetadata({ params }: PageProps<"/admin/content/[resource]">) {
  const { resource } = await params;
  return { title: getResource(resource)?.label ?? "Content" };
}

export default async function ResourceIndexPage({
  params,
  searchParams,
}: PageProps<"/admin/content/[resource]">) {
  await requireCapability("content");
  const { resource } = await params;
  const config = getResource(resource);
  if (!config) notFound();
  const sp = await searchParams;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  const { rows, total } = await listRecords(config, {
    q: str(sp.q),
    status: str(sp.status),
    group: str(sp.group),
  });
  return (
    <>
      <AdminPageHeader
        title={config.label}
        description={config.description}
        actions={
          config.canCreate !== false ? (
            <Button asChild>
              <Link href={`/admin/content/${config.key}/new`}>
                <Plus aria-hidden /> New {config.singular.toLowerCase()}
              </Link>
            </Button>
          ) : null
        }
      />
      <ResourceList
        key={rows.map((r) => `${r.id}${String(r.updatedAt ?? "")}`).join()}
        resourceKey={config.key}
        rows={rows}
        total={total}
      />
    </>
  );
}
