import { ArrowUpRight, FileText } from "lucide-react";
import type { DownloadItem } from "@/lib/data/public";
import { formatDate } from "@/lib/utils";

function size(bytes: number) {
  return bytes > 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`;
}

export function FileLink({ download: d }: { download: DownloadItem }) {
  const href = d.file?.url ?? d.externalUrl;
  if (!href) return null;
  const isPdf = d.file?.mimeType === "application/pdf";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-[box-shadow,border-color] hover:border-primary/40 hover:shadow-[var(--shadow-lift)]"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-danger-soft text-danger-soft-foreground">
        <FileText className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug group-hover:text-primary">{d.title}</span>
        <span className="block text-sm text-muted-foreground">
          {[d.description, d.issuedOn ? `Issued ${formatDate(d.issuedOn)}` : null, d.file ? `${isPdf ? "PDF" : "File"} · ${size(d.file.bytes)}` : "External link"]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
      <ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
