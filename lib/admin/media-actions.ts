"use server";

import { prisma } from "@/lib/db";
import { assertCapability, AuthorizationError } from "@/lib/auth/session";
import { mediaSelect } from "@/lib/data/public";
import { removeStoredFile } from "@/lib/media";
import { audit } from "./audit";
import { revalidateContent } from "./revalidate";
import { ALL_TAGS } from "@/lib/cache-tags";
import type { MediaLite } from "@/lib/content-types";

export async function listMedia(opts: {
  kind?: "IMAGE" | "DOCUMENT";
  q?: string;
  cursor?: string;
}): Promise<{ items: MediaLite[]; next: string | null }> {
  await assertCapability("media").catch(async () => assertCapability("content"));
  const take = 40;
  const items = await prisma.media.findMany({
    where: {
      ...(opts.kind ? { kind: opts.kind } : {}),
      ...(opts.q
        ? {
            OR: [
              { filename: { contains: opts.q, mode: "insensitive" } },
              { alt: { contains: opts.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    select: mediaSelect,
  });
  return { items: items.slice(0, take), next: items.length > take ? items[take - 1].id : null };
}

export async function getMediaByIds(ids: string[]): Promise<MediaLite[]> {
  await assertCapability("media").catch(async () => assertCapability("content"));
  if (!ids.length) return [];
  return prisma.media.findMany({ where: { id: { in: ids.slice(0, 200) } }, select: mediaSelect });
}

export async function updateMedia(id: string, data: { alt: string; caption?: string }) {
  try {
    const user = await assertCapability("media");
    const alt = data.alt.trim().slice(0, 250);
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return { ok: false as const, message: "File not found." };
    if (media.kind === "IMAGE" && alt.length < 3)
      return { ok: false as const, message: "Alt text is required for images." };
    await prisma.media.update({
      where: { id },
      data: { alt, caption: data.caption?.trim().slice(0, 300) || null },
    });
    await audit(user, "update", "media", id, `Updated details for "${media.filename}"`);
    revalidateContent(["media"]);
    return { ok: true as const, message: "Saved." };
  } catch (err) {
    if (err instanceof AuthorizationError) return { ok: false as const, message: err.message };
    console.error(err);
    return { ok: false as const, message: "Could not save." };
  }
}

/** Counts where a file is used, so editors don't break pages by deleting it. */
export async function mediaUsage(id: string) {
  await assertCapability("media");
  const [direct, json] = await Promise.all([
    Promise.all([
      prisma.siteSettings.count({
        where: {
          OR: [{ logoId: id }, { faviconId: id }, { defaultOgImageId: id }, { principalPhotoId: id }],
        },
      }),
      prisma.section.count({ where: { imageId: id } }),
      prisma.page.count({ where: { OR: [{ heroImageId: id }, { ogImageId: id }] } }),
      prisma.programme.count({ where: { OR: [{ heroImageId: id }, { ogImageId: id }] } }),
      prisma.notice.count({ where: { OR: [{ attachmentId: id }, { ogImageId: id }] } }),
      prisma.facultyMember.count({ where: { photoId: id } }),
      prisma.facility.count({ where: { coverId: id } }),
      prisma.event.count({ where: { OR: [{ coverId: id }, { ogImageId: id }] } }),
      prisma.album.count({ where: { coverId: id } }),
      prisma.testimonial.count({ where: { photoId: id } }),
      prisma.download.count({ where: { fileId: id } }),
      prisma.seoEntry.count({ where: { ogImageId: id } }),
    ]),
    prisma.$queryRaw<{ n: bigint }[]>`
      SELECT (
        (SELECT count(*) FROM "Album" WHERE images::text LIKE ${"%" + id + "%"}) +
        (SELECT count(*) FROM "Facility" WHERE images::text LIKE ${"%" + id + "%"}) +
        (SELECT count(*) FROM "Section" WHERE items::text LIKE ${"%" + id + "%"})
      ) AS n`,
  ]);
  return direct.reduce((a, b) => a + b, 0) + Number(json[0]?.n ?? 0);
}

export async function deleteMedia(id: string) {
  try {
    const user = await assertCapability("media");
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return { ok: false as const, message: "File not found." };
    const used = await mediaUsage(id);
    if (used > 0)
      return { ok: false as const, message: `This file is used in ${used} place(s). Remove it there first.` };
    await prisma.media.delete({ where: { id } });
    await removeStoredFile(media.publicId, media.kind);
    await audit(user, "delete", "media", id, `Deleted file "${media.filename}"`);
    revalidateContent(ALL_TAGS);
    return { ok: true as const, message: "File deleted." };
  } catch (err) {
    if (err instanceof AuthorizationError) return { ok: false as const, message: err.message };
    console.error(err);
    return { ok: false as const, message: "Could not delete." };
  }
}
