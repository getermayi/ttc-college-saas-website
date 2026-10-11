import { cn } from "@/lib/utils";

/** Renders admin-authored HTML. Content is sanitised on save (lib/sanitize.ts). */
export function RichText({ html, className }: { html: string | null | undefined; className?: string }) {
  if (!html) return null;
  return <div className={cn("prose-ttc", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
