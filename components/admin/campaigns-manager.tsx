"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteCampaign, saveCampaign } from "@/lib/admin/lead-actions";
import { formatRupees } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/alert-dialog";

export type CampaignRow = {
  id: string | null;
  name: string;
  utmCampaign: string;
  channel: string;
  spend: number | null;
  startDate: string;
  endDate: string;
  notes: string;
  leads: number;
  contacted: number;
  enrolled: number;
};

export function CampaignsManager({ rows }: { rows: CampaignRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<CampaignRow | null>(null);
  const blank: CampaignRow = { id: null, name: "", utmCampaign: "", channel: "Meta Ads", spend: null, startDate: "", endDate: "", notes: "", leads: 0, contacted: 0, enrolled: 0 };
  const totals = rows.reduce((a, r) => ({ spend: a.spend + (r.spend ?? 0), leads: a.leads + r.leads, enrolled: a.enrolled + r.enrolled }), { spend: 0, leads: 0, enrolled: 0 });

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing(blank)}>
          <Plus aria-hidden /> Add campaign
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="border-b border-border bg-surface-2/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">Campaign</th>
              <th scope="col" className="px-4 py-3 text-right">Spend</th>
              <th scope="col" className="px-4 py-3 text-right">Leads</th>
              <th scope="col" className="px-4 py-3 text-right">Cost / lead</th>
              <th scope="col" className="px-4 py-3 text-right">Contacted</th>
              <th scope="col" className="px-4 py-3 text-right">Enrolled</th>
              <th scope="col" className="px-4 py-3 text-right">Cost / enrolment</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((r) => (
              <tr key={r.utmCampaign} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <span className="block font-semibold">{r.name || r.utmCampaign}</span>
                  <span className="text-xs text-muted-foreground">
                    {r.channel} · utm_campaign=<code>{r.utmCampaign}</code>
                  </span>
                  {!r.id ? <span className="mt-1 block text-xs font-semibold text-warning">Found in leads — add spend to track cost</span> : null}
                </td>
                <td className="px-4 py-3 text-right">{r.spend !== null ? formatRupees(r.spend) : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/leads?campaign=${encodeURIComponent(r.utmCampaign)}`} className="font-semibold text-primary hover:underline">
                    {r.leads}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-semibold">{r.spend !== null && r.leads ? formatRupees(r.spend / r.leads) : "—"}</td>
                <td className="px-4 py-3 text-right">{r.contacted}</td>
                <td className="px-4 py-3 text-right">{r.enrolled}</td>
                <td className="px-4 py-3 text-right">{r.spend !== null && r.enrolled ? formatRupees(r.spend / r.enrolled) : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="icon-sm" variant="ghost" aria-label={`Edit ${r.name || r.utmCampaign}`} onClick={() => setEditing(r)}>
                      <Pencil aria-hidden />
                    </Button>
                    {r.id ? (
                      <ConfirmDialog
                        title="Delete this campaign?"
                        description="Only the spend record is deleted. Leads stay in the CRM."
                        onConfirm={() =>
                          start(async () => {
                            const res = await deleteCampaign(r.id!);
                            if (!res.ok) toast.error(res.message);
                            else toast.success(res.message);
                            router.refresh();
                          })
                        }
                        trigger={
                          <Button size="icon-sm" variant="ghost" className="text-danger" aria-label="Delete campaign" disabled={pending}>
                            <Trash2 aria-hidden />
                          </Button>
                        }
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length ? (
            <tfoot className="border-t border-border bg-surface-2/40 font-semibold tabular-nums">
              <tr>
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right">{formatRupees(totals.spend)}</td>
                <td className="px-4 py-3 text-right">{totals.leads}</td>
                <td className="px-4 py-3 text-right">{totals.leads && totals.spend ? formatRupees(totals.spend / totals.leads) : "—"}</td>
                <td />
                <td className="px-4 py-3 text-right">{totals.enrolled}</td>
                <td className="px-4 py-3 text-right">{totals.enrolled && totals.spend ? formatRupees(totals.spend / totals.enrolled) : "—"}</td>
                <td />
              </tr>
            </tfoot>
          ) : null}
        </table>
        {!rows.length ? <p className="px-6 py-14 text-center text-muted-foreground">No campaigns yet. Tag your ad links with utm_campaign and add the spend here.</p> : null}
      </div>
      <section className="mt-6 rounded-2xl border border-border bg-surface-2/50 p-5 text-sm">
        <h2 className="font-semibold">How to tag your Meta Ads links</h2>
        <p className="mt-1 text-muted-foreground">Use this as the website URL in your ad. Leads are matched to campaigns by the utm_campaign value.</p>
        <code className="mt-3 block overflow-x-auto rounded-xl bg-surface p-3 text-xs">
          https://ttcaalo.org.in/enquire?utm_source=facebook&amp;utm_medium=paid_social&amp;utm_campaign=bed-admissions-2026
        </code>
      </section>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                start(async () => {
                  const res = await saveCampaign(editing.id, {
                    name: String(fd.get("name")),
                    utmCampaign: String(fd.get("utmCampaign")),
                    channel: String(fd.get("channel")),
                    spend: String(fd.get("spend") ?? ""),
                    startDate: String(fd.get("startDate") ?? ""),
                    endDate: String(fd.get("endDate") ?? ""),
                    notes: String(fd.get("notes") ?? ""),
                  });
                  if (!res.ok) return void toast.error(res.message);
                  toast.success(res.message);
                  setEditing(null);
                  router.refresh();
                });
              }}
            >
              <DialogHeader>
                <DialogTitle>{editing.id ? "Edit campaign" : "Add campaign"}</DialogTitle>
                <DialogDescription>Enter the total amount spent so far. Cost per lead updates automatically.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="c-name" label="Name" required className="sm:col-span-2">
                  <Input id="c-name" name="name" defaultValue={editing.name || editing.utmCampaign} required />
                </Field>
                <Field id="c-utm" label="utm_campaign" required>
                  <Input id="c-utm" name="utmCampaign" defaultValue={editing.utmCampaign} required className="font-mono" />
                </Field>
                <Field id="c-channel" label="Channel">
                  <Input id="c-channel" name="channel" defaultValue={editing.channel} />
                </Field>
                <Field id="c-spend" label="Total spend (₹)">
                  <Input id="c-spend" name="spend" type="number" min={0} step="1" defaultValue={editing.spend ?? ""} />
                </Field>
                <span />
                <Field id="c-start" label="Start date">
                  <Input id="c-start" name="startDate" type="date" defaultValue={editing.startDate} />
                </Field>
                <Field id="c-end" label="End date">
                  <Input id="c-end" name="endDate" type="date" defaultValue={editing.endDate} />
                </Field>
                <Field id="c-notes" label="Notes" className="sm:col-span-2">
                  <Textarea id="c-notes" name="notes" rows={2} defaultValue={editing.notes} />
                </Field>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
