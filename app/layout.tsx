import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/toaster";
import { getSettings } from "@/lib/data/public";
import { absoluteUrl } from "@/lib/utils";
import { BrandColors } from "@/components/site/brand-colors";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "opsz"],
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(absoluteUrl("/")),
    title: { default: s.siteName, template: `%s · ${s.shortName}` },
    description: s.description,
    applicationName: s.shortName,
    formatDetection: { telephone: false },
    icons: s.favicon ? { icon: s.favicon.url, apple: s.favicon.url } : undefined,
    openGraph: { siteName: s.siteName, locale: "en_IN", type: "website" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf7f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1613" },
  ],
};

// Sets the theme class before first paint to avoid a light/dark flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <BrandColors />
      </head>
      <body className="min-h-dvh">
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
