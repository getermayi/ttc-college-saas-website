"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { acceptInvite } from "@/lib/admin/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export function AcceptInviteForm({ token, askName, defaultName }: { token: string; askName: boolean; defaultName: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await acceptInvite({ token, name: String(fd.get("name") ?? ""), password: String(fd.get("password")), confirm: String(fd.get("confirm")) });
          if (!res.ok) return setError(res.message);
          toast.success(res.message);
          router.push("/admin/login");
        });
      }}
    >
      {error ? (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger-soft-foreground">
          {error}
        </p>
      ) : null}
      {askName ? (
        <Field id="name" label="Your name">
          <Input id="name" name="name" defaultValue={defaultName} autoComplete="name" required />
        </Field>
      ) : null}
      <Field id="password" label="New password" hint="At least 10 characters, with letters and a number.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} aria-describedby="password-hint" />
      </Field>
      <Field id="confirm" label="Confirm password">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Save password
      </Button>
    </form>
  );
}
