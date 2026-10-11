import { z } from "zod";

// Field definitions drive the generic admin forms, validation (client + server)
// and the conversion between form values and database values.

export type Option = { value: string; label: string };

type Base = {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  /** Layout: span both columns of the form grid. */
  wide?: boolean;
  /** Field group heading (fields with the same group render together). */
  group?: string;
  placeholder?: string;
};

export type FieldDef =
  | (Base & { type: "text" | "textarea" | "url" | "email" | "color"; maxLength?: number; rows?: number })
  | (Base & { type: "slug"; from: string })
  | (Base & { type: "richtext" })
  | (Base & { type: "number"; integer?: boolean; min?: number; max?: number })
  | (Base & { type: "date" | "datetime" })
  | (Base & { type: "select"; options: Option[] })
  | (Base & { type: "relation"; relation: "programme" | "album" })
  | (Base & { type: "boolean" })
  | (Base & { type: "tags" })
  | (Base & { type: "image" | "file" })
  | (Base & { type: "icon" })
  | (Base & { type: "repeater"; fields: FieldDef[]; itemLabel?: string; addLabel?: string });

export type FormValues = Record<string, unknown>;

const IST_OFFSET = "+05:30";

function str(v: unknown) {
  return typeof v === "string" ? v.trim() : v === null || v === undefined ? "" : String(v);
}

/** Builds a zod schema for validating form values (used on client and server). */
export function buildSchema(fields: FieldDef[]): z.ZodType<FormValues> {
  const shape: Record<string, z.ZodType> = {};
  for (const f of fields) shape[f.name] = fieldSchema(f);
  return z.object(shape).passthrough() as unknown as z.ZodType<FormValues>;
}

function requiredMsg(f: FieldDef) {
  return `${f.label} is required.`;
}

function fieldSchema(f: FieldDef): z.ZodType {
  switch (f.type) {
    case "boolean":
      return z.boolean().optional();
    case "tags":
      return z.array(z.string().max(300)).max(100).optional();
    case "repeater": {
      const item = buildSchema(f.fields);
      return z.array(item).max(200).optional();
    }
    case "number": {
      return z
        .union([z.string(), z.number(), z.null()])
        .optional()
        .superRefine((v, ctx) => {
          const raw = str(v);
          if (!raw) {
            if (f.required) ctx.addIssue({ code: "custom", message: requiredMsg(f) });
            return;
          }
          const n = Number(raw);
          if (Number.isNaN(n))
            return ctx.addIssue({ code: "custom", message: `${f.label} must be a number.` });
          if (f.integer && !Number.isInteger(n))
            ctx.addIssue({ code: "custom", message: `${f.label} must be a whole number.` });
          if (f.min !== undefined && n < f.min)
            ctx.addIssue({ code: "custom", message: `${f.label} must be at least ${f.min}.` });
          if (f.max !== undefined && n > f.max)
            ctx.addIssue({ code: "custom", message: `${f.label} must be at most ${f.max}.` });
        });
    }
    default: {
      const max =
        f.type === "richtext"
          ? 200_000
          : f.type === "textarea"
            ? (f.maxLength ?? 10_000)
            : "maxLength" in f && f.maxLength
              ? f.maxLength
              : 2000;
      return z
        .union([z.string(), z.null()])
        .optional()
        .superRefine((v, ctx) => {
          const raw = str(v);
          const plain = f.type === "richtext" ? raw.replace(/<[^>]*>/g, "").trim() : raw;
          if (!plain) {
            if (f.required) ctx.addIssue({ code: "custom", message: requiredMsg(f) });
            return;
          }
          if (raw.length > max) ctx.addIssue({ code: "custom", message: `${f.label} is too long.` });
          if (f.type === "url" && !/^(https?:\/\/|\/|mailto:|tel:|#)/.test(raw))
            ctx.addIssue({
              code: "custom",
              message: "Enter a full URL (https://…) or a site path starting with /.",
            });
          if (f.type === "email" && !/^\S+@\S+\.\S+$/.test(raw))
            ctx.addIssue({ code: "custom", message: "Enter a valid email." });
          if (f.type === "slug" && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw))
            ctx.addIssue({ code: "custom", message: "Use lowercase letters, numbers and dashes only." });
          if (f.type === "color" && !/^#[0-9a-fA-F]{6}$/.test(raw))
            ctx.addIssue({ code: "custom", message: "Use a hex colour like #1f4d3a." });
          if (f.type === "select" && !f.options.some((o) => o.value === raw))
            ctx.addIssue({ code: "custom", message: `Choose a valid ${f.label.toLowerCase()}.` });
        });
    }
  }
}

// ── Conversions ─────────────────────────────────────────────

function toInputDate(d: Date, withTime: boolean) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  return withTime ? `${date}T${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}` : date;
}

/** Database record → form values. */
export function toFormValues(fields: FieldDef[], record: Record<string, unknown> | null): FormValues {
  const out: FormValues = {};
  for (const f of fields) {
    const v = record?.[f.name];
    switch (f.type) {
      case "boolean":
        out[f.name] = Boolean(v);
        break;
      case "tags":
        out[f.name] = Array.isArray(v) ? v : [];
        break;
      case "repeater":
        out[f.name] = Array.isArray(v)
          ? v.map((item) => toFormValues(f.fields, item as Record<string, unknown>))
          : [];
        break;
      case "date":
      case "datetime":
        out[f.name] = v ? toInputDate(new Date(v as string), f.type === "datetime") : "";
        break;
      case "number":
        out[f.name] = v === null || v === undefined ? "" : String(v);
        break;
      default:
        out[f.name] = v === null || v === undefined ? "" : String(v);
    }
  }
  return out;
}

/** Form values → database data (assumes values already validated). */
export function toDbData(
  fields: FieldDef[],
  values: FormValues,
  opts: { sanitize?: (html: string) => string } = {},
) {
  const data: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.name];
    switch (f.type) {
      case "boolean":
        data[f.name] = Boolean(v);
        break;
      case "tags":
        data[f.name] = (Array.isArray(v) ? v : []).map((s) => String(s).trim()).filter(Boolean);
        break;
      case "repeater": {
        const items = (Array.isArray(v) ? v : []).map((item) => toDbData(f.fields, item as FormValues, opts));
        // Drop completely empty rows.
        data[f.name] = items
          .map((item) =>
            Object.fromEntries(
              Object.entries(item).filter(
                ([, val]) => val !== null && val !== "" && !(Array.isArray(val) && !val.length),
              ),
            ),
          )
          .filter((item) => Object.keys(item).length > 0);
        break;
      }
      case "number": {
        const raw = str(v);
        data[f.name] = raw ? (f.integer ? Math.round(Number(raw)) : Number(raw)) : null;
        break;
      }
      case "date": {
        const raw = str(v);
        data[f.name] = raw ? new Date(`${raw}T00:00:00${IST_OFFSET}`) : null;
        break;
      }
      case "datetime": {
        const raw = str(v);
        data[f.name] = raw ? new Date(`${raw}:00${IST_OFFSET}`) : null;
        break;
      }
      case "richtext": {
        const raw = str(v);
        data[f.name] = opts.sanitize ? opts.sanitize(raw) : raw;
        break;
      }
      case "slug":
        data[f.name] = str(v).toLowerCase() || null;
        break;
      default: {
        const raw = str(v);
        data[f.name] = raw === "" ? null : raw;
      }
    }
  }
  return data;
}

export function emptyValues(fields: FieldDef[]): FormValues {
  return toFormValues(fields, null);
}
