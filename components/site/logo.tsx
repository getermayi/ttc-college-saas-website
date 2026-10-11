import Image from "next/image";
import { cn } from "@/lib/utils";
import type { MediaLite } from "@/lib/content-types";

/** Emblem: hills over an open book, framed by a woven diamond. */
export function Emblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("size-10", className)}>
      <path d="M24 2 46 24 24 46 2 24Z" fill="var(--primary)" />
      <path
        d="M24 7 41 24 24 41 7 24Z"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeOpacity=".35"
        strokeWidth="1"
      />
      <path
        d="M12.5 26.5 19 19l4 4.6 4.6-6.1 8 9"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M14 30c3.4-1.6 6.8-1.6 10 .6 3.2-2.2 6.6-2.2 10-.6"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="31" cy="15.5" r="2" fill="var(--accent)" />
    </svg>
  );
}

export function Logo({
  name,
  shortName,
  logo,
  className,
  inverted = false,
}: {
  name: string;
  shortName: string;
  logo?: MediaLite | null;
  className?: string;
  inverted?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      {logo ? (
        <Image
          src={logo.url}
          alt=""
          width={44}
          height={44}
          className="size-11 rounded-xl object-contain"
          priority
        />
      ) : (
        <Emblem className="size-11 shrink-0" />
      )}
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[1.35rem] font-semibold tracking-tight",
            inverted ? "text-[#fbf7f0]" : "text-foreground",
          )}
        >
          {shortName}
        </span>
        <span
          className={cn(
            "mt-1 hidden text-[0.7rem] font-medium tracking-[0.14em] uppercase sm:block",
            inverted ? "text-[#fbf7f0]/70" : "text-muted-foreground",
          )}
        >
          {name.replace(/,?\s*Aalo$/i, "")}
        </span>
      </span>
    </span>
  );
}
