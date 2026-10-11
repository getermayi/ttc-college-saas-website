export const TAGS = {
  settings: "settings",
  nav: "nav",
  sections: "sections",
  seo: "seo",
  pages: "pages",
  programmes: "programmes",
  admissionDates: "admission-dates",
  eligibility: "eligibility",
  notices: "notices",
  faculty: "faculty",
  facilities: "facilities",
  events: "events",
  albums: "albums",
  testimonials: "testimonials",
  faqs: "faqs",
  downloads: "downloads",
  media: "media",
} as const;

export type CacheTag = (typeof TAGS)[keyof typeof TAGS];
export const ALL_TAGS = Object.values(TAGS) as CacheTag[];
