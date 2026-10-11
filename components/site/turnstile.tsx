"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** Cloudflare Turnstile widget. Renders nothing when no site key is configured (local dev). */
export function Turnstile({ onToken, resetKey }: { onToken: (token: string) => void; resetKey?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef<string | null>(null);
  const cb = useRef(onToken);
  useEffect(() => {
    cb.current = onToken;
  }, [onToken]);

  const render = () => {
    if (!SITE_KEY || !ref.current || !window.turnstile || idRef.current) return;
    idRef.current = window.turnstile.render(ref.current, {
      sitekey: SITE_KEY,
      theme: "auto",
      size: "flexible",
      callback: (t: string) => cb.current(t),
      "expired-callback": () => cb.current(""),
      "error-callback": () => cb.current(""),
    });
  };

  useEffect(() => {
    render();
    return () => {
      if (idRef.current && window.turnstile) window.turnstile.remove(idRef.current);
      idRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (resetKey && idRef.current && window.turnstile) window.turnstile.reset(idRef.current);
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="lazyOnload" onLoad={render} />
      <div ref={ref} className="min-h-[65px]" />
    </>
  );
}

export const turnstileEnabled = Boolean(SITE_KEY);
