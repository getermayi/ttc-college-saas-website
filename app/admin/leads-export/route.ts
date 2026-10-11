import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { buildLeadWhere, readFilters } from "@/lib/admin/lead-query";
import { audit } from "@/lib/admin/audit";
import {
  CATEGORY_LABELS,
  LEAD_STAGE_LABELS,
  QUALIFICATION_LABELS,
  type CategoryValue,
  type QualificationValue,
} from "@/lib/constants";

// Escapes a CSV cell and neutralises spreadsheet formula injection.
function cell(v: unknown) {
  let s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "leads")) return new Response("Unauthorized", { status: 401 });
  const url = new URL(request.url);
  const sp = Object.fromEntries(url.searchParams.entries());
  const ids = url.searchParams.get("ids")?.split(",").filter(Boolean).slice(0, 5000);
  const where = ids?.length ? { id: { in: ids } } : buildLeadWhere(readFilters(sp), user.id);
  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20000,
    include: { assignedTo: { select: { name: true } } },
  });

  const header = [
    "Created",
    "Name",
    "Phone",
    "Email",
    "Programme",
    "District",
    "Qualification",
    "Marks %",
    "Category",
    "Preferred time",
    "Stage",
    "Lost reason",
    "Assigned to",
    "Last contacted",
    "Source",
    "UTM source",
    "UTM medium",
    "UTM campaign",
    "UTM term",
    "UTM content",
    "Referrer",
    "Landing page",
    "Consent given at",
    "Message",
  ];
  const lines = leads.map((l) =>
    [
      l.createdAt,
      l.name,
      l.phone,
      l.email,
      l.programmeName,
      l.district,
      l.qualification ? (QUALIFICATION_LABELS[l.qualification as QualificationValue] ?? l.qualification) : "",
      l.percentage,
      l.category ? CATEGORY_LABELS[l.category as CategoryValue] : "",
      l.preferredTime,
      LEAD_STAGE_LABELS[l.stage],
      l.lostReason,
      l.assignedTo?.name,
      l.lastContactedAt,
      l.source,
      l.utmSource,
      l.utmMedium,
      l.utmCampaign,
      l.utmTerm,
      l.utmContent,
      l.referrer,
      l.landingPage,
      l.consentAt,
      l.message,
    ]
      .map(cell)
      .join(","),
  );
  await audit(user, "export", "lead", null, `Exported ${leads.length} lead(s) to CSV`);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(`﻿${[header.join(","), ...lines].join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ttc-aalo-leads-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
