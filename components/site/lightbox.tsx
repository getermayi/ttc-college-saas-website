"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import type { MediaLite } from "@/lib/content-types";
import { cn } from "@/lib/utils";

export type LightboxImage = { media: MediaLite; caption?: string | null };

/** Responsive photo grid with an accessible lightbox (keyboard arrows, swipe-friendly buttons). */
export function LightboxGallery({ images, className, title }: { images: LightboxImage[]; className?: string; title: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;
  const go = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + images.length) % images.length)), [images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  const current = index !== null ? images[index] : null;

  return (
    <>
      <ul className={cn("columns-2 gap-3 md:columns-3 md:gap-4 [&>li]:mb-3 md:[&>li]:mb-4", className)}>
        {images.map((img, i) => (
          <li key={img.media.id} className="break-inside-avoid">
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group relative block w-full overflow-hidden rounded-2xl bg-surface-2"
              aria-label={`Open photo ${i + 1} of ${images.length}${img.caption ? `: ${img.caption}` : ""}`}
            >
              <Image
                src={img.media.url}
                alt={img.media.alt}
                width={img.media.width ?? 800}
                height={img.media.height ?? 600}
                sizes="(min-width: 768px) 33vw, 50vw"
                placeholder={img.media.blurDataUrl ? "blur" : "empty"}
                blurDataURL={img.media.blurDataUrl ?? undefined}
                className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <span className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <Expand className="size-4" aria-hidden />
              </span>
              {img.caption ? (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3 pt-8 text-left text-sm text-white">{img.caption}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <Dialog.Root open={open} onOpenChange={(o) => !o && setIndex(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90" />
          <Dialog.Content className="fixed inset-0 z-50 flex flex-col focus:outline-none" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
            <div className="flex items-center justify-between p-3 text-white">
              <span className="text-sm tabular-nums">{index !== null ? `${index + 1} / ${images.length}` : ""}</span>
              <Dialog.Close className="grid size-11 place-items-center rounded-full hover:bg-white/10" aria-label="Close">
                <X className="size-6" aria-hidden />
              </Dialog.Close>
            </div>
            <div className="relative flex-1">
              {current ? (
                <Image src={current.media.url} alt={current.media.alt} fill sizes="100vw" className="object-contain" />
              ) : null}
              {images.length > 1 ? (
                <>
                  <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60">
                    <ChevronLeft className="size-6" aria-hidden />
                  </button>
                  <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60">
                    <ChevronRight className="size-6" aria-hidden />
                  </button>
                </>
              ) : null}
            </div>
            <p className="min-h-14 p-4 text-center text-sm text-white/85">{current?.caption ?? current?.media.alt}</p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
