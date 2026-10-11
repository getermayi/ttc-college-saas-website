import "server-only";
import { prisma } from "@/lib/db";
import { mediaSelect } from "@/lib/data/public";
import type { FieldDef } from "./fields";
import type { ResourceConfig } from "./resources";

type Finder = {
  findMany: (args: unknown) => Promise<Record<string, unknown>[]>;
  findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
  count: (args: unknown) => Promise<number>;
};
const db = (config: ResourceConfig) => (prisma as unknown as Record<string, Finder>)[config.model];

export async function listRecords(
  config: ResourceConfig,
  opts: { q?: string; status?: string; group?: string },
) {
  const where: Record<string, unknown> = {};
  if (opts.q) where.OR = config.searchFields.map((f) => ({ [f]: { contains: opts.q, mode: "insensitive" } }));
  if (opts.status && config.status) where[config.status.field] = opts.status;
  if (opts.group && config.groupBy && config.groupBy.options.some((o) => o.value === opts.group))
    where[config.groupBy.field] = opts.group;
  const [rows, total] = await Promise.all([
    db(config).findMany({ where, orderBy: config.orderBy, include: config.include, take: 500 }),
    db(config).count({ where }),
  ]);
  return { rows: JSON.parse(JSON.stringify(rows)) as (Record<string, unknown> & { id: string })[], total };
}

function collectMediaIds(fields: FieldDef[], record: Record<string, unknown>, out: Set<string>) {
  for (const f of fields) {
    const v = record[f.name];
    if ((f.type === "image" || f.type === "file") && typeof v === "string" && v) out.add(v);
    if (f.type === "repeater" && Array.isArray(v))
      for (const item of v) collectMediaIds(f.fields, item as Record<string, unknown>, out);
  }
}

function needsRelation(fields: FieldDef[], rel: string): boolean {
  return fields.some(
    (f) =>
      (f.type === "relation" && f.relation === rel) ||
      (f.type === "repeater" && needsRelation(f.fields, rel)),
  );
}

export async function loadFormData(config: ResourceConfig, id: string | null) {
  const record = id ? await db(config).findUnique({ where: { id } }) : null;
  const mediaIds = new Set<string>();
  if (record) collectMediaIds(config.fields, record, mediaIds);
  const [media, versions, programmes, albums] = await Promise.all([
    mediaIds.size ? prisma.media.findMany({ where: { id: { in: [...mediaIds] } }, select: mediaSelect }) : [],
    id
      ? prisma.contentVersion.findMany({
          where: { entityType: config.model, entityId: id },
          orderBy: { createdAt: "desc" },
          take: 30,
          select: { id: true, createdAt: true, note: true, user: { select: { name: true } } },
        })
      : [],
    needsRelation(config.fields, "programme")
      ? prisma.programme.findMany({
          orderBy: { order: "asc" },
          select: { id: true, name: true, status: true },
        })
      : [],
    needsRelation(config.fields, "album")
      ? prisma.album.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } })
      : [],
  ]);
  return {
    record: record ? (JSON.parse(JSON.stringify(record)) as Record<string, unknown>) : null,
    media,
    versions: versions.map((v) => ({
      id: v.id,
      createdAt: v.createdAt.toISOString(),
      note: v.note,
      user: v.user?.name ?? null,
    })),
    relations: {
      programme: programmes.map((p) => ({
        value: p.id,
        label: `${p.name}${p.status !== "ACTIVE" ? ` (${p.status.toLowerCase()})` : ""}`,
      })),
      album: albums.map((a) => ({ value: a.id, label: a.title })),
    },
  };
}
