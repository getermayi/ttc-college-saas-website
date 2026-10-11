import Link from "next/link";

/** Accessible horizontal bar list (one hue, values shown as text). */
export function BarList({ items, empty = "No data yet.", hrefFor }: { items: { label: string; value: number; sub?: string }[]; empty?: string; hrefFor?: (label: string) => string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((i) => {
        const content = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium">{i.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                <span className="font-semibold text-foreground">{i.value}</span>
                {i.sub ? ` · ${i.sub}` : ""}
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-surface-2" aria-hidden>
              <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(2, (i.value / max) * 100)}%` }} />
            </div>
          </>
        );
        return <li key={i.label}>{hrefFor ? <Link href={hrefFor(i.label)} className="block rounded-lg hover:opacity-80">{content}</Link> : content}</li>;
      })}
    </ul>
  );
}
