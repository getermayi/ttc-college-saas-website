"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarPlus, Check, Loader2, Mail, MessageCircle, Pencil, Phone, RotateCcw, Trash2 } from "lucide-react";
import { addFollowUp, addLeadActivity, assignLeads, completeFollowUp, deleteFollowUp, updateLeadDetails } from "@/lib/admin/lead-actions";
import { CALL_OUTCOMES, LEAD_STAGES, LEAD_STAGE_LABELS, type LeadStageValue } from "@/lib/constants";
import { cn, displayPhone, formatDateTime, telLink, timeAgo, whatsappLink } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StageBadge, useStageChanger } from "./leads-views";

type Activity = { id: string; type: string; body: string; outcome: string | null; author: string | null; createdAt: string };
type FollowUp = { id: string; dueAt: string; note: string | null; doneAt: string | null; assignedTo: string | null };

export function LeadActions({
  lead,
  staff,
}: {
  lead: { id: string; name: string; phone: string; email: string | null; stage: LeadStageValue; assignedToId: string | null; programme: string | null; district: string | null; percentage: number | null };
  staff: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const { change, dialog } = useStageChanger();
  const [editOpen, setEditOpen] = useState(false);
  const first = lead.name.split(" ")[0];
  const wa = whatsappLink(lead.phone.replace("+", ""), `Hello ${first}, this is the admissions team at TTC Aalo. Thank you for your enquiry about ${lead.programme ?? "admission"}. When is a good time to talk?`);

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Button asChild variant="soft">
            <a href={telLink(lead.phone)!}>
              <Phone aria-hidden /> Call
            </a>
          </Button>
          <Button asChild className="bg-[#1f7a4c] text-white hover:bg-[#19663f]">
            <a href={wa!} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden /> WhatsApp
            </a>
          </Button>
          <Button asChild variant="outline" disabled={!lead.email}>
            <a href={lead.email ? `mailto:${lead.email}` : undefined} aria-disabled={!lead.email}>
              <Mail aria-hidden /> Email
            </a>
          </Button>
        </div>
        <Field id="stage" label="Stage">
          <NativeSelect id="stage" value={lead.stage} onChange={(e) => change([lead.id], e.target.value as LeadStageValue)} className="h-11">
            {LEAD_STAGES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STAGE_LABELS[s]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="owner" label="Assigned to">
          <NativeSelect
            id="owner"
            className="h-11"
            value={lead.assignedToId ?? ""}
            disabled={pending}
            onChange={(e) =>
              start(async () => {
                const res = await assignLeads([lead.id], e.target.value || null);
                if (!res.ok) toast.error(res.message);
                else toast.success(res.message);
                router.refresh();
              })
            }
          >
            <option value="">Nobody</option>
            {staff.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil aria-hidden /> Edit contact details
        </Button>
      </CardContent>
      {dialog}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              start(async () => {
                const res = await updateLeadDetails(lead.id, {
                  name: String(fd.get("name")),
                  phone: String(fd.get("phone")),
                  email: String(fd.get("email") ?? ""),
                  district: String(fd.get("district") ?? ""),
                  percentage: String(fd.get("percentage") ?? ""),
                });
                if (!res.ok) return void toast.error(res.message);
                toast.success(res.message);
                setEditOpen(false);
                router.refresh();
              });
            }}
          >
            <DialogHeader>
              <DialogTitle>Edit contact details</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="e-name" label="Name">
                <Input id="e-name" name="name" defaultValue={lead.name} required />
              </Field>
              <Field id="e-phone" label="Phone">
                <Input id="e-phone" name="phone" defaultValue={lead.phone} required />
              </Field>
              <Field id="e-email" label="Email">
                <Input id="e-email" name="email" type="email" defaultValue={lead.email ?? ""} />
              </Field>
              <Field id="e-district" label="District">
                <Input id="e-district" name="district" defaultValue={lead.district ?? ""} />
              </Field>
              <Field id="e-pct" label="Marks (%)">
                <Input id="e-pct" name="percentage" type="number" step="0.01" defaultValue={lead.percentage ?? ""} />
              </Field>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

const TYPE_LABEL: Record<string, string> = { NOTE: "Note", CALL: "Call", WHATSAPP: "WhatsApp", EMAIL: "Email", STAGE_CHANGE: "Stage", ASSIGNMENT: "Assignment", SYSTEM: "System" };
const TYPE_DOT: Record<string, string> = { NOTE: "bg-info", CALL: "bg-primary", WHATSAPP: "bg-[#1f7a4c]", EMAIL: "bg-accent", STAGE_CHANGE: "bg-warning", ASSIGNMENT: "bg-muted-foreground", SYSTEM: "bg-border-strong" };

export function LeadTimeline({ leadId, activities }: { leadId: string; activities: Activity[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tab, setTab] = useState("CALL");
  const [body, setBody] = useState("");
  const [outcome, setOutcome] = useState<string>("");

  const submit = () =>
    start(async () => {
      const res = await addLeadActivity(leadId, { type: tab as "CALL", body, outcome: tab === "CALL" ? (outcome as (typeof CALL_OUTCOMES)[number]) : undefined });
      if (!res.ok) return void toast.error(res.message);
      toast.success(res.message);
      setBody("");
      setOutcome("");
      router.refresh();
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity & call log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="CALL">Log call</TabsTrigger>
            <TabsTrigger value="WHATSAPP">WhatsApp</TabsTrigger>
            <TabsTrigger value="NOTE">Note</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="space-y-3">
            {tab === "CALL" ? (
              <Field id="outcome" label="Outcome">
                <NativeSelect id="outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} className="h-11">
                  <option value="">Choose outcome…</option>
                  {CALL_OUTCOMES.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </NativeSelect>
              </Field>
            ) : null}
            <label htmlFor="activity-body" className="sr-only">
              Details
            </label>
            <Textarea id="activity-body" value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder={tab === "NOTE" ? "Write a note for the team…" : "What did you talk about? Any questions or next steps?"} />
            <Button onClick={submit} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null} Save {tab === "NOTE" ? "note" : "contact"}
            </Button>
          </TabsContent>
        </Tabs>
        <ol className="relative space-y-5 border-l border-border pl-5">
          {activities.map((a) => (
            <li key={a.id} className="relative">
              <span className={cn("absolute -left-[1.6rem] top-1.5 size-2.5 rounded-full ring-4 ring-surface", TYPE_DOT[a.type] ?? "bg-border-strong")} aria-hidden />
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{TYPE_LABEL[a.type] ?? a.type}</span> · {a.author ?? "System"} ·{" "}
                <time dateTime={a.createdAt} title={formatDateTime(a.createdAt)}>
                  {timeAgo(a.createdAt)}
                </time>
              </p>
              {a.outcome && a.outcome !== a.body ? <p className="mt-0.5 text-sm font-semibold">{a.outcome}</p> : null}
              <p className="mt-0.5 whitespace-pre-line text-sm">{a.body}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export function FollowUps({ leadId, items, staff, meId }: { leadId: string; items: FollowUp[]; staff: { value: string; label: string }[]; meId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [due, setDue] = useState("");
  const [note, setNote] = useState("");
  const [who, setWho] = useState(meId);
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.message);
      toast.success(res.message);
      after?.();
      router.refresh();
    });
  const quick = (hours: number) => {
    const d = new Date(Date.now() + hours * 3600_000);
    const ist = new Date(d.getTime() + 5.5 * 3600_000).toISOString().slice(0, 16);
    setDue(ist);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-up reminders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {items.map((f) => {
            const overdue = !f.doneAt && new Date(f.dueAt) < new Date();
            return (
              <li key={f.id} className={cn("flex items-start gap-2 rounded-xl border border-border p-3 text-sm", f.doneAt && "opacity-60", overdue && "border-danger/40 bg-danger-soft/40")}>
                <div className="min-w-0 flex-1">
                  <p className={cn("font-semibold", f.doneAt && "line-through")}>{formatDateTime(f.dueAt)}</p>
                  {f.note ? <p className="text-muted-foreground">{f.note}</p> : null}
                  <p className="text-xs text-muted-foreground">{f.assignedTo ?? "Unassigned"}{overdue ? " · overdue" : ""}</p>
                </div>
                <Button size="icon-sm" variant="ghost" aria-label={f.doneAt ? "Reopen" : "Mark done"} onClick={() => run(() => completeFollowUp(f.id, !f.doneAt))} disabled={pending}>
                  {f.doneAt ? <RotateCcw aria-hidden /> : <Check aria-hidden />}
                </Button>
                <Button size="icon-sm" variant="ghost" aria-label="Delete follow-up" className="text-danger" onClick={() => run(() => deleteFollowUp(f.id))} disabled={pending}>
                  <Trash2 aria-hidden />
                </Button>
              </li>
            );
          })}
          {!items.length ? <li className="text-sm text-muted-foreground">No reminders yet.</li> : null}
        </ul>
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex flex-wrap gap-1.5">
            {[
              ["In 2 hours", 2],
              ["Tomorrow", 24],
              ["In 3 days", 72],
              ["Next week", 168],
            ].map(([label, h]) => (
              <button key={label} type="button" onClick={() => quick(Number(h))} className="rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:bg-surface-2">
                {label}
              </button>
            ))}
          </div>
          <Field id="fu-due" label="When">
            <Input id="fu-due" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className="h-10" />
          </Field>
          <Field id="fu-note" label="What to do">
            <Input id="fu-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Ask if documents are ready" className="h-10" />
          </Field>
          {staff.length > 1 ? (
            <Field id="fu-who" label="Who">
              <NativeSelect id="fu-who" value={who} onChange={(e) => setWho(e.target.value)} className="h-10">
                {staff.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          ) : null}
          <Button
            variant="outline"
            disabled={pending || !due}
            onClick={() =>
              run(
                () => addFollowUp(leadId, { dueAt: due, note, assignedToId: who }),
                () => {
                  setDue("");
                  setNote("");
                },
              )
            }
          >
            <CalendarPlus aria-hidden /> Add reminder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { StageBadge };
