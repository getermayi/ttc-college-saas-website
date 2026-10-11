/**
 * Development only: creates clearly-labelled demo leads so you can try the CRM.
 *   npm run demo:leads          # add 40 demo leads
 *   npm run demo:leads -- --clear   # remove all demo leads
 * Refuses to run when NODE_ENV=production.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

if (process.env.NODE_ENV === "production") {
  console.error("✗ Refusing to create demo data in production.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const pick = <T>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];

async function main() {
  if (process.argv.includes("--clear")) {
    const res = await prisma.lead.deleteMany({ where: { name: { startsWith: "Demo Lead" } } });
    console.log(`✓ Removed ${res.count} demo leads`);
    return;
  }
  const bed = await prisma.programme.findUnique({ where: { slug: "bed" } });
  const stages = [
    "NEW",
    "NEW",
    "NEW",
    "CONTACTED",
    "CONTACTED",
    "ELIGIBLE",
    "APPLICATION_STARTED",
    "APPLICATION_SUBMITTED",
    "ENROLLED",
    "LOST",
    "NOT_ELIGIBLE",
  ] as const;
  const sources = [
    { source: "Meta Ads", utmSource: "facebook", utmMedium: "paid_social", utmCampaign: "demo-bed-2026" },
    { source: "Meta Ads", utmSource: "instagram", utmMedium: "paid_social", utmCampaign: "demo-bed-2026" },
    { source: "Google", utmSource: null, utmMedium: null, utmCampaign: null },
    { source: "Direct", utmSource: null, utmMedium: null, utmCampaign: null },
    { source: "WhatsApp", utmSource: "whatsapp", utmMedium: "share", utmCampaign: null },
  ];
  const districts = [
    "West Siang",
    "Lower Siang",
    "Siang",
    "East Siang",
    "Papum Pare",
    "Lepa Rada",
    "Upper Subansiri",
  ];
  for (let i = 1; i <= 40; i++) {
    const created = new Date(Date.now() - Math.random() * 28 * 86_400_000);
    const stage = pick(stages);
    const src = pick(sources);
    await prisma.lead.create({
      data: {
        name: `Demo Lead ${i}`,
        phone: `+9190000${String(10000 + i).slice(-5)}`,
        programmeId: bed?.id,
        programmeName: bed?.name,
        district: pick(districts),
        qualification: pick(["BACHELORS", "MASTERS", "BACHELORS_APPEARING"]),
        percentage: Math.round((45 + Math.random() * 35) * 10) / 10,
        category: pick(["ST", "ST", "GENERAL", "OBC"] as const),
        preferredTime: "Any time",
        consent: true,
        consentText: "Demo data",
        consentAt: created,
        createdAt: created,
        stage,
        stageChangedAt: created,
        lastContactedAt: stage === "NEW" ? null : new Date(created.getTime() + 86_400_000),
        lostReason:
          stage === "LOST" ? "Not reachable" : stage === "NOT_ELIGIBLE" ? "Marks below cut-off" : null,
        ...src,
        activities: { create: { type: "SYSTEM", body: "Demo lead created", createdAt: created } },
      },
    });
  }
  console.log("✓ Created 40 demo leads (names start with 'Demo Lead')");
}

main().finally(() => prisma.$disconnect());
