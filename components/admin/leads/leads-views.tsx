"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { DndContext, PointerSensor, KeyboardSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { toast } from "sonner";
import { AlarmClock, Download, Kanban, MessageCircle, Phone, Search, Table2, Trash2, UserPlus, X } from "lucide-react";
import type { RowSelectionState } from "@tanstack/react-table";
import { changeLeadStage, assignLeads, deleteLeads } from "@/lib/admin/lead-actions";
import { LEAD_STAGES, LEAD_STAGE_LABELS, LEAD_STAGE_TONES, LOST_REASONS, CATEGORY_LABELS, type LeadStageValue, type CategoryValue } from "@/lib/constants";
import { cn, displayPhone, formatDateTime, telLink, timeAgo, whatsappLink } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { DataTable } from "../data-table";

export type LeadRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  programme: string | null;
  district: string | null;
  percentage: number | null;
  category: string | null;
  stage: LeadStageValue;
  source: string;
  utmCampaign: string | null;
  assignedTo: string | null;
  createdAt: string;
  lastContactedAt: string | null;
  stale: boolean;
  nextFollowUp: string | null;
};

type Opt = { value: string; label: string };

export function StageBadge({ stage }: { stage: LeadStageValue }) {
  return <Badge tone={LEAD_STAGE_TONES[stage] as "info"}>{LEAD_STAGE_LABELS[stage]}</Badge>;
}

// ── Lost-reason prompt ──────────────────────────────────────

export function useStageChanger() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [ask, setAsk] = useState<{ ids: string[]; stage: LeadStageValue } | null>(null);
  const [reason, setReason] = useState<string>(LOST_REASONS[0]);
  const [other, setOther] = useState("");

  const apply = (ids: string[], stage: LeadStageValue, why?: string, onDone?: () => void) =>
    start(async () => {
      const res = await changeLeadStage(ids, stage, why);
      if (!res.ok) toast.error(res.message);
      else toast.success(res.message);
      onDone?.();
      router.refresh();
    });

  const change = (ids: string[], stage: LeadStageValue, onDone?: () => void) => {
    if (stage === "LOST" || stage === "NOT_ELIGIBLE") {
      setReason(stage === "NOT_ELIGIBLE" ? "Does not meet eligibility" : LOST_REASONS[0]);
      setOther("");
      setAsk({ ids, stage });
      return;
    }
    apply(ids, stage, undefined, onDone);
  };

  const dialog = (
    <Dialog open={ask !== null} onOpenChange={(o) => !o && setAsk(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ask?.stage === "LOST" ? "Why was this lead lost?" : "Why is this lead not eligible?"}</DialogTitle>
          <DialogDescription>The reason helps you improve your outreach.</DialogDescription>
        </DialogHeader>
        {ask?.stage === "LOST" ? (
          <Field id="lost-reason" label="Reason">
            <NativeSelect id="lost-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
              {LOST_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </NativeSelect>
          </Field>
        ) : null}
        {ask?.stage === "NOT_ELIGIBLE" || reason === "Other" ? (
          <Field id="lost-other" label="Details" className="mt-4">
            <Input id="lost-other" value={other} onChange={(e) => setOther(e.target.value)} placeholder={ask?.stage === "NOT_ELIGIBLE" ? "e.g. Marks below 50% (General)" : "Add a short reason"} />
          </Field>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => setAsk(null)}>
            Cancel
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              const why = ask!.stage === "NOT_ELIGIBLE" ? other || reason : reason === "Other" ? other : reason;
              if (!why.trim()) return void toast.error("Please add a reason.");
              apply(ask!.ids, ask!.stage, why);
              setAsk(null);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  return { change, dialog, pending };
}

// ── Toolbar ─────────────────────────────────────────────────

export function LeadsToolbar({ programmes, sources, campaigns, staff, view }: { programmes: Opt[]; sources: string[]; campaigns: string[]; staff: Opt[]; view: "table" | "board" }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const set = (k: string, v: string | null) => {
    const sp = new URLSearchParams(params.toString());
    if (v) sp.set(k, v);
    else sp.delete(k);
    sp.delete("page");
    router.push(`${pathname}?${sp.toString()}`);
  };
  const exportHref = `/admin/leads-export?${(() => {
    const sp = new URLSearchParams(params.toString());
    sp.delete("view");
    sp.delete("page");
    return sp.toString();
  })()}`;
  const active = ["q", "stage", "programme", "source", "campaign", "assigned", "stale", "from", "to"].some((k) => params.get(k));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="View" className="inline-flex rounded-full border border-border bg-surface-2 p-1">
          <button type="button" aria-pressed={view === "table"} onClick={() => set("view", null)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-semibold", view === "table" ? "bg-surface shadow-[var(--shadow-soft)]" : "text-muted-foreground")}>
            <Table2 className="size-4" aria-hidden /> Table
          </button>
          <button type="button" aria-pressed={view === "board"} onClick={() => set("view", "board")} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-semibold", view === "board" ? "bg-surface shadow-[var(--shadow-soft)]" : "text-muted-foreground")}>
            <Kanban className="size-4" aria-hidden /> Board
          </button>
        </div>
        <form
          role="search"
          className="relative min-w-56 flex-1 sm:max-w-xs"
          onSubmit={(e) => {
            e.preventDefault();
            set("q", q.trim() || null);
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input aria-label="Search leads" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone, email…" className="h-10 pl-9" />
        </form>
        <Button asChild variant={params.get("stale") ? "primary" : "outline"} size="sm">
          <button type="button" onClick={() => set("stale", params.get("stale") ? null : "1")}>
            <AlarmClock aria-hidden /> No contact in 48h
          </button>
        </Button>
        <span className="flex-1" />
        <Button asChild variant="outline" size="sm">
          <a href={exportHref}>
            <Download aria-hidden /> Export CSV
          </a>
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {view === "table" ? (
          <NativeSelect aria-label="Stage" className="h-9 w-44 text-sm" value={params.get("stage") ?? ""} onChange={(e) => set("stage", e.target.value || null)}>
            <option value="">All stages</option>
            <option value="OPEN">All open</option>
            {LEAD_STAGES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STAGE_LABELS[s]}
              </option>
            ))}
          </NativeSelect>
        ) : null}
        <NativeSelect aria-label="Programme" className="h-9 w-44 text-sm" value={params.get("programme") ?? ""} onChange={(e) => set("programme", e.target.value || null)}>
          <option value="">All programmes</option>
          {programmes.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="Source" className="h-9 w-44 text-sm" value={params.get("source") ?? ""} onChange={(e) => set("source", e.target.value || null)}>
          <option value="">All sources</option>
          {sources.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </NativeSelect>
        {campaigns.length ? (
          <NativeSelect aria-label="Campaign" className="h-9 w-44 text-sm" value={params.get("campaign") ?? ""} onChange={(e) => set("campaign", e.target.value || null)}>
            <option value="">All campaigns</option>
            {campaigns.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </NativeSelect>
        ) : null}
        <NativeSelect aria-label="Assigned to" className="h-9 w-44 text-sm" value={params.get("assigned") ?? ""} onChange={(e) => set("assigned", e.target.value || null)}>
          <option value="">Anyone</option>
          <option value="me">Assigned to me</option>
          <option value="none">Unassigned</option>
          {staff.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </NativeSelect>
        <Input aria-label="From date" type="date" className="h-9 w-40 text-sm" value={params.get("from") ?? ""} onChange={(e) => set("from", e.target.value || null)} />
        <Input aria-label="To date" type="date" className="h-9 w-40 text-sm" value={params.get("to") ?? ""} onChange={(e) => set("to", e.target.value || null)} />
        {active ? (
          <Button variant="ghost" size="sm" onClick={() => router.push(`${pathname}${view === "board" ? "?view=board" : ""}`)}>
            <X aria-hidden /> Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// ── Table view ──────────────────────────────────────────────

export function LeadsTable({ rows, staff, canDelete }: { rows: LeadRow[]; staff: Opt[]; canDelete: boolean }) {
  const router = useRouter();
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [pending, start] = useTransition();
  const { change, dialog } = useStageChanger();
  useEffect(() => setSelection({}), [rows]);
  const ids = Object.keys(selection).filter((k) => selection[k]);

  const columns = useMemo(
    () => [
      {
        id: "name",
        header: "Lead",
        cell: (r: LeadRow) => (
          <Link href={`/admin/leads/${r.id}`} className="group block">
            <span className="flex items-center gap-2 whitespace-nowrap font-semibold group-hover:text-primary group-hover:underline">
              {r.name}
              {r.stale ? (
                <span title="No contact in 48 hours" className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-1.5 text-[0.7rem] font-semibold text-danger-soft-foreground">
                  <AlarmClock className="size-3" aria-hidden /> 48h+
                </span>
              ) : null}
            </span>
            <span className="text-xs text-muted-foreground">{displayPhone(r.phone)}</span>
          </Link>
        ),
      },
      { id: "programme", header: "Programme", cell: (r: LeadRow) => <span className="text-muted-foreground">{r.programme ?? "—"}</span> },
      {
        id: "profile",
        header: "Profile",
        cell: (r: LeadRow) => (
          <span className="text-xs leading-relaxed text-muted-foreground">
            {[r.district, r.percentage !== null ? `${r.percentage}%` : null, r.category ? CATEGORY_LABELS[r.category as CategoryValue] : null].filter(Boolean).join(" · ") || "—"}
          </span>
        ),
      },
      { id: "stage", header: "Stage", cell: (r: LeadRow) => <StageBadge stage={r.stage} /> },
      {
        id: "source",
        header: "Source",
        cell: (r: LeadRow) => (
          <span className="text-xs">
            <span className="font-medium">{r.source}</span>
            {r.utmCampaign ? <span className="block text-muted-foreground">{r.utmCampaign}</span> : null}
          </span>
        ),
      },
      { id: "owner", header: "Owner", cell: (r: LeadRow) => <span className="text-muted-foreground">{r.assignedTo ?? "—"}</span> },
      {
        id: "created",
        header: "Received",
        cell: (r: LeadRow) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground" title={formatDateTime(r.createdAt)}>
            {timeAgo(r.createdAt)}
            {r.nextFollowUp ? <span className="block text-accent">Follow up {formatDateTime(r.nextFollowUp)}</span> : null}
          </span>
        ),
      },
      {
        id: "quick",
        header: "Quick contact",
        srOnlyHeader: true,
        cell: (r: LeadRow) => (
          <span className="flex justify-end gap-1">
            <Button asChild size="icon-sm" variant="ghost" aria-label={`Call ${r.name}`}>
              <a href={telLink(r.phone)!}>
                <Phone aria-hidden />
              </a>
            </Button>
            <Button asChild size="icon-sm" variant="ghost" aria-label={`WhatsApp ${r.name}`}>
              <a href={whatsappLink(r.phone.replace("+", ""), `Hello ${r.name.split(" ")[0]}, this is the admissions team at TTC Aalo. Thank you for your enquiry about ${r.programme ?? "admission"}.`)!} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden />
              </a>
            </Button>
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-3">
      {ids.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-primary-soft px-4 py-2.5 text-sm text-primary-soft-foreground">
          <span className="font-semibold">{ids.length} selected</span>
          <span className="flex-1" />
          <NativeSelect aria-label="Move selected to stage" className="h-9 w-48 text-sm" value="" onChange={(e) => e.target.value && change(ids, e.target.value as LeadStageValue, () => setSelection({}))}>
            <option value="">Move to stage…</option>
            {LEAD_STAGES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STAGE_LABELS[s]}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label="Assign selected"
            className="h-9 w-44 text-sm"
            value=""
            onChange={(e) =>
              e.target.value &&
              start(async () => {
                const res = await assignLeads(ids, e.target.value === "none" ? null : e.target.value);
                if (!res.ok) toast.error(res.message);
                else toast.success(res.message);
                setSelection({});
                router.refresh();
              })
            }
          >
            <option value="">Assign to…</option>
            <option value="none">Nobody</option>
            {staff.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </NativeSelect>
          <Button asChild size="sm" variant="outline">
            <a href={`/admin/leads-export?ids=${ids.join(",")}`}>
              <Download aria-hidden /> Export
            </a>
          </Button>
          {canDelete ? (
            <ConfirmDialog
              title={`Delete ${ids.length} lead(s)?`}
              description="This permanently removes the leads, their notes and follow-ups. Export them first if you need a record."
              onConfirm={() =>
                start(async () => {
                  const res = await deleteLeads(ids);
                  if (!res.ok) toast.error(res.message);
                  else toast.success(res.message);
                  router.refresh();
                })
              }
              trigger={
                <Button size="sm" variant="danger" disabled={pending}>
                  <Trash2 aria-hidden /> Delete
                </Button>
              }
            />
          ) : null}
        </div>
      ) : null}
      <DataTable rows={rows} columns={columns} selection={selection} onSelectionChange={setSelection} minWidth="64rem" empty="No leads match these filters." />
      {dialog}
      {staff.length === 0 ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <UserPlus className="size-4" aria-hidden /> Invite Admissions Officers in Users to assign leads.
        </p>
      ) : null}
    </div>
  );
}

// ── Board (Kanban) view ─────────────────────────────────────

function LeadCard({ lead }: { lead: LeadRow }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id, data: { stage: lead.stage } });
  return (
    <li
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={cn("touch-none rounded-xl border border-border bg-surface p-3 shadow-[var(--shadow-soft)]", isDragging && "relative z-20 rotate-1 shadow-[var(--shadow-float)]")}
      {...attributes}
      {...listeners}
      aria-roledescription="Draggable lead"
    >
      <Link href={`/admin/leads/${lead.id}`} className="font-semibold hover:text-primary hover:underline" onPointerDown={(e) => e.stopPropagation()}>
        {lead.name}
      </Link>
      <p className="text-xs text-muted-foreground">{displayPhone(lead.phone)}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[0.7rem]">
        {lead.programme ? <span className="rounded-full bg-surface-2 px-2 py-0.5 font-medium">{lead.programme.replace(/\s*\(.*\)/, "")}</span> : null}
        <span className="rounded-full bg-surface-2 px-2 py-0.5">{lead.source}</span>
        {lead.stale ? <span className="rounded-full bg-danger-soft px-2 py-0.5 font-semibold text-danger-soft-foreground">48h+</span> : null}
      </div>
      <p className="mt-2 text-[0.7rem] text-muted-foreground">
        {timeAgo(lead.createdAt)}
        {lead.assignedTo ? ` · ${lead.assignedTo}` : ""}
      </p>
    </li>
  );
}

function Column({ stage, leads }: { stage: LeadStageValue; leads: LeadRow[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <section aria-label={LEAD_STAGE_LABELS[stage]} className={cn("flex w-72 shrink-0 flex-col rounded-2xl border border-border bg-surface-2/50 transition-colors", isOver && "border-primary bg-primary-soft/60")}>
      <header className="flex items-center justify-between px-3 py-2.5">
        <StageBadge stage={stage} />
        <span className="text-xs font-semibold text-muted-foreground">{leads.length}</span>
      </header>
      <ul ref={setNodeRef} className="flex min-h-40 flex-1 flex-col gap-2 p-2">
        {leads.map((l) => (
          <LeadCard key={l.id} lead={l} />
        ))}
      </ul>
    </section>
  );
}

export function LeadsBoard({ rows }: { rows: LeadRow[] }) {
  const [items, setItems] = useState(rows);
  useEffect(() => setItems(rows), [rows]);
  const { change, dialog } = useStageChanger();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  function onDragEnd(e: DragEndEvent) {
    const to = e.over?.id as LeadStageValue | undefined;
    const lead = items.find((l) => l.id === e.active.id);
    if (!to || !lead || lead.stage === to) return;
    if (to !== "LOST" && to !== "NOT_ELIGIBLE") setItems((prev) => prev.map((l) => (l.id === lead.id ? { ...l, stage: to } : l)));
    change([lead.id], to);
  }

  return (
    <>
      <p className="mb-3 text-sm text-muted-foreground">Drag a card to another column to change its stage. Closed leads older than 60 days are hidden from the board.</p>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8">
          {LEAD_STAGES.map((s) => (
            <Column key={s} stage={s} leads={items.filter((l) => l.stage === s)} />
          ))}
        </div>
      </DndContext>
      {dialog}
    </>
  );
}
