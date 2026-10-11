import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import { TAGS } from "@/lib/cache-tags";
import {
  asArray,
  type CareerItem,
  type EligibilityRow,
  type FeeRow,
  type GalleryImage,
  type MediaLite,
  type SectionItem,
} from "@/lib/content-types";

// Public read layer. Everything here is cached and tagged, so admin saves can
// invalidate exactly what changed (see lib/admin/revalidate.ts).

export const mediaSelect = {
  id: true,
  kind: true,
  url: true,
  alt: true,
  width: true,
  height: true,
  blurDataUrl: true,
  mimeType: true,
  filename: true,
  bytes: true,
} as const;

async function resolveMedia(ids: string[]): Promise<Map<string, MediaLite>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const rows = await prisma.media.findMany({ where: { id: { in: unique } }, select: mediaSelect });
  return new Map(rows.map((m) => [m.id, m]));
}

async function resolveGallery(value: unknown): Promise<GalleryImage[]> {
  const items = asArray<{ mediaId?: string; caption?: string }>(value).filter((i) => i.mediaId);
  const map = await resolveMedia(items.map((i) => i.mediaId!));
  const out: GalleryImage[] = [];
  for (const i of items) {
    const media = map.get(i.mediaId!);
    if (media) out.push({ mediaId: i.mediaId!, caption: i.caption, media });
  }
  return out;
}

// ── Settings, navigation, SEO ───────────────────────────────

export async function getSettings() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.settings, TAGS.media);
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "site" },
    include: {
      logo: { select: mediaSelect },
      favicon: { select: mediaSelect },
      defaultOgImage: { select: mediaSelect },
      principalPhoto: { select: mediaSelect },
    },
  });
  if (!settings) throw new Error("Site settings are missing. Run `npm run db:seed`.");
  return settings;
}
export type Settings = Awaited<ReturnType<typeof getSettings>>;

export async function getNavigation() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.nav);
  const items = await prisma.navItem.findMany({
    where: { enabled: true },
    orderBy: [{ menu: "asc" }, { order: "asc" }],
    select: { id: true, menu: true, label: true, href: true, newTab: true },
  });
  return {
    header: items.filter((i) => i.menu === "HEADER"),
    explore: items.filter((i) => i.menu === "FOOTER_EXPLORE"),
    students: items.filter((i) => i.menu === "FOOTER_STUDENTS"),
    legal: items.filter((i) => i.menu === "FOOTER_LEGAL"),
  };
}
export type Navigation = Awaited<ReturnType<typeof getNavigation>>;

export async function getSeoEntry(path: string) {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.seo, TAGS.media);
  return prisma.seoEntry.findUnique({ where: { path }, include: { ogImage: { select: mediaSelect } } });
}

// ── Sections ────────────────────────────────────────────────

export type SectionData = {
  key: string;
  enabled: boolean;
  order: number;
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
  image: MediaLite | null;
  items: SectionItem[];
};

export async function getSections(page: string): Promise<SectionData[]> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.sections, TAGS.media);
  const rows = await prisma.section.findMany({
    where: { page },
    orderBy: { order: "asc" },
    include: { image: { select: mediaSelect } },
  });
  const itemMediaIds = rows.flatMap((r) => asArray<SectionItem>(r.items).map((i) => i.mediaId ?? ""));
  const media = await resolveMedia(itemMediaIds);
  return rows.map((r) => ({
    key: r.key,
    enabled: r.enabled,
    order: r.order,
    eyebrow: r.eyebrow,
    title: r.title,
    subtitle: r.subtitle,
    body: r.body,
    ctaLabel: r.ctaLabel,
    ctaHref: r.ctaHref,
    secondaryCtaLabel: r.secondaryCtaLabel,
    secondaryCtaHref: r.secondaryCtaHref,
    image: r.image,
    items: asArray<SectionItem>(r.items).map((i) => ({
      ...i,
      image: i.mediaId ? (media.get(i.mediaId) ?? null) : null,
    })),
  }));
}

export function sectionByKey(sections: SectionData[], key: string) {
  const s = sections.find((x) => x.key === key);
  return s && s.enabled ? s : null;
}

// ── Pages ───────────────────────────────────────────────────

export async function getPage(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.pages, TAGS.media);
  return prisma.page.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { heroImage: { select: mediaSelect }, ogImage: { select: mediaSelect } },
  });
}

export async function getPublishedPageSlugs() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.pages);
  return prisma.page.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true, system: true, noindex: true },
  });
}

// ── Programmes & admissions ─────────────────────────────────

function mapProgramme<T extends { eligibility: unknown; careers: unknown; fees: unknown }>(
  p: T,
): Omit<T, "eligibility" | "careers" | "fees"> & {
  eligibility: EligibilityRow[];
  careers: CareerItem[];
  fees: FeeRow[];
} {
  return {
    ...p,
    eligibility: asArray<EligibilityRow>(p.eligibility),
    careers: asArray<CareerItem>(p.careers),
    fees: asArray<FeeRow>(p.fees).filter((f) => f.label && f.amount),
  };
}

export async function getActiveProgrammes() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.programmes, TAGS.media);
  const rows = await prisma.programme.findMany({
    where: { status: "ACTIVE" },
    orderBy: { order: "asc" },
    include: { heroImage: { select: mediaSelect } },
  });
  return rows.map(mapProgramme);
}
export type PublicProgramme = Awaited<ReturnType<typeof getActiveProgrammes>>[number];

export async function getProgramme(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.programmes, TAGS.media);
  const p = await prisma.programme.findFirst({
    where: { slug, status: "ACTIVE" },
    include: { heroImage: { select: mediaSelect }, ogImage: { select: mediaSelect } },
  });
  return p ? mapProgramme(p) : null;
}

export async function getEligibilityConfig() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.programmes, TAGS.eligibility);
  const programmes = await prisma.programme.findMany({
    where: { status: "ACTIVE" },
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      shortName: true,
      name: true,
      eligibilityRules: {
        where: { status: "PUBLISHED" },
        orderBy: { order: "asc" },
        select: { id: true, category: true, qualifications: true, minPercent: true, resultNote: true },
      },
    },
  });
  return programmes;
}
export type EligibilityConfig = Awaited<ReturnType<typeof getEligibilityConfig>>;

export async function getAdmissionDates() {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.admissionDates);
  return prisma.admissionDate.findMany({
    where: { status: "PUBLISHED", OR: [{ programmeId: null }, { programme: { status: "ACTIVE" } }] },
    orderBy: [{ order: "asc" }, { date: "asc" }],
    include: { programme: { select: { shortName: true } } },
  });
}

// ── Notices ─────────────────────────────────────────────────

const noticeListSelect = {
  id: true,
  title: true,
  slug: true,
  category: true,
  summary: true,
  pinned: true,
  publishedAt: true,
  externalLink: true,
  attachment: { select: mediaSelect },
} as const;

export async function getNotices() {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.notices, TAGS.media);
  const now = new Date();
  return prisma.notice.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    select: noticeListSelect,
    take: 200,
  });
}
export type NoticeListItem = Awaited<ReturnType<typeof getNotices>>[number];

export async function getNotice(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.notices, TAGS.media);
  return prisma.notice.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { lte: new Date() } },
    include: { attachment: { select: mediaSelect }, ogImage: { select: mediaSelect } },
  });
}

// ── People & places ─────────────────────────────────────────

export async function getFaculty() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.faculty, TAGS.media);
  return prisma.facultyMember.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { photo: { select: mediaSelect } },
  });
}
export type FacultyItem = Awaited<ReturnType<typeof getFaculty>>[number];

export async function getFacilities() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.facilities, TAGS.media);
  const rows = await prisma.facility.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    include: { cover: { select: mediaSelect } },
  });
  return Promise.all(rows.map(async (f) => ({ ...f, images: await resolveGallery(f.images) })));
}
export type FacilityItem = Awaited<ReturnType<typeof getFacilities>>[number];

// ── Events & gallery ────────────────────────────────────────

export async function getEvents() {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.events, TAGS.media);
  return prisma.event.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { startsAt: "desc" },
    include: { cover: { select: mediaSelect } },
  });
}
export type EventItem = Awaited<ReturnType<typeof getEvents>>[number];

/** Upcoming vs past, computed inside the cache scope (refreshes hourly). */
export async function getEventsSplit() {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.events, TAGS.media);
  const events = await getEvents();
  const now = Date.now();
  const isUpcoming = (e: EventItem) => (e.endsAt ?? e.startsAt).getTime() >= now;
  return {
    upcoming: events.filter(isUpcoming).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
    past: events.filter((e) => !isUpcoming(e)),
  };
}

export async function getEvent(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.events, TAGS.albums, TAGS.media);
  const e = await prisma.event.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      cover: { select: mediaSelect },
      ogImage: { select: mediaSelect },
      album: { select: { slug: true, title: true, status: true, images: true } },
    },
  });
  if (!e) return null;
  const albumImages = e.album && e.album.status === "PUBLISHED" ? await resolveGallery(e.album.images) : [];
  return { ...e, albumImages };
}

export async function getAlbums() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.albums, TAGS.media);
  const rows = await prisma.album.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    include: { cover: { select: mediaSelect } },
  });
  return Promise.all(rows.map(async (a) => ({ ...a, images: await resolveGallery(a.images) })));
}
export type AlbumItem = Awaited<ReturnType<typeof getAlbums>>[number];

export async function getAlbum(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.albums, TAGS.media);
  const a = await prisma.album.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { cover: { select: mediaSelect } },
  });
  return a ? { ...a, images: await resolveGallery(a.images) } : null;
}

export async function getHomeGallery() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.albums, TAGS.media);
  const albums = await prisma.album.findMany({
    where: { status: "PUBLISHED", showOnHome: true },
    orderBy: { order: "asc" },
    select: { images: true, title: true, slug: true },
  });
  const images = (await Promise.all(albums.map((a) => resolveGallery(a.images)))).flat();
  return images.slice(0, 8);
}

// ── Testimonials, FAQs, downloads ───────────────────────────

export async function getTestimonials() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.testimonials, TAGS.media);
  return prisma.testimonial.findMany({
    where: { status: "PUBLISHED", consent: true },
    orderBy: { order: "asc" },
    include: { photo: { select: mediaSelect } },
  });
}
export type TestimonialItem = Awaited<ReturnType<typeof getTestimonials>>[number];

export async function getFaqs() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.faqs);
  return prisma.faq.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: { id: true, question: true, answer: true, category: true, showOnHome: true },
  });
}
export type FaqItem = Awaited<ReturnType<typeof getFaqs>>[number];

export async function getDownloads() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.downloads, TAGS.media);
  return prisma.download.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ category: "asc" }, { order: "asc" }],
    include: { file: { select: mediaSelect } },
  });
}
export type DownloadItem = Awaited<ReturnType<typeof getDownloads>>[number];
