import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { CurrentUser } from "@/lib/auth/session";

export async function audit(
  user: Pick<CurrentUser, "id"> | null,
  action: string,
  entityType: string,
  entityId: string | null,
  summary: string,
  meta?: Prisma.InputJsonValue,
) {
  try {
    await prisma.auditLog.create({
      data: { userId: user?.id ?? null, action, entityType, entityId, summary: summary.slice(0, 500), meta },
    });
  } catch (err) {
    console.error("[audit] failed", err);
  }
}

/** Stores a snapshot of a record before it changes, for version history and restore. */
export async function snapshot(
  user: Pick<CurrentUser, "id"> | null,
  entityType: string,
  entityId: string,
  data: unknown,
  note?: string,
) {
  const json = JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
  await prisma.contentVersion.create({
    data: { entityType, entityId, data: json, note, userId: user?.id ?? null },
  });
  // Keep the newest 30 versions per record.
  const old = await prisma.contentVersion.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    skip: 30,
    select: { id: true },
  });
  if (old.length) await prisma.contentVersion.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
}
