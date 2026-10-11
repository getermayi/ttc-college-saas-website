import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth/session";
import { GRIEVANCE_STATUS_LABELS } from "@/lib/constants";
import { displayPhone, formatDateTime } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GrievanceUpdateForm } from "@/components/admin/grievance-form";

export const instant = false;
export const metadata = { title: "Grievance" };

export default async function GrievancePage({ params }: PageProps<"/admin/grievances/[id]">) {
  await requireCapability("grievances");
  const { id } = await params;
  const [g, staff] = await Promise.all([
    prisma.grievance.findUnique({ where: { id } }),
    prisma.user.findMany({ where: { active: true, role: { in: ["SUPER_ADMIN", "ADMIN"] } }, select: { id: true, name: true } }),
  ]);
  if (!g) notFound();
  return (
    <>
      <AdminPageHeader back={{ href: "/admin/grievances", label: "Grievances" }} title={g.subject} description={<span className="inline-flex items-center gap-2"><span className="font-mono text-sm">{g.ticket}</span><Badge>{GRIEVANCE_STATUS_LABELS[g.status]}</Badge></span>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>
              {g.category} · from {g.anonymous ? "an anonymous person" : (g.name ?? "—")} ({g.role})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="whitespace-pre-line leading-relaxed">{g.description}</p>
            <dl className="grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Received</dt>
                <dd className="font-medium">{formatDateTime(g.createdAt)}</dd>
              </div>
              {!g.anonymous ? (
                <>
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="font-medium">{g.phone ? <a href={`tel:${g.phone}`}>{displayPhone(g.phone)}</a> : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="break-all font-medium">{g.email ? <a href={`mailto:${g.email}?subject=${encodeURIComponent(`Your grievance ${g.ticket}`)}`}>{g.email}</a> : "—"}</dd>
                  </div>
                </>
              ) : null}
              {g.resolvedAt ? (
                <div>
                  <dt className="text-muted-foreground">Resolved</dt>
                  <dd className="font-medium">{formatDateTime(g.resolvedAt)}</dd>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <GrievanceUpdateForm id={g.id} status={g.status} resolution={g.resolution ?? ""} internalNotes={g.internalNotes ?? ""} assignedToId={g.assignedToId ?? ""} staff={staff.map((s) => ({ value: s.id, label: s.name }))} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
