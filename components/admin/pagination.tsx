import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  params,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => {
    const sp = new URLSearchParams(
      Object.entries({ ...params, page: p > 1 ? String(p) : undefined }).filter((e): e is [string, string] =>
        Boolean(e[1]),
      ),
    );
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-4 text-sm">
      <p className="text-muted-foreground">
        {from}–{to} of {total}
      </p>
      <div className="flex gap-2">
        <Link
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
          href={href(page - 1)}
          className={cn(
            "border-border bg-surface inline-flex h-9 items-center gap-1 rounded-full border px-3 font-medium",
            page <= 1 && "pointer-events-none opacity-40",
          )}
        >
          <ChevronLeft className="size-4" aria-hidden /> Previous
        </Link>
        <Link
          aria-disabled={page >= pages}
          tabIndex={page >= pages ? -1 : undefined}
          href={href(page + 1)}
          className={cn(
            "border-border bg-surface inline-flex h-9 items-center gap-1 rounded-full border px-3 font-medium",
            page >= pages && "pointer-events-none opacity-40",
          )}
        >
          Next <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
    </nav>
  );
}
