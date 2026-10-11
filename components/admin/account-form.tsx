"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { changePassword } from "@/lib/admin/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export function AccountForm() {
  const [pending, start] = useTransition();
  return (
    <form
      className="max-w-md space-y-4 rounded-2xl border border-border bg-surface p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        start(async () => {
          const res = await changePassword({ current: String(fd.get("current")), password: String(fd.get("password")), confirm: String(fd.get("confirm")) });
          if (!res.ok) return void toast.error(res.message);
          toast.success(res.message);
          form.reset();
        });
      }}
    >
      <Field id="current" label="Current password">
        <Input id="current" name="current" type="password" autoComplete="current-password" required />
      </Field>
      <Field id="password" label="New password" hint="At least 10 characters, with letters and a number.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} aria-describedby="password-hint" />
      </Field>
      <Field id="confirm" label="Confirm new password">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null} Change password
      </Button>
    </form>
  );
}
