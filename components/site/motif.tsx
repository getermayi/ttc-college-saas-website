import { cn } from "@/lib/utils";

/**
 * A woven-band divider: abstract lozenges and zig-zags inspired by the geometry of
 * Arunachal handloom textiles. Decorative only.
 */
export function MotifBand({
  className,
  tone = "primary",
}: {
  className?: string;
  tone?: "primary" | "accent" | "light";
}) {
  const color = tone === "accent" ? "var(--accent)" : tone === "light" ? "#fbf7f0" : "var(--primary)";
  return (
    <svg aria-hidden className={cn("block h-4 w-full", className)} preserveAspectRatio="none">
      <defs>
        <pattern id={`band-${tone}`} width="32" height="16" patternUnits="userSpaceOnUse">
          <path d="M0 8 8 1 16 8 8 15Z" fill={color} fillOpacity="0.9" />
          <path
            d="M16 8 24 1 32 8 24 15Z"
            fill="none"
            stroke={color}
            strokeOpacity="0.55"
            strokeWidth="1.5"
          />
          <circle cx="24" cy="8" r="1.6" fill={color} fillOpacity="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="16" fill={`url(#band-${tone})`} />
    </svg>
  );
}

export function MotifDiamond({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className={cn("size-10", className)} fill="none">
      <path d="M20 2 38 20 20 38 2 20Z" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M20 10 30 20 20 30 10 20Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M20 16 24 20 20 24 16 20Z" fill="currentColor" />
    </svg>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-accent inline-flex items-center gap-2 text-[0.8rem] font-semibold tracking-[0.16em] uppercase",
        className,
      )}
    >
      <svg aria-hidden viewBox="0 0 12 12" className="size-2.5" fill="currentColor">
        <path d="M6 0 12 6 6 12 0 6Z" />
      </svg>
      {children}
    </p>
  );
}
