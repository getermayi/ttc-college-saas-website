"use client";

import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { DataTable } from "./data-table";

type Row = { id: string; createdAt: string; user: string | null; action: string; entityType: string; summary: string };

const TONES: Record<string, "success" | "info" | "danger" | "warning" | "neutral"> = {
  create: "success",
  update: "info",
  delete: "danger",
  restore: "warning",
  status: "info",
  upload: "success",
  stage: "info",
};

export function AuditTable({ rows }: { rows: Row[] }) {
  return (
    <DataTable
      rows={rows}
      columns={[
        { id: "when", header: "When", cell: (r) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(r.createdAt)}</span> },
        { id: "who", header: "Who", cell: (r) => <span className="font-medium">{r.user ?? "System / public"}</span> },
        { id: "action", header: "Action", cell: (r) => <Badge tone={TONES[r.action] ?? "neutral"}>{r.action}</Badge> },
        { id: "type", header: "Type", cell: (r) => <span className="text-muted-foreground">{r.entityType}</span> },
        { id: "summary", header: "What changed", cell: (r) => r.summary },
      ]}
      empty="No activity yet."
    />
  );
}
