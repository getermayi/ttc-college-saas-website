// Fails the Vercel build early with a clear message when required settings are missing.
const missing = [];
if (!process.env.DATABASE_URL) missing.push("DATABASE_URL  → Vercel: Storage tab → Create Database → Neon → Connect, then Redeploy");
if (!process.env.AUTH_SECRET) missing.push("AUTH_SECRET   → Vercel: Settings → Environment Variables (any long random text)");
if (missing.length) {
  console.error("\n✗ The site can't be built yet. Missing settings:\n  - " + missing.join("\n  - ") + "\n");
  process.exit(1);
}
