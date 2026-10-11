"use server";

import { prisma } from "@/lib/db";
import { assertCapability, AuthorizationError } from "@/lib/auth/session";
import { ALL_TAGS } from "@/lib/cache-tags";
import { audit, snapshot } from "./audit";
import { revalidateContent } from "./revalidate";
import { buildSchema, toDbData, type FormValues } from "./fields";
import { SETTINGS_FIELDS } from "./settings-fields";

function contrast(hex: string, against = "#ffffff") {
  const lum = (h: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [a, b] = [lum(hex), lum(against)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

export async function saveSettings(values: FormValues) {
  try {
    const user = await assertCapability("settings");
    const parsed = buildSchema(SETTINGS_FIELDS).safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] ??= i.message;
      return { ok: false as const, message: "Please fix the highlighted fields.", fieldErrors };
    }
    const data = toDbData(SETTINGS_FIELDS, parsed.data);
    for (const key of ["primaryColor", "accentColor"] as const) {
      const c = data[key];
      if (typeof c === "string" && contrast(c) < 4.5) {
        return { ok: false as const, message: "That colour is too light for readable white text (WCAG AA needs 4.5:1).", fieldErrors: { [key]: `Contrast with white is ${contrast(c).toFixed(1)}:1 — choose a darker shade.` } };
      }
    }
    if (typeof data.whatsappNumber === "string") data.whatsappNumber = data.whatsappNumber.replace(/[^\d]/g, "");
    const before = await prisma.siteSettings.findUnique({ where: { id: "site" } });
    if (before) await snapshot(user, "siteSettings", "site", before);
    await prisma.siteSettings.update({ where: { id: "site" }, data });
    await audit(user, "update", "siteSettings", "site", "Updated site settings");
    revalidateContent(ALL_TAGS);
    return { ok: true as const, message: "Settings saved — live now." };
  } catch (err) {
    if (err instanceof AuthorizationError) return { ok: false as const, message: err.message };
    console.error(err);
    return { ok: false as const, message: "Could not save settings." };
  }
}
