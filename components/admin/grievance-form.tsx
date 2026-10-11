"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateGrievance } from "@/lib/admin/lead-actions";
import { GRIEVANCE_STATUSES, GRIEVANCE_STATUS_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { NativeSelect, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export function GrievanceUpdateForm({ id, status, resolution, internalNotes, assignedToId, staff }: { id: string; status: string; resolution: string; internalNotes: string; assignedToId: string; staff: { value: string; label: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await updateGrievance(id, { status: String(fd.get("status")), resolution: String(fd.get("resolution") ?? ""), internalNotes: String(fd.get("internalNotes") ?? ""), assignedToId: String(fd.get("assignedToId") ?? "") || null });
          if (!res.ok) return void toast.error(res.message);
          toast.success(res.message);
          router.refresh();
        });
      }}
    >
      <Field id="g-status" label="Status">
        <NativeSelect id="g-status" name="status" defaultValue={status} className="h-11">
          {GRIEVANCE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {GRIEVANCE_STATUS_LABELS[s]}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="g-owner" label="Handled by">
        <NativeSelect id="g-owner" name="assignedToId" defaultValue={assignedToId} className="h-11">
          <option value="">Nobody yet</option>
          {staff.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="g-res" label="Resolution" hint="What was done. Shared with the person if you contact them.">
        <Textarea id="g-res" name="resolution" defaultValue={resolution} rows={4} aria-describedby="g-res-hint" />
      </Field>
      <Field id="g-notes" label="Internal notes" hint="Only visible to staff.">
        <Textarea id="g-notes" name="internalNotes" defaultValue={internalNotes} rows={4} aria-describedby="g-notes-hint" />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null} Save
      </Button>
    </form>
  );
}
