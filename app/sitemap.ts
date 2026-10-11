import type { MetadataRoute } from "next";
import {
  getActiveProgrammes,
  getAlbums,
  getEvents,
  getNotices,
  getPublishedPageSlugs,
} from "@/lib/data/public";
import { absoluteUrl } from "@/lib/utils";

const STATIC: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/admissions", priority: 0.95, changeFrequency: "weekly" },
  { path: "/enquire", priority: 0.9, changeFrequency: "monthly" },
  { path: "/programmes", priority: 0.9, changeFrequency: "monthly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/notices", priority: 0.8, changeFrequency: "daily" },
  { path: "/faculty", priority: 0.6, changeFrequency: "monthly" },
  { path: "/campus", priority: 0.6, changeFrequency: "monthly" },
  { path: "/events", priority: 0.5, changeFrequency: "weekly" },
  { path: "/gallery", priority: 0.5, changeFrequency: "monthly" },
  { path: "/student-life", priority: 0.5, changeFrequency: "monthly" },
  { path: "/disclosures", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
  { path: "/grievance", priority: 0.3, changeFrequency: "yearly" },
  { path: "/admissions/checklist", priority: 0.4, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [programmes, notices, events, albums, pages] = await Promise.all([
    getActiveProgrammes(),
    getNotices(),
    getEvents(),
    getAlbums(),
    getPublishedPageSlugs(),
  ]);
  return [
    ...STATIC.map((s) => ({
      url: absoluteUrl(s.path),
      priority: s.priority,
      changeFrequency: s.changeFrequency,
    })),
    ...programmes
      .filter((p) => !p.noindex)
      .map((p) => ({ url: absoluteUrl(`/programmes/${p.slug}`), lastModified: p.updatedAt, priority: 0.9 })),
    ...notices.map((n) => ({
      url: absoluteUrl(`/notices/${n.slug}`),
      lastModified: n.publishedAt,
      priority: 0.6,
    })),
    ...events.map((e) => ({
      url: absoluteUrl(`/events/${e.slug}`),
      lastModified: e.updatedAt,
      priority: 0.5,
    })),
    ...albums.map((a) => ({
      url: absoluteUrl(`/gallery/${a.slug}`),
      lastModified: a.updatedAt,
      priority: 0.4,
    })),
    ...pages
      .filter((p) => !p.noindex && p.slug !== "student-life")
      .map((p) => ({ url: absoluteUrl(`/${p.slug}`), lastModified: p.updatedAt, priority: 0.4 })),
  ];
}
