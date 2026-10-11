import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content Security Policy. Next.js inlines small bootstrap scripts, so script-src needs
// 'unsafe-inline' unless every page is rendered dynamically with a nonce — which would
// remove static rendering and hurt speed on slow networks. Everything else is locked down.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com https://www.googletagmanager.com https://connect.facebook.net https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com",
  "font-src 'self' data:",
  "connect-src 'self' https://challenges.cloudflare.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com https://vitals.vercel-insights.com https://api.cloudinary.com",
  "frame-src 'self' https://challenges.cloudflare.com https://www.google.com https://maps.google.com https://www.youtube-nocookie.com",
  "media-src 'self' https://res.cloudinary.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  serverExternalPackages: ["sanitize-html"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 85],
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1600, 1920],
    minimumCacheTTL: 2678400,
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" }],
    localPatterns: [{ pathname: "/uploads/**" }, { pathname: "/images/**" }],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "motion"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/apply", destination: "/enquire", permanent: false },
      { source: "/programs", destination: "/programmes", permanent: true },
      { source: "/programs/:slug", destination: "/programmes/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
