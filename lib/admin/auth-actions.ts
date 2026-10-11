"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { audit } from "./audit";
import { rateLimit } from "@/lib/rate-limit";
import { getClientInfo } from "@/lib/request";
import { assertCapability, getCurrentUser } from "@/lib/auth/session";
import { canManageRole } from "@/lib/auth/permissions";
import { ROLES, ROLE_LABELS, type RoleValue } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { InviteEmail } from "@/emails/enquiry-emails";
import { absoluteUrl } from "@/lib/utils";

type Result<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; message: string };

function safeCallback(url: unknown) {
  const s = typeof url === "string" ? url : "";
  return s.startsWith("/admin") && !s.startsWith("//") ? s : "/admin";
}

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const client = await getClientInfo();
  const limit = await rateLimit(`login-ip:${client.ipHash}`, { limit: 20, windowSeconds: 600 });
  if (!limit.success) return { error: "Too many sign-in attempts. Please wait 10 minutes and try again." };
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: safeCallback(formData.get("callbackUrl")),
    });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      if ((err as { code?: string }).code === "rate_limited")
        return { error: "Too many attempts for this account. Please wait 10 minutes." };
      return { error: "That email and password don't match. Please try again." };
    }
    throw err;
  }
}

export async function googleLoginAction(formData: FormData) {
  await signIn("google", { redirectTo: safeCallback(formData.get("callbackUrl")) });
}

export async function logoutAction() {
  const user = await getCurrentUser();
  if (user) await audit(user, "logout", "user", user.id, `${user.name} signed out`);
  await signOut({ redirectTo: "/admin/login" });
}

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

const inviteSchema = z.object({
  email: z.email("Enter a valid email.").transform((v) => v.toLowerCase().trim()),
  name: z.string().trim().min(2, "Enter their name.").max(100),
  role: z.enum(ROLES),
});

async function createToken(
  email: string,
  name: string | null,
  role: RoleValue,
  purpose: "invite" | "reset",
  invitedById: string,
) {
  const token = randomBytes(32).toString("base64url");
  await prisma.invite.updateMany({ where: { email, acceptedAt: null }, data: { expiresAt: new Date() } });
  await prisma.invite.create({
    data: {
      email,
      name,
      role,
      purpose,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 72 * 3600_000),
      invitedById,
    },
  });
  return absoluteUrl(`/admin/accept-invite?token=${token}`);
}

export async function inviteUser(input: {
  email: string;
  name: string;
  role: string;
}): Promise<Result<{ link: string }>> {
  const actor = await assertCapability("users");
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { email, name, role } = parsed.data;
  if (!canManageRole(actor.role, role))
    return { ok: false, message: "Only a Super Admin can invite another Super Admin." };
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, message: "Someone with this email already has an account." };
  const link = await createToken(email, name, role, "invite", actor.id);
  await sendEmail({
    to: email,
    subject: "You're invited to the TTC Aalo website admin",
    react: InviteEmail({ name, inviter: actor.name, role: ROLE_LABELS[role], url: link }),
  });
  await audit(actor, "invite", "user", null, `Invited ${email} as ${ROLE_LABELS[role]}`);
  return { ok: true, data: { link }, message: `Invitation sent to ${email}.` };
}

export async function sendPasswordReset(userId: string): Promise<Result<{ link: string }>> {
  const actor = await assertCapability("users");
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, message: "User not found." };
  if (!canManageRole(actor.role, target.role))
    return { ok: false, message: "You can't reset this user's password." };
  const link = await createToken(target.email, target.name, target.role, "reset", actor.id);
  await sendEmail({
    to: target.email,
    subject: "Set a new password — TTC Aalo admin",
    react: InviteEmail({ name: target.name, role: ROLE_LABELS[target.role], url: link, reset: true }),
  });
  await audit(actor, "reset", "user", target.id, `Sent a password reset link to ${target.email}`);
  return { ok: true, data: { link }, message: `Reset link sent to ${target.email}.` };
}

export async function updateUser(
  userId: string,
  data: { role?: string; active?: boolean; name?: string },
): Promise<Result> {
  const actor = await assertCapability("users");
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, message: "User not found." };
  if (target.id === actor.id && (data.role || data.active === false))
    return { ok: false, message: "You can't change your own role or deactivate yourself." };
  if (!canManageRole(actor.role, target.role)) return { ok: false, message: "You can't change this user." };
  const role = data.role ? z.enum(ROLES).safeParse(data.role) : null;
  if (role && !role.success) return { ok: false, message: "Invalid role." };
  if (role?.success && !canManageRole(actor.role, role.data))
    return { ok: false, message: "Only a Super Admin can grant Super Admin." };
  if (
    (role?.success && role.data !== "SUPER_ADMIN" && target.role === "SUPER_ADMIN") ||
    (data.active === false && target.role === "SUPER_ADMIN")
  ) {
    const supers = await prisma.user.count({ where: { role: "SUPER_ADMIN", active: true } });
    if (supers <= 1) return { ok: false, message: "There must always be at least one active Super Admin." };
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(role?.success ? { role: role.data } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.name ? { name: data.name.slice(0, 100) } : {}),
    },
  });
  await audit(
    actor,
    "update",
    "user",
    userId,
    `Updated ${target.email}${role?.success ? ` → ${ROLE_LABELS[role.data]}` : ""}${data.active !== undefined ? (data.active ? " (activated)" : " (deactivated)") : ""}`,
  );
  return { ok: true, message: "User updated." };
}

export async function revokeInvite(inviteId: string): Promise<Result> {
  const actor = await assertCapability("users");
  await prisma.invite.update({ where: { id: inviteId }, data: { expiresAt: new Date() } });
  await audit(actor, "revoke", "invite", inviteId, "Revoked an invitation");
  return { ok: true, message: "Invitation revoked." };
}

const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200)
  .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), "Use letters and at least one number.");

export async function acceptInvite(input: {
  token: string;
  name?: string;
  password: string;
  confirm: string;
}): Promise<Result> {
  const client = await getClientInfo();
  const limit = await rateLimit(`accept:${client.ipHash}`, { limit: 10, windowSeconds: 600 });
  if (!limit.success) return { ok: false, message: "Too many attempts. Please wait a few minutes." };
  const pw = passwordSchema.safeParse(input.password);
  if (!pw.success) return { ok: false, message: pw.error.issues[0].message };
  if (input.password !== input.confirm) return { ok: false, message: "The two passwords don't match." };
  const invite = await prisma.invite.findUnique({ where: { tokenHash: hashToken(input.token ?? "") } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date())
    return { ok: false, message: "This link has expired or was already used. Ask an admin for a new one." };
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.upsert({
    where: { email: invite.email },
    update: { passwordHash, active: true },
    create: {
      email: invite.email,
      name: input.name?.trim() || invite.name || invite.email,
      role: invite.role,
      passwordHash,
    },
  });
  await prisma.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
  await audit(
    user,
    invite.purpose === "reset" ? "reset" : "accept",
    "user",
    user.id,
    invite.purpose === "reset"
      ? `${user.email} set a new password`
      : `${user.email} accepted their invitation`,
  );
  return { ok: true, message: "Password saved. You can now sign in." };
}

export async function changePassword(input: {
  current: string;
  password: string;
  confirm: string;
}): Promise<Result> {
  const actor = await getCurrentUser();
  if (!actor) return { ok: false, message: "Please sign in again." };
  const user = await prisma.user.findUnique({ where: { id: actor.id } });
  if (!user?.passwordHash || !(await bcrypt.compare(input.current, user.passwordHash)))
    return { ok: false, message: "Your current password is not correct." };
  const pw = passwordSchema.safeParse(input.password);
  if (!pw.success) return { ok: false, message: pw.error.issues[0].message };
  if (input.password !== input.confirm) return { ok: false, message: "The two passwords don't match." };
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(input.password, 12) },
  });
  await audit(actor, "update", "user", actor.id, "Changed own password");
  return { ok: true, message: "Password changed." };
}
