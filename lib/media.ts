import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // stays under Vercel's 4.5 MB request limit

const cloudinaryEnabled = Boolean(process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET));
if (cloudinaryEnabled && !process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export type DetectedType = { mime: string; ext: string; kind: "IMAGE" | "DOCUMENT" };

/** Detects the real file type from its first bytes — never trusts the browser's MIME type. */
export function detectFileType(buf: Buffer): DetectedType | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg", kind: "IMAGE" };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: "image/png", ext: "png", kind: "IMAGE" };
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return { mime: "image/webp", ext: "webp", kind: "IMAGE" };
  if (buf.toString("ascii", 4, 12) === "ftypavif") return { mime: "image/avif", ext: "avif", kind: "IMAGE" };
  if (buf.toString("ascii", 0, 5) === "%PDF-") return { mime: "application/pdf", ext: "pdf", kind: "DOCUMENT" };
  return null;
}

async function imageInfo(buf: Buffer) {
  try {
    const sharp = (await import("sharp")).default;
    const img = sharp(buf, { failOn: "error" });
    const meta = await img.metadata();
    const blur = await img.clone().resize(16, 16, { fit: "inside" }).webp({ quality: 40 }).toBuffer();
    return { width: meta.width ?? null, height: meta.height ?? null, blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}` };
  } catch {
    return null;
  }
}

/** Re-encodes large photos so they stay light for students on slow networks. */
async function optimise(buf: Buffer, type: DetectedType) {
  if (type.kind !== "IMAGE") return buf;
  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(buf).metadata();
    if ((meta.width ?? 0) <= 2400 && buf.length < 1_500_000) return buf;
    return await sharp(buf).rotate().resize({ width: 2400, withoutEnlargement: true }).toFormat(type.ext === "png" ? "png" : "jpeg", { quality: 82 }).toBuffer();
  } catch {
    return buf;
  }
}

export async function storeFile(buf: Buffer, type: DetectedType, originalName: string) {
  const data = await optimise(buf, type);
  const info = type.kind === "IMAGE" ? await imageInfo(data) : null;
  if (type.kind === "IMAGE" && !info) throw new Error("This image looks damaged. Please try another file.");
  const base = path.parse(originalName).name.replace(/[^a-z0-9-_]+/gi, "-").slice(0, 60) || "file";

  if (cloudinaryEnabled) {
    const res = await new Promise<{ secure_url: string; public_id: string; bytes: number }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: process.env.CLOUDINARY_FOLDER ?? "ttc-aalo", resource_type: type.kind === "IMAGE" ? "image" : "raw", public_id: `${base}-${randomUUID().slice(0, 8)}${type.kind === "DOCUMENT" ? `.${type.ext}` : ""}`, overwrite: false },
        (err, result) => (err || !result ? reject(err ?? new Error("Upload failed")) : resolve(result as never)),
      );
      stream.end(data);
    });
    return { url: res.secure_url, publicId: res.public_id, bytes: res.bytes ?? data.length, ...info };
  }

  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_LOCAL_UPLOADS) {
    throw new Error("File storage is not configured. Add Cloudinary keys in your environment settings.");
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const filename = `${base}-${randomUUID().slice(0, 8)}.${type.ext}`;
  await writeFile(path.join(dir, filename), data);
  return { url: `/uploads/${filename}`, publicId: `local:${filename}`, bytes: data.length, ...info };
}

export async function removeStoredFile(publicId: string | null, kind: "IMAGE" | "DOCUMENT") {
  if (!publicId) return;
  try {
    if (publicId.startsWith("local:")) {
      await unlink(path.join(process.cwd(), "public", "uploads", publicId.slice(6)));
    } else if (cloudinaryEnabled) {
      await cloudinary.uploader.destroy(publicId, { resource_type: kind === "IMAGE" ? "image" : "raw" });
    }
  } catch (err) {
    console.error("[media] remove failed", err);
  }
}
