import { getSettings } from "@/lib/data/public";

const HEX = /^#[0-9a-f]{6}$/i;

/** Applies admin-chosen brand colours (light theme) as CSS variable overrides. */
export async function BrandColors() {
  const s = await getSettings();
  const rules: string[] = [];
  if (s.primaryColor && HEX.test(s.primaryColor)) {
    rules.push(
      `--primary:${s.primaryColor}`,
      `--primary-hover:color-mix(in oklab, ${s.primaryColor} 82%, black)`,
      `--ring:${s.primaryColor}`,
    );
  }
  if (s.accentColor && HEX.test(s.accentColor)) {
    rules.push(
      `--accent:${s.accentColor}`,
      `--accent-hover:color-mix(in oklab, ${s.accentColor} 85%, black)`,
    );
  }
  if (!rules.length) return null;
  return <style>{`:root{${rules.join(";")}}`}</style>;
}
