import type { Metadata } from "next";
import {
  getActiveProgrammes,
  getFaqs,
  getHomeGallery,
  getNotices,
  getSections,
  getSettings,
  getTestimonials,
  sectionByKey,
  type SectionData,
} from "@/lib/data/public";
import { buildMetadata } from "@/lib/seo";
import {
  CampusSection,
  CtaBand,
  FaqSection,
  Hero,
  NoticesSection,
  PrincipalSection,
  ProgrammesSection,
  Stats,
  TestimonialsSection,
  TrustStrip,
  WhySection,
} from "@/components/home/home-sections";
import { JsonLd } from "@/components/site/json-ld";
import { faqJsonLd } from "@/lib/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/" });
}

export default async function HomePage() {
  const [sections, settings, programmes, notices, faqs, testimonials, gallery] = await Promise.all([
    getSections("home"),
    getSettings(),
    getActiveProgrammes(),
    getNotices(),
    getFaqs(),
    getTestimonials(),
    getHomeGallery(),
  ]);

  const render = (s: SectionData) => {
    switch (s.key) {
      case "home.hero":
        return <Hero key={s.key} section={s} settings={settings} programmes={programmes} />;
      case "home.trust":
        return <TrustStrip key={s.key} section={s} />;
      case "home.stats":
        return <Stats key={s.key} section={s} />;
      case "home.programmes":
        return <ProgrammesSection key={s.key} section={s} programmes={programmes} />;
      case "home.why":
        return <WhySection key={s.key} section={s} />;
      case "home.campus":
        return <CampusSection key={s.key} section={s} images={gallery} />;
      case "home.principal":
        return <PrincipalSection key={s.key} section={s} settings={settings} />;
      case "home.notices":
        return <NoticesSection key={s.key} section={s} notices={notices} />;
      case "home.testimonials":
        return <TestimonialsSection key={s.key} section={s} testimonials={testimonials} />;
      case "home.faq":
        return <FaqSection key={s.key} section={s} faqs={faqs} />;
      case "home.cta":
        return <CtaBand key={s.key} section={s} />;
      default:
        return null;
    }
  };

  const homeFaqs = sectionByKey(sections, "home.faq") ? faqs.filter((f) => f.showOnHome).slice(0, 6) : [];

  return (
    <>
      {sections.filter((s) => s.enabled).map(render)}
      {homeFaqs.length ? <JsonLd data={faqJsonLd(homeFaqs)} /> : null}
    </>
  );
}
