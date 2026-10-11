import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Navigation, Settings } from "@/lib/data/public";
import { telLink } from "@/lib/utils";
import { Logo } from "./logo";
import { MotifBand } from "./motif";
import { FacebookIcon, InstagramIcon, LinkedInIcon, XIcon, YouTubeIcon } from "./brand-icons";
import { CookieSettingsButton } from "./consent";
import { FooterYear } from "./footer-year";

export function SiteFooter({ settings: s, nav }: { settings: Settings; nav: Navigation }) {
  const socials = [
    { href: s.facebookUrl, label: "Facebook", Icon: FacebookIcon },
    { href: s.instagramUrl, label: "Instagram", Icon: InstagramIcon },
    { href: s.youtubeUrl, label: "YouTube", Icon: YouTubeIcon },
    { href: s.xUrl, label: "X (Twitter)", Icon: XIcon },
    { href: s.linkedinUrl, label: "LinkedIn", Icon: LinkedInIcon },
  ].filter((x) => x.href);

  const columns = [
    { title: "Explore", items: nav.explore },
    { title: "Students", items: nav.students },
  ];

  return (
    <footer className="relative mt-24 bg-[#12271e] pb-24 text-[#e9efe9] md:pb-0 dark:bg-[#0a120f]">
      <MotifBand tone="accent" className="opacity-80" />
      <div className="motif-texture-light">
        <div className="container-page grid gap-12 py-16 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo name={s.siteName} shortName={s.shortName} logo={s.logo} inverted />
            {s.footerAbout ? (
              <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-[#c9d6cd]">{s.footerAbout}</p>
            ) : null}
            <ul className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
              <li className="rounded-full border border-white/15 px-3 py-1">
                {s.affiliation.replace(/^Affiliated to /, "Affiliated: ")}
              </li>
              <li className="rounded-full border border-white/15 px-3 py-1">{s.recognition}</li>
            </ul>
            {socials.length ? (
              <ul className="mt-6 flex gap-2">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="grid size-10 place-items-center rounded-full bg-white/8 text-[#e9efe9] transition-colors hover:bg-white/15"
                    >
                      <Icon className="size-[1.1rem]" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {columns.map((col) =>
            col.items.length ? (
              <nav key={col.title} aria-label={col.title} className="md:col-span-2">
                <h2 className="font-sans text-sm font-semibold tracking-[0.14em] text-[#f0b597] uppercase">
                  {col.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        target={item.newTab ? "_blank" : undefined}
                        className="text-[0.95rem] text-[#c9d6cd] transition-colors hover:text-white"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null,
          )}

          <div className="md:col-span-3">
            <h2 className="font-sans text-sm font-semibold tracking-[0.14em] text-[#f0b597] uppercase">
              Visit or call
            </h2>
            <address className="mt-4 space-y-3 text-[0.95rem] text-[#c9d6cd] not-italic">
              <p className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#f0b597]" aria-hidden />
                <span>
                  {s.addressLine}, {s.district},<br />
                  {s.state} – {s.postalCode}
                </span>
              </p>
              {s.phone ? (
                <p className="flex gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-[#f0b597]" aria-hidden />
                  <a href={telLink(s.phone) ?? undefined} className="hover:text-white">
                    {s.phone}
                  </a>
                </p>
              ) : null}
              {s.email ? (
                <p className="flex gap-3">
                  <Mail className="mt-0.5 size-4 shrink-0 text-[#f0b597]" aria-hidden />
                  <a href={`mailto:${s.email}`} className="break-all hover:text-white">
                    {s.email}
                  </a>
                </p>
              ) : null}
              {s.officeHours ? (
                <p className="flex gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-[#f0b597]" aria-hidden />
                  <span>{s.officeHours}</span>
                </p>
              ) : null}
            </address>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="container-page flex flex-col gap-3 py-6 text-sm text-[#a9b9ae] md:flex-row md:items-center md:justify-between">
            <p>
              © <FooterYear /> {s.siteName}. Managed by {s.managedBy}.
              {s.footerNote ? (
                <span className="block md:inline md:before:content-['_·_']">{s.footerNote}</span>
              ) : null}
            </p>
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {nav.legal.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <CookieSettingsButton className="hover:text-white" />
              </li>
              <li>
                <Link href="/admin" className="hover:text-white" prefetch={false}>
                  Staff login
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
