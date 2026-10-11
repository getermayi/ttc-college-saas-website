"use client";

import { useEffect } from "react";
import { UTM_KEYS } from "@/lib/constants";

const KEY = "ttc-attribution";

export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;
  landingPage?: string;
};

const MAP: Record<(typeof UTM_KEYS)[number], keyof Attribution> = {
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_term: "utmTerm",
  utm_content: "utmContent",
};

/**
 * Remembers how the visitor found us (UTM tags, referrer, landing page) for 30 days.
 * A new UTM-tagged visit replaces the old one (last-touch), so Meta Ads campaigns get credit.
 */
export function UtmCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hasUtm = UTM_KEYS.some((k) => params.get(k));
      const existing = readAttribution();
      if (!hasUtm && existing) return;
      const data: Attribution & { at: number } = { at: Date.now() };
      for (const k of UTM_KEYS) {
        const v = params.get(k);
        if (v) data[MAP[k]] = v.slice(0, 120);
      }
      if (!data.utmSource && params.get("fbclid")) {
        data.utmSource = "facebook";
        data.utmMedium = data.utmMedium ?? "paid_social";
      }
      if (!data.utmSource && params.get("gclid")) {
        data.utmSource = "google";
        data.utmMedium = data.utmMedium ?? "cpc";
      }
      const ref = document.referrer;
      if (ref && !ref.startsWith(window.location.origin)) data.referrer = ref.slice(0, 300);
      data.landingPage = (window.location.pathname + window.location.search).slice(0, 300);
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {}
  }, []);
  return null;
}

export function readAttribution(): Attribution | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Attribution & { at?: number };
    if (data.at && Date.now() - data.at > 30 * 86_400_000) return null;
    delete data.at;
    return data;
  } catch {
    return null;
  }
}
