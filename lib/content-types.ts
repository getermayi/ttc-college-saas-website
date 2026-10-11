// Plain types for content passed from the data layer to components.

export type MediaLite = {
  id: string;
  kind: "IMAGE" | "DOCUMENT";
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
  mimeType: string;
  filename: string;
  bytes: number;
};

export type SectionItem = {
  title?: string;
  description?: string;
  icon?: string;
  value?: string;
  suffix?: string;
  href?: string;
  mediaId?: string;
  image?: MediaLite | null;
};

export type GalleryImage = { mediaId: string; caption?: string; media: MediaLite };

export type EligibilityRow = { category: string; requirement: string };
export type CareerItem = { title: string; description: string };
export type FeeRow = { label: string; amount: string; note?: string };

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
