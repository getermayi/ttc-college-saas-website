"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Check, FileText, ImagePlus, Loader2, Search, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { listMedia } from "@/lib/admin/media-actions";
import type { MediaLite } from "@/lib/content-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaCache } from "./media-context";

export async function uploadFile(
  file: File,
  alt: string,
  accept: "image" | "document" | "any",
  caption?: string,
): Promise<MediaLite> {
  const fd = new FormData();
  fd.set("file", file);
  fd.set("alt", alt);
  fd.set("accept", accept);
  if (caption) fd.set("caption", caption);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const json = (await res.json().catch(() => ({}))) as { media?: MediaLite; error?: string };
  if (!res.ok || !json.media) throw new Error(json.error ?? "Upload failed.");
  return json.media;
}

export function UploadPanel({
  kind,
  onUploaded,
}: {
  kind: "IMAGE" | "DOCUMENT";
  onUploaded: (m: MediaLite) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preview = file && kind === "IMAGE" ? URL.createObjectURL(file) : null;
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);

  async function submit() {
    if (!file) return setError("Choose a file first.");
    if (kind === "IMAGE" && alt.trim().length < 3)
      return setError("Describe the image in a few words (alt text).");
    if (file.size > 4 * 1024 * 1024) return setError("Files must be 4 MB or smaller.");
    setBusy(true);
    setError(null);
    try {
      const media = await uploadFile(file, alt, kind === "IMAGE" ? "image" : "document");
      toast.success("Uploaded.");
      onUploaded(media);
      setFile(null);
      setAlt("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <label
        className="border-border-strong bg-surface-2/40 hover:border-primary flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) setFile(f);
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="max-h-40 rounded-xl object-contain" />
        ) : (
          <Upload className="text-muted-foreground size-8" aria-hidden />
        )}
        <span className="font-semibold">
          {file ? file.name : `Choose or drop ${kind === "IMAGE" ? "an image" : "a PDF"}`}
        </span>
        <span className="text-muted-foreground text-xs">
          {kind === "IMAGE" ? "JPG, PNG, WebP or AVIF" : "PDF"} · up to 4 MB
        </span>
        <input
          type="file"
          className="sr-only"
          accept={kind === "IMAGE" ? "image/jpeg,image/png,image/webp,image/avif" : "application/pdf"}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {kind === "IMAGE" ? (
        <Field
          id="upload-alt"
          label="Alt text"
          required
          hint="Describe what's in the photo for people who can't see it, e.g. 'Students practising a lesson in a classroom'."
        >
          <Input
            id="upload-alt"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            maxLength={250}
            aria-describedby="upload-alt-hint"
          />
        </Field>
      ) : (
        <Field id="upload-alt" label="Title" optional>
          <Input id="upload-alt" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={250} />
        </Field>
      )}
      {error ? (
        <p role="alert" className="text-danger text-sm font-medium">
          {error}
        </p>
      ) : null}
      <Button type="button" onClick={submit} disabled={busy || !file}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />} Upload
      </Button>
    </div>
  );
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  kind,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  kind: "IMAGE" | "DOCUMENT";
  onSelect: (m: MediaLite) => void;
}) {
  const [items, setItems] = useState<MediaLite[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();
  const [tab, setTab] = useState("library");
  const cache = useMediaCache();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(
    (query: string, cursor?: string) =>
      start(async () => {
        const res = await listMedia({ kind, q: query || undefined, cursor });
        setItems((prev) => (cursor ? [...prev, ...res.items] : res.items));
        setNext(res.next);
      }),
    [kind],
  );

  useEffect(() => {
    if (open) load("");
  }, [open, load]);

  const choose = (m: MediaLite) => {
    cache.add(m);
    onSelect(m);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{kind === "IMAGE" ? "Choose an image" : "Choose a document"}</DialogTitle>
          <DialogDescription>Pick from the media library or upload a new file.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="upload">
              <ImagePlus aria-hidden /> Upload new
            </TabsTrigger>
          </TabsList>
          <TabsContent value="library">
            <div className="relative">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                aria-label="Search media"
                placeholder="Search by name or alt text"
                className="h-10 pl-9"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  clearTimeout(timer.current);
                  const v = e.target.value;
                  timer.current = setTimeout(() => load(v), 300);
                }}
              />
            </div>
            <ul
              className={cn(
                "mt-4 grid max-h-[50vh] gap-3 overflow-y-auto p-0.5",
                kind === "IMAGE" ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-2",
              )}
            >
              {items.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => choose(m)}
                    className="group border-border hover:border-primary focus-visible:border-primary w-full overflow-hidden rounded-xl border text-left"
                  >
                    {m.kind === "IMAGE" ? (
                      <span className="bg-surface-2 relative block aspect-square">
                        <Image src={m.url} alt={m.alt} fill sizes="160px" className="object-cover" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-3 p-3">
                        <FileText className="text-danger size-6 shrink-0" aria-hidden />
                        <span className="truncate text-sm font-medium">{m.alt || m.filename}</span>
                      </span>
                    )}
                    {m.kind === "IMAGE" ? (
                      <span className="text-muted-foreground block truncate px-2 py-1.5 text-xs">
                        {m.alt}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
            {!items.length && !pending ? (
              <p className="text-muted-foreground py-10 text-center">
                Nothing here yet. Upload your first file.
              </p>
            ) : null}
            {pending ? (
              <Loader2
                className="text-muted-foreground mx-auto mt-4 size-6 animate-spin"
                aria-label="Loading"
              />
            ) : null}
            {next && !pending ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => load(q, next)}
              >
                Load more
              </Button>
            ) : null}
          </TabsContent>
          <TabsContent value="upload">
            <UploadPanel kind={kind} onUploaded={choose} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function MediaField({
  id,
  value,
  onChange,
  kind,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  kind: "IMAGE" | "DOCUMENT";
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const cache = useMediaCache();
  const media = cache.get(value);
  return (
    <div
      id={id}
      className={cn(
        "border-border-strong bg-surface flex items-center gap-3 rounded-xl border p-2.5",
        invalid && "border-danger",
      )}
    >
      {media ? (
        media.kind === "IMAGE" ? (
          <span className="bg-surface-2 relative size-16 shrink-0 overflow-hidden rounded-lg">
            <Image src={media.url} alt={media.alt} fill sizes="64px" className="object-cover" />
          </span>
        ) : (
          <span className="bg-danger-soft text-danger-soft-foreground grid size-16 shrink-0 place-items-center rounded-lg">
            <FileText className="size-6" aria-hidden />
          </span>
        )
      ) : (
        <span className="border-border-strong text-muted-foreground grid size-16 shrink-0 place-items-center rounded-lg border border-dashed">
          {kind === "IMAGE" ? (
            <ImagePlus className="size-5" aria-hidden />
          ) : (
            <FileText className="size-5" aria-hidden />
          )}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {media ? media.alt || media.filename : value ? "Selected file" : "Nothing selected"}
        </p>
        <div className="mt-1 flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
            {value ? "Change" : "Choose"}
          </Button>
          {value ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")} aria-label="Remove">
              <X aria-hidden /> Remove
            </Button>
          ) : null}
        </div>
      </div>
      {media ? <Check className="text-success size-4 shrink-0" aria-hidden /> : null}
      <MediaPickerDialog open={open} onOpenChange={setOpen} kind={kind} onSelect={(m) => onChange(m.id)} />
    </div>
  );
}
