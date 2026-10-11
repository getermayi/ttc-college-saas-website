# TTC Aalo — website & admin CMS

The website, admissions CRM and content management system for **Teacher Training College, Aalo**
(Bogdo, Aalo, West Siang, Arunachal Pradesh – 791001) — `ttcaalo.org.in`.

- **Public site:** mobile-first, fast on patchy 4G, WCAG 2.2 AA. Home, About, Programmes, Admissions (with an
  eligibility checker and printable document checklist), Notices, Faculty, Campus, Events, Gallery, Student life,
  Mandatory disclosures, Contact, Grievance form, privacy policy and any custom pages.
- **Enquiry system:** short form with Indian phone validation, consent capture, UTM/referrer attribution (for Meta
  Ads), spam protection, email alerts to the admissions team and an auto-reply to the student.
- **Admin (`/admin`):** dashboard, leads CRM (table + Kanban, notes, call log, follow-ups, bulk actions, CSV export,
  campaign cost-per-lead), grievance inbox, and a CMS for _everything_ on the public site — with drafts, preview,
  drag-to-reorder, version history with restore, an audit log, a media library with required alt text, roles and
  email invitations. Every save goes live instantly.

> **Data rule:** the seed contains only verified facts about TTC Aalo. Fees, dates, seat availability, testimonials
> and photos are left empty with clear admin prompts (see the _Website setup checklist_ on the dashboard). B.A. and
> B.Sc. are seeded with status **VERIFY** and never appear publicly until an admin sets them to **ACTIVE**.

---

## Tech stack

| Area         | Choice                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router, Server Components, Server Actions, Cache Components + Partial Prefetching), TypeScript strict |
| UI           | Tailwind CSS 4, shadcn-style components on Radix primitives, lucide-react                                             |
| Data         | PostgreSQL + Prisma 7 (driver adapter `@prisma/adapter-pg`)                                                           |
| Auth         | Auth.js v5 — email + password (bcrypt), optional Google, role-based access                                            |
| Forms        | React Hook Form + Zod (same schemas on client and server)                                                             |
| Rich text    | Tiptap 3 (sanitised server-side on save)                                                                              |
| Tables / DnD | TanStack Table v9, dnd-kit                                                                                            |
| Charts       | Recharts                                                                                                              |
| Media        | Cloudinary (local disk fallback in development), `next/image` AVIF/WebP with blur placeholders                        |
| Email        | Resend + React Email                                                                                                  |
| Security     | Upstash rate limiting, Cloudflare Turnstile, CSP + security headers, magic-byte upload checks                         |
| Analytics    | Vercel Analytics; GA4 / Meta Pixel load only after cookie consent                                                     |
| Quality      | ESLint, Prettier, Playwright smoke tests with axe accessibility checks                                                |

### Project structure

```
app/
  (public)/        Public pages (cached, statically prerendered)
  admin/           Admin login, invites and the signed-in shell
    (shell)/       Dashboard, leads, campaigns, grievances, content/[resource], settings, media, users, audit
  api/             Auth.js handler, admin upload endpoint
components/
  ui/              Design-system primitives (button, dialog, field…)
  site/            Public components (header, footer, forms, eligibility checker…)
  home/            Home page sections
  admin/           Admin components (resource form/list, CRM views, field editors)
emails/            React Email templates
lib/
  data/public.ts   Cached, tagged read layer for the public site
  admin/           Resource registry, server actions, audit/versioning, revalidation
  auth/            Session helpers and the role → capability matrix
  validation/      Shared Zod schemas
prisma/            Schema, migrations and the seed script
scripts/           create-admin, demo-leads
tests/e2e/         Playwright smoke tests
```

---

## Local setup

**Requirements:** Node.js 20.9+ (22 recommended), PostgreSQL 14+ (local, Docker, Neon or Supabase).

```bash
git clone <this repo> ttc-aalo && cd ttc-aalo
npm install                     # also generates the Prisma client
cp .env.example .env            # then fill in DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_SITE_URL
npx auth secret                 # or: openssl rand -base64 33  → paste into AUTH_SECRET
```

Quick local Postgres with Docker:

```bash
docker run -d --name ttc-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ttc -p 5432:5432 postgres:16
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ttc"
```

Create the tables and load the verified TTC data:

```bash
npm run db:migrate              # applies prisma/migrations
npm run db:seed                 # safe to run again; never overwrites admin edits
npm run dev                     # http://localhost:3000
```

### Creating the first Super Admin

Either set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` before `npm run db:seed`, or run:

```bash
npm run create-admin -- --email principal@ttcaalo.org.in --name "Your Name"
```

You will be asked for a password (at least 10 characters). Running it again for the same email resets the password.
Then sign in at **`/admin`** and invite everyone else from **Admin → Users**.

### Roles

| Role               | Can access                                                                       |
| ------------------ | -------------------------------------------------------------------------------- |
| Super Admin        | Everything, including managing other Super Admins                                |
| Admin              | Content, media, leads, grievances, settings, users (not Super Admins), audit log |
| Admissions Officer | Dashboard, leads and campaigns only                                              |
| Editor             | Dashboard, website content and media only                                        |

Invitations and password-reset links are emailed (and shown once to the admin so they can be shared on WhatsApp if
email isn't set up). They work once and expire after 72 hours.

### Useful scripts

| Command                                 | What it does                                                             |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                           | Start the dev server                                                     |
| `npm run build` / `start`               | Production build / serve                                                 |
| `npm run lint` / `typecheck` / `format` | Code quality                                                             |
| `npm run db:migrate`                    | Create/apply migrations in development                                   |
| `npm run db:deploy`                     | Apply migrations in production (CI / Vercel)                             |
| `npm run db:seed`                       | Load the verified TTC data                                               |
| `npm run db:studio`                     | Browse the database                                                      |
| `npm run create-admin`                  | Create or reset a Super Admin                                            |
| `npm run demo:leads`                    | Add 40 clearly-labelled demo leads (dev only; `-- --clear` removes them) |
| `npm run test:e2e`                      | Playwright smoke tests (run `npm run build` first)                       |

---

## Deploying to Vercel + Neon

### Quick deploy (no command line)

1. Vercel → **Add New → Project** → import this GitHub repository.
2. Before clicking **Deploy**, add these environment variables:
   - `AUTH_SECRET`: a long random string (for example from <https://generate-secret.vercel.app/32>)
   - `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`: your first Super Admin login (password: 10+ characters)
3. Click **Deploy**. The first build fails because there's no database yet — that's expected.
4. Project → **Storage → Create Database → Neon (Postgres)** → connect it to the project (all environments).
   This adds `DATABASE_URL` automatically.
5. **Deployments → ⋯ → Redeploy.** The build (`vercel.json` → `npm run vercel-build`) applies migrations, loads the
   verified TTC data (safe to repeat; never overwrites admin edits), creates the Super Admin if it doesn't exist,
   and builds the site.
6. Open the `.vercel.app` link, sign in at `/admin`, then remove `SEED_ADMIN_PASSWORD` from the environment variables.

The site URL defaults to the Vercel production domain; set `NEXT_PUBLIC_SITE_URL` once you connect `ttcaalo.org.in`.
Add Cloudinary keys before uploading photos (uploads are disabled in production without them).

### Manual setup

1. **Database.** Create a project at [neon.tech](https://neon.tech) (region: Singapore / `ap-southeast-1` is closest
   to Arunachal). Copy the **pooled** connection string.
2. **Import the repo** in Vercel (Framework: Next.js). Add the environment variables from `.env.example` —
   at minimum `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, plus Cloudinary for uploads. Resend, Turnstile and
   Upstash are strongly recommended for production.
3. **Build command.** Use `npm run db:deploy && npm run build` so migrations run on every deploy.
   The build reads content from the database to prerender pages, so the database must be reachable during the build.
4. **Seed once.** From your computer, with `DATABASE_URL` pointing at Neon:
   `npm run db:seed` and `npm run create-admin -- --email you@… --name "…"`.
5. Sign in at `https://<your-vercel-url>/admin`, then work through the **Website setup checklist** on the dashboard
   (phone, WhatsApp, admissions email, principal's message, photos, fees once confirmed…).

### Connecting the domain `ttcaalo.org.in`

1. Vercel → Project → **Settings → Domains** → add `ttcaalo.org.in` and `www.ttcaalo.org.in`
   (set one to redirect to the other).
2. At your domain registrar, add the DNS records Vercel shows — typically an `A` record for the apex
   (`76.76.21.21`) and a `CNAME` for `www` (`cname.vercel-dns.com`). Use exactly what Vercel displays.
3. Update `NEXT_PUBLIC_SITE_URL` to `https://ttcaalo.org.in` and redeploy.
4. In Resend, verify `ttcaalo.org.in` (SPF/DKIM records) so emails from `admissions@ttcaalo.org.in` are delivered.
5. If you use Google sign-in, add `https://ttcaalo.org.in/api/auth/callback/google` as a redirect URI.
6. Submit `https://ttcaalo.org.in/sitemap.xml` in Google Search Console.

---

## How content goes live

Public pages are prerendered and cached. Each data function in `lib/data/public.ts` is tagged (e.g. `notices`,
`programmes`); every admin save calls `updateTag(...)` for the affected tags, so the next visitor gets fresh content
immediately — no redeploy. Time-sensitive lists (notices with expiry dates, upcoming events) also refresh hourly.

- **Drafts & publishing:** most content has Draft / Published status. Programmes use Active / Verify / Draft / Archived.
- **Preview:** notices, pages, events and programmes have a preview link (staff only, never indexed).
- **Versions:** every save stores the previous version (last 30 kept); restore from the edit screen sidebar.
- **Audit log:** every save, publish, delete, upload, login-related change and lead update is recorded.
- **SEO:** per-page titles/descriptions/OG images in **Admin → SEO**; content items have their own SEO fields.

### Tracking Meta Ads leads

Tag ad links like
`https://ttcaalo.org.in/enquire?utm_source=facebook&utm_medium=paid_social&utm_campaign=bed-admissions-2026`.
The site remembers the tags for 30 days, stores them with the enquiry, and **Admin → Campaigns** shows leads,
enrolments, cost per lead and cost per enrolment once you enter the spend.

---

## Performance, accessibility and security notes

- Public pages are static HTML with small client islands; the enquiry form bundle (React Hook Form + Zod) loads only
  when it scrolls into view. Scroll-reveal uses CSS scroll-driven animations (no JS) and is disabled for
  `prefers-reduced-motion`. The display serif uses `font-display: optional` so slow connections never re-layout the
  headline. Maps load on tap.
- Local Lighthouse (mobile, DevTools 4G throttling, production build): Accessibility, Best Practices and SEO 96–100;
  Performance 86–93 with LCP ≈ 1.8–2.2 s. Expect higher Performance on Vercel's edge network; re-check with
  PageSpeed Insights after deploying.
- Playwright tests run axe-core (WCAG 2.0/2.1/2.2 A + AA) on 15 public pages.
- Every server action re-validates input with Zod and re-checks the user's role against the database. Passwords are
  bcrypt-hashed; invitation tokens are stored as SHA-256 hashes. Public forms have rate limits, a honeypot and
  Turnstile. Uploads are size-limited (4 MB) and type-checked by file signature. Rich text is sanitised on save.
  CSV exports neutralise spreadsheet formulas. Security headers include CSP, HSTS, `X-Frame-Options: DENY`.
- Leads store the exact consent text and time. Analytics and ad pixels load only after the visitor accepts cookies.

## Testing

```bash
npm run build
E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… npm run test:e2e
```

The tests start `next start` on port 3100 against the database in `DATABASE_URL`. They submit one enquiry (named
"E2E Test Student") and create/delete one notice — run them against a development or staging database.
