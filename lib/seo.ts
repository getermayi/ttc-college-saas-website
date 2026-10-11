import "server-only";
import type { Metadata } from "next";
import { getSeoEntry, getSettings } from "@/lib/data/public";
import type { MediaLite } from "@/lib/content-types";
import { absoluteUrl } from "@/lib/utils";

type BuildArgs = {
  path: string;
  title?: string | null;
  description?: string | null;
  ogImage?: Pick<MediaLite, "url" | "width" | "height" | "alt"> | null;
  noindex?: boolean;
  type?: "website" | "article";
};

/**
 * Builds page metadata. Admin SEO overrides (SeoEntry for fixed routes, or the
 * fields passed in for dynamic content) win over defaults.
 */
export async function buildMetadata({ path, title, description, ogImage, noindex, type = "website" }: BuildArgs): Promise<Metadata> {
  const [settings, entry] = await Promise.all([getSettings(), getSeoEntry(path)]);
  const finalTitle = entry?.title || title || settings.siteName;
  const finalDescription = entry?.description || description || settings.description;
  const image = entry?.ogImage ?? ogImage ?? settings.defaultOgImage ?? null;
  const robotsNoindex = noindex || entry?.noindex;
  const url = absoluteUrl(path);

  return {
    title: path === "/" ? { absolute: finalTitle } : finalTitle,
    description: finalDescription,
    alternates: { canonical: url },
    robots: robotsNoindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type,
      url,
      siteName: settings.siteName,
      title: finalTitle,
      description: finalDescription,
      locale: "en_IN",
      ...(image
        ? { images: [{ url: image.url, width: image.width ?? 1200, height: image.height ?? 630, alt: image.alt }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDescription,
      ...(image ? { images: [image.url] } : {}),
    },
  };
}
