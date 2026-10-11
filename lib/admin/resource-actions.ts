"use server";

import { prisma } from "@/lib/db";
import { assertCapability, AuthorizationError } from "@/lib/auth/session";
import { sanitizeRichText } from "@/lib/sanitize";
import { audit, snapshot } from "./audit";
import { revalidateContent } from "./revalidate";
import { buildSchema, toDbData, type FormValues } from "./fields";
import { getResource, type ResourceConfig } from "./resources";
import { slugify } from "@/lib/utils";

type Result<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

type Delegate = {
  findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
  findFirst: (args: unknown) => Promise<Record<string, unknown> | null>;
  create: (args: unknown) => Promise<Record<string, unknown>>;
  update: (args: unknown) => Promise<Record<string, unknown>>;
  updateMany: (args: unknown) => Promise<{ count: number }>;
  delete: (args: unknown) => Promise<Record<string, unknown>>;
  deleteMany: (args: unknown) => Promise<{ count: number }>;
  aggregate: (args: unknown) => Promise<{ _max: Record<string, number | null> }>;
};

function delegateFor(config: ResourceConfig) {
  return (prisma as unknown as Record<string, Delegate>)[config.model];
}

function load(key: string) {
  const config = getResource(key);
  if (!config) throw new Error("Unknown content type.");
  return config;
}

function fail(err: unknown): { ok: false; message: string } {
  if (err instanceof AuthorizationError) return { ok: false, message: err.message };
  const code = (err as { code?: string })?.code;
  if (code === "P2002")
    return {
      ok: false,
      message: "Another item already uses that value. Please choose a different slug or name.",
    };
  if (code === "P2025")
    return { ok: false, message: "This item no longer exists. It may have been deleted." };
  console.error("[admin] action failed", err);
  return { ok: false, message: "Something went wrong while saving. Please try again." };
}

function title(config: ResourceConfig, r: Record<string, unknown>) {
  return String(r[config.titleField] ?? r.id ?? "");
}

export async function saveRecord(
  key: string,
  id: string | null,
  values: FormValues,
  status?: string,
): Promise<Result<{ id: string }>> {
  try {
    const user = await assertCapability("content");
    const config = load(key);
    if (!id && config.canCreate === false) return { ok: false, message: "New items can't be created here." };

    const parsed = buildSchema(config.fields).safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const i of parsed.error.issues) {
        const k = i.path.join(".");
        if (k && !fieldErrors[k]) fieldErrors[k] = i.message;
      }
      return { ok: false, message: "Please fix the highlighted fields.", fieldErrors };
    }

    const data = toDbData(config.fields, parsed.data, { sanitize: sanitizeRichText });
    for (const f of config.fields)
      if (f.type === "slug" && !data[f.name]) data[f.name] = slugify(String(data[f.from] ?? "")) || null;
    if (status && config.status && config.status.options.some((o) => o.value === status))
      data[config.status.field] = status;

    // Business rules
    if (config.model === "testimonial" && data.status === "PUBLISHED" && !data.consent) {
      return {
        ok: false,
        message: "Tick the consent box before publishing a testimonial.",
        fieldErrors: { consent: "Consent is required to publish." },
      };
    }

    const db = delegateFor(config);

    // Unique checks with friendly messages
    for (const field of config.unique ?? []) {
      if (!data[field]) continue;
      const clash = await db.findFirst({
        where: { [field]: data[field], ...(id ? { NOT: { id } } : {}) },
        select: { id: true },
      });
      if (clash)
        return {
          ok: false,
          message: "Please fix the highlighted fields.",
          fieldErrors: { [field]: "This is already used by another item." },
        };
    }

    let record: Record<string, unknown>;
    if (id) {
      const before = await db.findUnique({ where: { id } });
      if (!before) return { ok: false, message: "This item no longer exists." };
      await snapshot(user, config.model, id, before);
      record = await db.update({ where: { id }, data });
      await audit(
        user,
        "update",
        config.model,
        id,
        `Updated ${config.singular.toLowerCase()} "${title(config, record)}"`,
      );
    } else {
      const extra: Record<string, unknown> = {};
      if (config.orderable) {
        const max = await db.aggregate({ _max: { order: true } });
        extra.order = (max._max.order ?? -1) + 1;
      }
      for (const [k, v] of Object.entries(config.defaults ?? {}))
        if (data[k] === undefined || data[k] === null) extra[k] = v;
      record = await db.create({ data: { ...extra, ...data } });
      await audit(
        user,
        "create",
        config.model,
        String(record.id),
        `Created ${config.singular.toLowerCase()} "${title(config, record)}"`,
      );
    }

    revalidateContent([...config.tags]);
    return { ok: true, data: { id: String(record.id) }, message: "Saved — changes are live." };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteRecords(key: string, ids: string[]): Promise<Result> {
  try {
    const user = await assertCapability("content");
    const config = load(key);
    if (config.canDelete === false)
      return { ok: false, message: "These items can't be deleted. You can hide them instead." };
    const db = delegateFor(config);
    for (const id of ids) {
      const before = await db.findUnique({ where: { id } });
      if (!before) continue;
      await snapshot(user, config.model, id, before, "Deleted");
      await db.delete({ where: { id } });
      await audit(
        user,
        "delete",
        config.model,
        id,
        `Deleted ${config.singular.toLowerCase()} "${title(config, before)}"`,
      );
    }
    revalidateContent([...config.tags]);
    return { ok: true, message: ids.length === 1 ? "Deleted." : `Deleted ${ids.length} items.` };
  } catch (err) {
    return fail(err);
  }
}

export async function setRecordsStatus(key: string, ids: string[], status: string): Promise<Result> {
  try {
    const user = await assertCapability("content");
    const config = load(key);
    if (!config.status || !config.status.options.some((o) => o.value === status))
      return { ok: false, message: "Invalid status." };
    const db = delegateFor(config);
    if (config.model === "testimonial" && status === "PUBLISHED") {
      const res = await db.updateMany({ where: { id: { in: ids }, consent: true }, data: { status } });
      revalidateContent([...config.tags]);
      await audit(user, "status", config.model, null, `Set ${res.count} testimonial(s) to ${status}`, {
        ids,
      });
      return res.count < ids.length
        ? {
            ok: true,
            message: `${res.count} published. ${ids.length - res.count} skipped because consent is not ticked.`,
          }
        : { ok: true, message: "Published." };
    }
    await db.updateMany({ where: { id: { in: ids } }, data: { [config.status.field]: status } });
    await audit(
      user,
      "status",
      config.model,
      ids.length === 1 ? ids[0] : null,
      `Set ${ids.length} ${config.label.toLowerCase()} to ${status}`,
      { ids },
    );
    revalidateContent([...config.tags]);
    return { ok: true, message: status === config.status.published ? "Published — now live." : "Updated." };
  } catch (err) {
    return fail(err);
  }
}

export async function toggleBoolean(key: string, id: string, field: string, value: boolean): Promise<Result> {
  try {
    const user = await assertCapability("content");
    const config = load(key);
    const def = config.fields.find((f) => f.name === field && f.type === "boolean");
    if (!def) return { ok: false, message: "Invalid field." };
    const db = delegateFor(config);
    const r = await db.update({ where: { id }, data: { [field]: value } });
    await audit(
      user,
      "update",
      config.model,
      id,
      `${value ? "Enabled" : "Disabled"} "${def.label}" on "${title(config, r)}"`,
    );
    revalidateContent([...config.tags]);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function reorderRecords(key: string, ids: string[]): Promise<Result> {
  try {
    const user = await assertCapability("content");
    const config = load(key);
    if (!config.orderable) return { ok: false, message: "This list can't be reordered." };
    const db = delegateFor(config);
    // Re-use the existing order slots of these records so ordering within a filtered group stays consistent.
    const current = await Promise.all(
      ids.map((id) => db.findUnique({ where: { id }, select: { order: true } })),
    );
    const slots = current.map((c) => Number(c?.order ?? 0)).sort((a, b) => a - b);
    const unique = new Set(slots).size === slots.length ? slots : ids.map((_, i) => i);
    await prisma.$transaction(
      ids.map((id, i) => (db.update as (a: unknown) => never)({ where: { id }, data: { order: unique[i] } })),
    );
    await audit(user, "reorder", config.model, null, `Reordered ${config.label.toLowerCase()}`);
    revalidateContent([...config.tags]);
    return { ok: true, message: "Order saved." };
  } catch (err) {
    return fail(err);
  }
}

export async function duplicateRecord(key: string, id: string): Promise<Result<{ id: string }>> {
  try {
    const user = await assertCapability("content");
    const config = load(key);
    if (config.canCreate === false) return { ok: false, message: "This item can't be duplicated." };
    const db = delegateFor(config);
    const src = await db.findUnique({ where: { id } });
    if (!src) return { ok: false, message: "Item not found." };
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = src;
    void _id;
    void _c;
    void _u;
    const copy: Record<string, unknown> = { ...rest };
    copy[config.titleField] = `${String(rest[config.titleField] ?? "")} (copy)`;
    for (const f of config.unique ?? [])
      copy[f] = `${String(rest[f] ?? "item")}-copy-${Date.now().toString(36)}`;
    if (config.status) copy[config.status.field] = config.status.draft;
    for (const [k, v] of Object.entries(copy))
      if (v !== null && typeof v === "object" && !(v instanceof Date) && !Array.isArray(v))
        copy[k] = JSON.parse(JSON.stringify(v));
    const created = await db.create({ data: copy });
    await audit(user, "create", config.model, String(created.id), `Duplicated "${title(config, src)}"`);
    return { ok: true, data: { id: String(created.id) }, message: "Duplicated as a draft." };
  } catch (err) {
    return fail(err);
  }
}

export async function restoreVersion(versionId: string): Promise<Result<{ id: string }>> {
  try {
    const user = await assertCapability("content");
    const version = await prisma.contentVersion.findUnique({ where: { id: versionId } });
    if (!version) return { ok: false, message: "Version not found." };
    const { RESOURCES } = await import("./resources");
    const config = RESOURCES.find((r) => r.model === version.entityType);
    if (!config) return { ok: false, message: "This version can't be restored here." };
    const db = delegateFor(config);
    const data = version.data as Record<string, unknown>;
    const { id, createdAt: _c, updatedAt: _u, ...rest } = data;
    void _c;
    void _u;
    // Convert ISO strings back to dates for DateTime columns.
    for (const f of config.fields)
      if ((f.type === "date" || f.type === "datetime") && typeof rest[f.name] === "string")
        rest[f.name] = new Date(rest[f.name] as string);
    for (const k of [
      "publishedAt",
      "expiresAt",
      "startsAt",
      "endsAt",
      "date",
      "endDate",
      "issuedOn",
      "applicationDeadline",
    ])
      if (typeof rest[k] === "string") rest[k] = new Date(rest[k] as string);

    const existing = await db.findUnique({ where: { id: version.entityId } });
    if (existing) {
      await snapshot(user, config.model, version.entityId, existing, "Before restore");
      await db.update({ where: { id: version.entityId }, data: rest });
    } else {
      await db.create({ data: { id, ...rest } });
    }
    await audit(
      user,
      "restore",
      config.model,
      version.entityId,
      `Restored "${title(config, data)}" to a version from ${version.createdAt.toISOString()}`,
    );
    revalidateContent([...config.tags]);
    return { ok: true, data: { id: version.entityId }, message: "Version restored." };
  } catch (err) {
    return fail(err);
  }
}
