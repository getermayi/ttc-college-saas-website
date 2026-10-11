import { createHash } from "node:crypto";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { AcceptInviteForm } from "@/components/admin/accept-invite-form";
import { Emblem } from "@/components/site/logo";
import { ROLE_LABELS } from "@/lib/constants";

export const instant = false;

export const metadata = { title: "Set your password" };

export default async function AcceptInvitePage({ searchParams }: PageProps<"/admin/accept-invite">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const invite = token
    ? await prisma.invite.findUnique({
        where: { tokenHash: createHash("sha256").update(token).digest("hex") },
      })
    : null;
  const valid = invite && !invite.acceptedAt && invite.expiresAt > new Date();
  return (
    <main className="motif-texture flex min-h-dvh items-center justify-center p-6">
      <div className="border-border bg-surface w-full max-w-md rounded-3xl border p-8 shadow-[var(--shadow-lift)]">
        <Emblem className="size-12" />
        {valid ? (
          <>
            <h1 className="font-display mt-6 text-3xl font-semibold">
              {invite.purpose === "reset" ? "Set a new password" : "Welcome to the team"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {invite.email} · {ROLE_LABELS[invite.role]}
            </p>
            <AcceptInviteForm
              token={token}
              askName={invite.purpose !== "reset"}
              defaultName={invite.name ?? ""}
            />
          </>
        ) : (
          <>
            <h1 className="font-display mt-6 text-3xl font-semibold">This link has expired</h1>
            <p className="text-muted-foreground mt-2">
              Invitation and reset links work once and expire after 72 hours. Ask an administrator to send a
              new one.
            </p>
            <Link
              href="/admin/login"
              className="text-primary mt-6 inline-block font-semibold hover:underline"
            >
              Go to sign in →
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
