import Link from "next/link";

/** Accessible horizontal bar list (one hue, values shown as text). */
export function BarList({
  items,
  empty = "No data yet.",
  hrefFor,
}: {
  items: { label: string; value: number; sub?: string }[];
  empty?: string;
  hrefFor?: (label: string) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="text-muted-foreground py-6 text-center text-sm">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((i) => {
        const content = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium">{i.label}</span>
              <span className="text-muted-foreground shrink-0 tabular-nums">
                <span className="text-foreground font-semibold">{i.value}</span>
                {i.sub ? ` · ${i.sub}` : ""}
              </span>
            </div>
            <div className="bg-surface-2 mt-1 h-2 rounded-full" aria-hidden>
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${Math.max(2, (i.value / max) * 100)}%` }}
              />
            </div>
          </>
        );
        return (
          <li key={i.label}>
            {hrefFor ? (
              <Link href={hrefFor(i.label)} className="block rounded-lg hover:opacity-80">
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}
