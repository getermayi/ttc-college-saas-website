import { notFound } from "next/navigation";
import { requireCapability } from "@/lib/auth/session";
import { getResource } from "@/lib/admin/resources";
import { loadFormData } from "@/lib/admin/resource-data";
import { toFormValues } from "@/lib/admin/fields";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ResourceForm } from "@/components/admin/resource-form";

export const instant = false;

export async function generateMetadata({ params }: PageProps<"/admin/content/[resource]/[id]">) {
  const { resource, id } = await params;
  const c = getResource(resource);
  return { title: c ? `${id === "new" ? "New" : "Edit"} ${c.singular.toLowerCase()}` : "Edit" };
}

export default async function ResourceEditPage({ params }: PageProps<"/admin/content/[resource]/[id]">) {
  await requireCapability("content");
  const { resource, id: rawId } = await params;
  const config = getResource(resource);
  if (!config) notFound();
  const id = rawId === "new" ? null : rawId;
  if (!id && config.canCreate === false) notFound();
  const data = await loadFormData(config, id);
  if (id && !data.record) notFound();
  const initial = toFormValues(config.fields, data.record ?? { ...config.defaults });
  const title = data.record ? String(data.record[config.titleField] ?? config.singular) : `New ${config.singular.toLowerCase()}`;
  const status = config.status ? String(data.record?.[config.status.field] ?? config.defaults?.[config.status.field] ?? config.status.draft) : null;
  return (
    <>
      <AdminPageHeader
        back={{ href: `/admin/content/${config.key}`, label: config.label }}
        title={title}
        description={data.record && config.subtitleField ? String(data.record[config.subtitleField] ?? "") : config.description}
      />
      <ResourceForm
        key={`${id ?? "new"}-${String(data.record?.updatedAt ?? "")}`}
        resourceKey={config.key}
        id={id}
        initialValues={initial}
        status={id ? status : null}
        media={data.media}
        relations={data.relations}
        versions={data.versions}
        publicUrl={data.record ? (config.publicPath?.(data.record) ?? null) : null}
        updatedAt={data.record?.updatedAt ? String(data.record.updatedAt) : null}
      />
    </>
  );
}
