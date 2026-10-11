import type { Settings } from "@/lib/data/public";
import { absoluteUrl, stripHtml } from "@/lib/utils";

export function collegeJsonLd(s: Settings) {
  const sameAs = [s.facebookUrl, s.instagramUrl, s.youtubeUrl, s.xUrl, s.linkedinUrl].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    "@id": absoluteUrl("/#organization"),
    name: s.siteName,
    alternateName: s.shortName,
    url: absoluteUrl("/"),
    description: s.description,
    ...(s.established ? { foundingDate: String(s.established) } : {}),
    ...(s.logo ? { logo: s.logo.url } : {}),
    ...(s.phone ? { telephone: s.phone } : {}),
    ...(s.email ? { email: s.email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: s.addressLine,
      addressLocality: s.city,
      addressRegion: s.state,
      postalCode: s.postalCode,
      addressCountry: "IN",
    },
    parentOrganization: { "@type": "Organization", name: s.managedBy },
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: stripHtml(f.answer) },
    })),
  };
}

export function courseJsonLd(
  p: { name: string; summary: string; slug: string; duration: string | null; semesters: number | null },
  s: Settings,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: p.name,
    description: p.summary,
    url: absoluteUrl(`/programmes/${p.slug}`),
    provider: { "@type": "CollegeOrUniversity", name: s.siteName, sameAs: absoluteUrl("/") },
    ...(p.duration
      ? {
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "Onsite",
            location: `${s.addressLine}, ${s.district}, ${s.state}`,
            ...(p.semesters ? { courseWorkload: `${p.semesters} semesters` } : {}),
          },
        }
      : {}),
  };
}

export function eventJsonLd(
  e: { title: string; summary: string; slug: string; startsAt: Date; endsAt: Date | null; location: string | null; cover?: { url: string } | null },
  s: Settings,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.summary,
    startDate: e.startsAt.toISOString(),
    ...(e.endsAt ? { endDate: e.endsAt.toISOString() } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: absoluteUrl(`/events/${e.slug}`),
    ...(e.cover ? { image: [e.cover.url] } : {}),
    location: {
      "@type": "Place",
      name: e.location || s.siteName,
      address: { "@type": "PostalAddress", addressLocality: s.city, addressRegion: s.state, postalCode: s.postalCode, addressCountry: "IN" },
    },
    organizer: { "@type": "Organization", name: s.siteName, url: absoluteUrl("/") },
  };
}
