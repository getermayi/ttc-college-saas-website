"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, KeyRound, Loader2, MailPlus, UserCheck, UserX, X } from "lucide-react";
import { inviteUser, revokeInvite, sendPasswordReset, updateUser } from "@/lib/admin/auth-actions";
import { ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, type RoleValue } from "@/lib/constants";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, NativeSelect } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/alert-dialog";

type U = {
  id: string;
  name: string;
  email: string;
  role: RoleValue;
  active: boolean;
  lastLoginAt: string | null;
  hasPassword: boolean;
};
type I = { id: string; email: string; role: RoleValue; expiresAt: string; purpose: string };

export function UsersManager({
  users,
  invites,
  me,
  myRole,
}: {
  users: U[];
  invites: I[];
  me: string;
  myRole: RoleValue;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const roles = ROLES.filter((r) => r !== "SUPER_ADMIN" || myRole === "SUPER_ADMIN");

  const run = (
    fn: () => Promise<{ ok: boolean; message?: string; data?: { link: string } }>,
    showLink = false,
  ) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.message);
      toast.success(res.message ?? "Done.");
      if (showLink && res.data?.link) setLink(res.data.link);
      router.refresh();
    });

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <MailPlus aria-hidden /> Invite a user
        </Button>
      </div>

      <div className="border-border bg-surface overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-border bg-surface-2/60 text-muted-foreground border-b text-xs tracking-wider uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">
                User
              </th>
              <th scope="col" className="px-4 py-3">
                Role
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
              <th scope="col" className="px-4 py-3">
                Last sign-in
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-border border-b last:border-0">
                <td className="px-4 py-3">
                  <span className="block font-semibold">
                    {u.name}{" "}
                    {u.id === me ? (
                      <span className="text-muted-foreground text-xs font-normal">(you)</span>
                    ) : null}
                  </span>
                  <span className="text-muted-foreground">{u.email}</span>
                </td>
                <td className="px-4 py-3">
                  {u.id === me || (u.role === "SUPER_ADMIN" && myRole !== "SUPER_ADMIN") ? (
                    <Badge tone="primary">{ROLE_LABELS[u.role]}</Badge>
                  ) : (
                    <NativeSelect
                      aria-label={`Role for ${u.name}`}
                      className="h-9 w-48 text-sm"
                      value={u.role}
                      disabled={pending}
                      onChange={(e) => run(() => updateUser(u.id, { role: e.target.value }))}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </NativeSelect>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.active ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Deactivated</Badge>}
                </td>
                <td
                  className="text-muted-foreground px-4 py-3"
                  title={u.lastLoginAt ? formatDateTime(u.lastLoginAt) : undefined}
                >
                  {u.lastLoginAt ? timeAgo(u.lastLoginAt) : "Never"}
                </td>
                <td className="px-4 py-3">
                  {u.id !== me && !(u.role === "SUPER_ADMIN" && myRole !== "SUPER_ADMIN") ? (
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => run(() => sendPasswordReset(u.id), true)}
                      >
                        <KeyRound aria-hidden /> Reset link
                      </Button>
                      <ConfirmDialog
                        title={u.active ? `Deactivate ${u.name}?` : `Reactivate ${u.name}?`}
                        description={
                          u.active
                            ? "They will be signed out and can't sign in until reactivated. Their past work stays in the audit log."
                            : "They will be able to sign in again."
                        }
                        confirmLabel={u.active ? "Deactivate" : "Reactivate"}
                        destructive={u.active}
                        onConfirm={() => run(() => updateUser(u.id, { active: !u.active }))}
                        trigger={
                          <Button
                            size="sm"
                            variant="ghost"
                            className={u.active ? "text-danger" : ""}
                            disabled={pending}
                          >
                            {u.active ? <UserX aria-hidden /> : <UserCheck aria-hidden />}{" "}
                            {u.active ? "Deactivate" : "Reactivate"}
                          </Button>
                        }
                      />
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invites.length ? (
        <section>
          <h2 className="text-lg font-semibold">Pending invitations</h2>
          <ul className="divide-border border-border bg-surface mt-3 divide-y rounded-2xl border">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="font-medium">{i.email}</span>
                <Badge>{ROLE_LABELS[i.role]}</Badge>
                {i.purpose === "reset" ? <Badge tone="info">Password reset</Badge> : null}
                <span className="text-muted-foreground">expires {formatDateTime(i.expiresAt)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto"
                  onClick={() => run(() => revokeInvite(i.id))}
                  disabled={pending}
                >
                  <X aria-hidden /> Revoke
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="border-border bg-surface-2/50 rounded-2xl border p-5">
        <h2 className="font-semibold">What each role can do</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          {ROLES.map((r) => (
            <div key={r}>
              <dt className="text-sm font-semibold">{ROLE_LABELS[r]}</dt>
              <dd className="text-muted-foreground text-sm">{ROLE_DESCRIPTIONS[r]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              start(async () => {
                const res = await inviteUser({
                  email: String(fd.get("email")),
                  name: String(fd.get("name")),
                  role: String(fd.get("role")),
                });
                if (!res.ok) return void toast.error(res.message);
                toast.success(res.message);
                setOpen(false);
                if (res.data?.link) setLink(res.data.link);
                router.refresh();
              });
            }}
          >
            <DialogHeader>
              <DialogTitle>Invite a user</DialogTitle>
              <DialogDescription>
                They&apos;ll get an email with a link to set their password. The link expires in 72 hours.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Field id="inv-name" label="Name" required>
                <Input id="inv-name" name="name" required />
              </Field>
              <Field id="inv-email" label="Email" required>
                <Input id="inv-email" name="email" type="email" required />
              </Field>
              <Field id="inv-role" label="Role" required>
                <NativeSelect id="inv-role" name="role" defaultValue="EDITOR">
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]} — {ROLE_DESCRIPTIONS[r]}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" aria-hidden /> : <MailPlus aria-hidden />} Send
                invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={link !== null} onOpenChange={(o) => !o && setLink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link ready</DialogTitle>
            <DialogDescription>
              We emailed this link. If email isn&apos;t set up yet, copy it and send it on WhatsApp. It works
              once and expires in 72 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              readOnly
              value={link ?? ""}
              aria-label="Invitation link"
              className="h-10 font-mono text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(link ?? "");
                toast.success("Copied.");
              }}
            >
              <Copy aria-hidden /> Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
