"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

/** Click-to-load map: keeps the heavy Google Maps iframe off the critical path on slow networks. */
export function MapEmbed({ src, title }: { src: string; title: string }) {
  const [load, setLoad] = useState(false);
  if (load) {
    return (
      <iframe
        src={src}
        title={title}
        className="aspect-[4/3] w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setLoad(true)}
      className="motif-texture group bg-primary-soft text-primary-soft-foreground relative grid aspect-[4/3] w-full place-items-center"
    >
      <span className="flex flex-col items-center gap-3">
        <span className="bg-primary text-primary-foreground grid size-14 place-items-center rounded-full shadow-[var(--shadow-lift)] transition-transform group-hover:scale-105">
          <MapPin className="size-6" aria-hidden />
        </span>
        <span className="font-semibold">Show map</span>
        <span className="text-xs opacity-80">Loads Google Maps</span>
      </span>
    </button>
  );
}
