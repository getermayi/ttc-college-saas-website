import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaLite } from "@/lib/content-types";

const GRADIENTS = [
  "from-[#2f6b52] via-[#1f4d3a] to-[#14352a]",
  "from-[#c2683e] via-[#a5532c] to-[#7d3c1e]",
  "from-[#5d8fb3] via-[#3f7097] to-[#2b5475]",
  "from-[#8a9f5b] via-[#667c3d] to-[#4a5c2b]",
  "from-[#b98d4f] via-[#977038] to-[#6f5127]",
];

/**
 * A photo slot. Shows the uploaded image (with blur-up placeholder) or a tasteful
 * gradient with the woven motif until the admin uploads a real photograph.
 */
export function Photo({
  media,
  label,
  className,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  variant = 0,
  rounded = "rounded-3xl",
  fill = true,
}: {
  media?: MediaLite | null;
  label?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  variant?: number;
  rounded?: string;
  fill?: boolean;
}) {
  if (media && media.kind === "IMAGE") {
    return (
      <div className={cn("relative overflow-hidden bg-surface-2", rounded, className)}>
        <Image
          src={media.url}
          alt={media.alt}
          {...(fill ? { fill: true } : { width: media.width ?? 1200, height: media.height ?? 800 })}
          sizes={sizes}
          priority={priority}
          quality={75}
          placeholder={media.blurDataUrl ? "blur" : "empty"}
          blurDataURL={media.blurDataUrl ?? undefined}
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label ? `${label} (photo coming soon)` : undefined}
      aria-hidden={label ? undefined : true}
      className={cn("relative isolate overflow-hidden bg-gradient-to-br", GRADIENTS[variant % GRADIENTS.length], rounded, className)}
    >
      <div className="motif-texture-light absolute inset-0 opacity-90" />
      <div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-16 -left-10 size-56 rounded-full bg-black/15 blur-2xl" />
      {label ? (
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
          <ImageIcon className="size-3.5" aria-hidden />
          {label}
        </span>
      ) : null}
    </div>
  );
}
