import Link from "next/link";
import { ArrowRight, Megaphone } from "lucide-react";
import type { Settings } from "@/lib/data/public";

export function AnnouncementBar({ settings }: { settings: Settings }) {
  if (!settings.announcementEnabled || !settings.announcementText) return null;
  const link = settings.announcementLink;
  return (
    <div className="relative z-50 bg-primary text-primary-foreground">
      <div className="container-page flex min-h-10 items-center justify-center gap-2 py-2 text-center text-sm">
        <Megaphone className="hidden size-4 shrink-0 sm:block" aria-hidden />
        <p className="font-medium">
          {settings.announcementText}
          {link ? (
            <>
              {" "}
              <Link href={link} className="inline-flex items-center gap-1 font-semibold underline underline-offset-4 hover:no-underline">
                {settings.announcementLinkLabel || "Learn more"}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
