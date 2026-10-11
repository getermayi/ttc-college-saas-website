import Link from "next/link";
import { GraduationCap, Phone } from "lucide-react";
import { telLink, whatsappLink } from "@/lib/utils";
import { WhatsAppIcon } from "./brand-icons";

/** Thumb-friendly bottom bar on phones: Apply · Call · WhatsApp. */
export function MobileActionBar({
  phone,
  whatsapp,
  whatsappMessage,
}: {
  phone: string | null;
  whatsapp: string | null;
  whatsappMessage: string | null;
}) {
  const wa = whatsappLink(whatsapp, whatsappMessage);
  const tel = telLink(phone);
  const cols = 1 + (tel ? 1 : 0) + (wa ? 1 : 0);
  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="grid gap-2 p-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        <Link
          href="/enquire"
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-accent text-[0.95rem] font-semibold text-accent-foreground shadow-[var(--shadow-soft)] active:scale-[0.98]"
        >
          <GraduationCap className="size-5" aria-hidden />
          Apply
        </Link>
        {tel ? (
          <a href={tel} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary-soft text-[0.95rem] font-semibold text-primary-soft-foreground active:scale-[0.98]">
            <Phone className="size-5" aria-hidden />
            Call
          </a>
        ) : null}
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#1f7a4c] text-[0.95rem] font-semibold text-white active:scale-[0.98]"
          >
            <WhatsAppIcon className="size-5" />
            WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function WhatsAppFloat({ whatsapp, message }: { whatsapp: string | null; message: string | null }) {
  const wa = whatsappLink(whatsapp, message);
  if (!wa) return null;
  return (
    <a
      href={wa}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="no-print group fixed bottom-6 right-6 z-40 hidden items-center gap-2 rounded-full bg-[#1f7a4c] p-3.5 text-white shadow-[var(--shadow-float)] transition-[padding,transform] hover:-translate-y-0.5 hover:pr-5 md:flex"
    >
      <WhatsAppIcon className="size-7" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-[max-width] duration-300 group-hover:max-w-40">
        Chat with us
      </span>
    </a>
  );
}
