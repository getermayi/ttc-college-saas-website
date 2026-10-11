import { prisma } from "@/lib/db";
import { requireCapability } from "@/lib/auth/session";
import { mediaSelect } from "@/lib/data/public";
import { toFormValues } from "@/lib/admin/fields";
import { SETTINGS_FIELDS } from "@/lib/admin/settings-fields";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export const instant = false;
export const metadata = { title: "Site settings" };

export default async function SettingsPage() {
  await requireCapability("settings");
  const s = await prisma.siteSettings.findUniqueOrThrow({ where: { id: "site" } });
  const ids = [s.logoId, s.faviconId, s.defaultOgImageId, s.principalPhotoId].filter((x): x is string =>
    Boolean(x),
  );
  const media = ids.length
    ? await prisma.media.findMany({ where: { id: { in: ids } }, select: mediaSelect })
    : [];
  return (
    <>
      <AdminPageHeader
        title="Site settings"
        description="College details, contacts, admission status, branding and analytics. Changes go live immediately."
      />
      <SettingsForm
        initial={toFormValues(SETTINGS_FIELDS, s as unknown as Record<string, unknown>)}
        media={media}
      />
    </>
  );
}
