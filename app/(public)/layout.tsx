import { getNavigation, getSettings } from "@/lib/data/public";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { AnnouncementBar } from "@/components/site/announcement-bar";
import { MobileActionBar, WhatsAppFloat } from "@/components/site/mobile-action-bar";
import { ConsentAndAnalytics } from "@/components/site/consent";
import { UtmCapture } from "@/components/site/utm-capture";
import { Logo } from "@/components/site/logo";
import { JsonLd } from "@/components/site/json-ld";
import { collegeJsonLd } from "@/lib/structured-data";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const [settings, nav] = await Promise.all([getSettings(), getNavigation()]);
  return (
    <>
      <a
        href="#main"
        className="bg-primary text-primary-foreground sr-only z-[60] rounded-full px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>
      <AnnouncementBar settings={settings} />
      <SiteHeader
        logo={<Logo name={settings.siteName} shortName={settings.shortName} logo={settings.logo} />}
        nav={nav.header}
        phone={settings.phone}
        admissionsOpen={settings.admissionsOpen}
        admissionsBadge={settings.admissionsBadge}
      />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter settings={settings} nav={nav} />
      <MobileActionBar
        phone={settings.phone}
        whatsapp={settings.whatsappNumber}
        whatsappMessage={settings.whatsappMessage}
      />
      <WhatsAppFloat whatsapp={settings.whatsappNumber} message={settings.whatsappMessage} />
      <ConsentAndAnalytics gaId={settings.gaMeasurementId} pixelId={settings.metaPixelId} />
      <UtmCapture />
      <JsonLd data={collegeJsonLd(settings)} />
    </>
  );
}
