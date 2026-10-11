"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Copy, ExternalLink, Eye, History, Loader2, RotateCcw, Save, Send, Trash2, Undo2 } from "lucide-react";
import { buildSchema, type FormValues } from "@/lib/admin/fields";
import { getResource } from "@/lib/admin/resources";
import { deleteRecords, duplicateRecord, restoreVersion, saveRecord } from "@/lib/admin/resource-actions";
import type { MediaLite } from "@/lib/content-types";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { FieldRenderer, type RelationOptions } from "./fields/field-renderer";
import { MediaProvider } from "./fields/media-context";

export type VersionInfo = { id: string; createdAt: string; note: string | null; user: string | null };

export function ResourceForm({
  resourceKey,
  id,
  initialValues,
  status,
  media,
  relations,
  versions,
  publicUrl,
  updatedAt,
}: {
  resourceKey: string;
  id: string | null;
  initialValues: FormValues;
  status: string | null;
  media: MediaLite[];
  relations: RelationOptions;
  versions: VersionInfo[];
  publicUrl: string | null;
  updatedAt: string | null;
}) {
  const config = getResource(resourceKey)!;
  const router = useRouter();
  const [pending, start] = useTransition();
  const schema = useMemo(() => buildSchema(config.fields), [config.fields]);
  const form = useForm<FormValues>({ resolver: zodResolver(schema as never) as never, defaultValues: initialValues, mode: "onTouched" });
  const { handleSubmit, formState, setError, reset } = form;
  const statusInFields = config.status && config.fields.some((f) => f.name === config.status!.field);
  const isPublished = config.status ? status === config.status.published : true;

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      if (formState.isDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [formState.isDirty]);

  // Ctrl/Cmd + S saves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const submit = (nextStatus?: string) =>
    handleSubmit(
      (values) =>
        start(async () => {
          const res = await saveRecord(resourceKey, id, values, nextStatus);
          if (!res.ok) {
            toast.error(res.message);
            if (res.fieldErrors) for (const [k, m] of Object.entries(res.fieldErrors)) setError(k, { message: m });
            return;
          }
          toast.success(nextStatus === config.status?.published ? "Published — it's live now." : (res.message ?? "Saved."));
          reset(values);
          if (!id && res.data) router.replace(`/admin/content/${resourceKey}/${res.data.id}`);
          else router.refresh();
        }),
      () => toast.error("Please fix the highlighted fields."),
    )();

  const groups = useMemo(() => {
    const main = config.fields.filter((f) => !f.group);
    const named = new Map<string, typeof config.fields>();
    for (const f of config.fields) if (f.group) named.set(f.group, [...(named.get(f.group) ?? []), f]);
    return { main, named: [...named.entries()] };
  }, [config.fields]);

  return (
    <MediaProvider initial={media}>
      <FormProvider {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="grid gap-6 xl:grid-cols-[1fr_20rem]"
          noValidate
        >
          <div className="min-w-0 space-y-6">
            <Card>
              <CardContent className="grid gap-5 md:grid-cols-2">
                {groups.main.map((f) => (
                  <FieldRenderer key={f.name} field={f} relations={relations} />
                ))}
              </CardContent>
            </Card>
            {groups.named.map(([label, fields]) => (
              <Card key={label}>
                <CardHeader>
                  <CardTitle>{label}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                  {fields.map((f) => (
                    <FieldRenderer key={f.name} field={f} relations={relations} />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <Card>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Status</span>
                  {config.status ? (
                    <Badge tone={isPublished ? "success" : "warning"}>{config.status.options.find((o) => o.value === status)?.label ?? "New"}</Badge>
                  ) : (
                    <Badge tone="primary">Live</Badge>
                  )}
                </div>
                {updatedAt ? <p className="text-xs text-muted-foreground">Last saved {formatDateTime(updatedAt)}</p> : null}
                {formState.isDirty ? <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs font-medium text-warning-soft-foreground">You have unsaved changes.</p> : null}
                <div className="grid gap-2">
                  {config.status && !statusInFields ? (
                    isPublished ? (
                      <>
                        <Button type="submit" disabled={pending}>
                          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />} Save changes
                        </Button>
                        <Button type="button" variant="outline" disabled={pending} onClick={() => submit(config.status!.draft)}>
                          <Undo2 aria-hidden /> Unpublish (back to draft)
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button type="button" variant="accent" disabled={pending} onClick={() => submit(config.status!.published)}>
                          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />} Publish
                        </Button>
                        <Button type="submit" variant="outline" disabled={pending}>
                          <Save aria-hidden /> Save draft
                        </Button>
                      </>
                    )
                  ) : (
                    <Button type="submit" disabled={pending}>
                      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />} Save changes
                    </Button>
                  )}
                  <p className="text-center text-xs text-muted-foreground">Tip: press Ctrl + S to save</p>
                </div>
                {id && (config.previewable || publicUrl) ? (
                  <div className="grid gap-2 border-t border-border pt-4">
                    {config.previewable ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/preview/${resourceKey}/${id}`} target="_blank">
                          <Eye aria-hidden /> Preview {formState.isDirty ? "(last saved)" : ""}
                        </Link>
                      </Button>
                    ) : null}
                    {publicUrl && isPublished ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={publicUrl} target="_blank">
                          <ExternalLink aria-hidden /> View on website
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                {id ? (
                  <div className="flex gap-2 border-t border-border pt-4">
                    {config.canCreate !== false ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          start(async () => {
                            const res = await duplicateRecord(resourceKey, id);
                            if (!res.ok) return void toast.error(res.message);
                            toast.success(res.message);
                            router.push(`/admin/content/${resourceKey}/${res.data!.id}`);
                          })
                        }
                      >
                        <Copy aria-hidden /> Duplicate
                      </Button>
                    ) : null}
                    {config.canDelete !== false ? (
                      <ConfirmDialog
                        title={`Delete this ${config.singular.toLowerCase()}?`}
                        description="It will be removed from the website straight away. A copy is kept in version history, so it can be restored."
                        onConfirm={() =>
                          start(async () => {
                            const res = await deleteRecords(resourceKey, [id]);
                            if (!res.ok) return void toast.error(res.message);
                            toast.success(res.message);
                            router.push(`/admin/content/${resourceKey}`);
                          })
                        }
                        trigger={
                          <Button type="button" variant="ghost" size="sm" className="flex-1 text-danger">
                            <Trash2 aria-hidden /> Delete
                          </Button>
                        }
                      />
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {id ? <VersionHistory versions={versions} /> : null}
          </aside>
        </form>
      </FormProvider>
    </MediaProvider>
  );
}

function VersionHistory({ versions }: { versions: VersionInfo[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-4" aria-hidden /> Version history
        </CardTitle>
      </CardHeader>
      <CardContent>
        {versions.length ? (
          <ol className="space-y-2">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{formatDateTime(v.createdAt)}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {v.user ?? "System"}
                    {v.note ? ` · ${v.note}` : ""}
                  </span>
                </span>
                <ConfirmDialog
                  title="Restore this version?"
                  description="The current content will be replaced with this saved version. The current content is kept in history too, so you can undo this."
                  confirmLabel="Restore"
                  destructive={false}
                  onConfirm={() =>
                    start(async () => {
                      const res = await restoreVersion(v.id);
                      if (!res.ok) return void toast.error(res.message);
                      toast.success(res.message);
                      router.refresh();
                      setTimeout(() => window.location.reload(), 300);
                    })
                  }
                  trigger={
                    <Button type="button" size="icon-sm" variant="ghost" aria-label="Restore this version" disabled={pending}>
                      <RotateCcw aria-hidden />
                    </Button>
                  }
                />
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">Earlier versions appear here each time you save.</p>
        )}
      </CardContent>
    </Card>
  );
}
