"use client";

import Script from "next/script";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Cookie } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const KEY = "ttc-consent";
type Consent = "granted" | "denied" | null;
const listeners = new Set<() => void>();

function read(): Consent {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}
function write(v: Exclude<Consent, null> | null) {
  try {
    if (v) localStorage.setItem(KEY, v);
    else localStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function useConsent() {
  // "unset" on the server so nothing analytics-related renders before hydration.
  return useSyncExternalStore(subscribe, read, () => "unset" as const);
}

export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => write(null)}>
      Cookie settings
    </button>
  );
}

/**
 * Consent banner + loader for optional analytics (GA4, Meta Pixel).
 * Nothing optional loads until the visitor clicks Accept.
 */
export function ConsentAndAnalytics({ gaId, pixelId }: { gaId: string | null; pixelId: string | null }) {
  const consent = useConsent();
  const [visible, setVisible] = useState(false);
  const hasTrackers = Boolean(gaId || pixelId);

  useEffect(() => {
    if (consent !== null) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, [consent]);

  if (!hasTrackers) return null;

  return (
    <>
      {consent === "granted" && gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(gaId)},{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}
      {consent === "granted" && pixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(pixelId)});fbq('track','PageView');`}
        </Script>
      ) : null}

      {visible && consent === null ? (
        <div
          role="dialog"
          aria-labelledby="consent-title"
          aria-describedby="consent-desc"
          className="no-print fixed inset-x-3 bottom-[5.5rem] z-50 mx-auto max-w-xl animate-fade-up rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-float)] md:bottom-6 md:left-6 md:right-auto"
        >
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-soft-foreground">
              <Cookie className="size-5" aria-hidden />
            </span>
            <div>
              <h2 id="consent-title" className="font-sans text-base font-semibold">
                Can we use analytics cookies?
              </h2>
              <p id="consent-desc" className="mt-1 text-sm leading-relaxed text-muted-foreground">
                They help us see which pages and adverts are useful. We never sell your data.{" "}
                <Link href="/privacy-policy" className="font-medium text-primary underline underline-offset-2">
                  Privacy policy
                </Link>
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2 sm:justify-end">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => write("denied")}>
              No, thanks
            </Button>
            <Button size="sm" className="flex-1 sm:flex-none" onClick={() => write("granted")}>
              Accept
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Fires a conversion event when consent was given. Safe to call any time. */
export function trackLead(programme?: string) {
  const w = window as unknown as { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void };
  if (read() !== "granted") return;
  w.gtag?.("event", "generate_lead", { programme });
  w.fbq?.("track", "Lead", { content_name: programme });
}
