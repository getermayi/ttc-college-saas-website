"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, FileText, Loader2, Trash2, Upload } from "lucide-react";
import type { MediaLite } from "@/lib/content-types";
import { deleteMedia, updateMedia } from "@/lib/admin/media-actions";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { UploadPanel } from "./fields/media-picker";

type Item = MediaLite & { caption: string | null; createdAt: string };

function size(b: number) {
  return b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`;
}

export function MediaLibrary({ items }: { items: Item[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Item | null>(null);
  const [uploadKind, setUploadKind] = useState<"IMAGE" | "DOCUMENT" | null>(null);
  const [pending, start] = useTransition();
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");

  const open = (m: Item) => {
    setEditing(m);
    setAlt(m.alt);
    setCaption(m.caption ?? "");
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        <Button onClick={() => setUploadKind("IMAGE")}>
          <Upload aria-hidden /> Upload image
        </Button>
        <Button variant="outline" onClick={() => setUploadKind("DOCUMENT")}>
          <FileText aria-hidden /> Upload PDF
        </Button>
      </div>
      {items.length ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => open(m)}
                className="group border-border bg-surface hover:border-primary focus-visible:border-primary w-full overflow-hidden rounded-2xl border text-left"
              >
                {m.kind === "IMAGE" ? (
                  <span className="bg-surface-2 relative block aspect-square">
                    <Image
                      src={m.url}
                      alt={m.alt}
                      fill
                      sizes="240px"
                      className="object-cover transition-transform group-hover:scale-[1.03]"
                    />
                  </span>
                ) : (
                  <span className="bg-danger-soft text-danger-soft-foreground grid aspect-square place-items-center">
                    <FileText className="size-10" aria-hidden />
                  </span>
                )}
                <span className="block p-3">
                  <span className="block truncate text-sm font-medium">{m.alt || m.filename}</span>
                  <span className="text-muted-foreground text-xs">
                    {size(m.bytes)} · {formatDate(m.createdAt)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-border-strong text-muted-foreground rounded-2xl border border-dashed p-12 text-center">
          No files yet. Upload photos of the campus, classrooms and events — real photos build trust.
        </p>
      )}

      <Dialog open={uploadKind !== null} onOpenChange={(o) => !o && setUploadKind(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{uploadKind === "IMAGE" ? "Upload an image" : "Upload a PDF"}</DialogTitle>
          </DialogHeader>
          {uploadKind ? (
            <UploadPanel
              kind={uploadKind}
              onUploaded={() => {
                setUploadKind(null);
                router.refresh();
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>File details</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {editing.kind === "IMAGE" ? (
                <div className="bg-surface-2 relative aspect-square overflow-hidden rounded-xl">
                  <Image src={editing.url} alt={editing.alt} fill sizes="320px" className="object-contain" />
                </div>
              ) : (
                <a
                  href={editing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-danger-soft text-danger-soft-foreground grid aspect-square place-items-center rounded-xl"
                >
                  <FileText className="size-12" aria-hidden />
                  <span className="text-sm font-semibold underline">Open PDF</span>
                </a>
              )}
              <div className="space-y-4">
                <p className="text-muted-foreground text-xs break-all">
                  {editing.filename} · {size(editing.bytes)}
                  {editing.width ? ` · ${editing.width}×${editing.height}` : ""}
                </p>
                <Field
                  id="m-alt"
                  label={editing.kind === "IMAGE" ? "Alt text" : "Title"}
                  required={editing.kind === "IMAGE"}
                >
                  <Input id="m-alt" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={250} />
                </Field>
                <Field id="m-caption" label="Caption" optional>
                  <Input
                    id="m-caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={300}
                  />
                </Field>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      new URL(editing.url, window.location.origin).toString(),
                    );
                    toast.success("Link copied.");
                  }}
                >
                  <Copy aria-hidden /> Copy link
                </Button>
              </div>
            </div>
          ) : null}
          <DialogFooter className="sm:justify-between">
            <ConfirmDialog
              title="Delete this file?"
              description="This can't be undone. Files that are still used on the website can't be deleted."
              onConfirm={() =>
                start(async () => {
                  const res = await deleteMedia(editing!.id);
                  if (!res.ok) return void toast.error(res.message);
                  toast.success(res.message);
                  setEditing(null);
                  router.refresh();
                })
              }
              trigger={
                <Button variant="ghost" className="text-danger" disabled={pending}>
                  <Trash2 aria-hidden /> Delete
                </Button>
              }
            />
            <Button
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await updateMedia(editing!.id, { alt, caption });
                  if (!res.ok) return void toast.error(res.message);
                  toast.success(res.message);
                  setEditing(null);
                  router.refresh();
                })
              }
            >
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
