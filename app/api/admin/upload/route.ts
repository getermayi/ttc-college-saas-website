import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/admin/audit";
import { MAX_UPLOAD_BYTES, detectFileType, storeFile } from "@/lib/media";
import { mediaSelect } from "@/lib/data/public";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "media"))
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  // Same-origin check (defence in depth against CSRF on this cookie-authenticated endpoint).
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host)
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });

  const limit = await rateLimit(`upload:${user.id}`, { limit: 60, windowSeconds: 600 });
  if (!limit.success)
    return NextResponse.json({ error: "Too many uploads. Please wait a few minutes." }, { status: 429 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "The file is too large or the upload was interrupted." },
      { status: 413 },
    );
  }
  const file = form.get("file");
  const alt = String(form.get("alt") ?? "")
    .trim()
    .slice(0, 250);
  const caption =
    String(form.get("caption") ?? "")
      .trim()
      .slice(0, 300) || null;
  const accept = String(form.get("accept") ?? "any");
  if (!(file instanceof File))
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES)
    return NextResponse.json(
      { error: "Files must be 4 MB or smaller. Please compress it and try again." },
      { status: 413 },
    );

  const buf = Buffer.from(await file.arrayBuffer());
  const type = detectFileType(buf);
  if (!type)
    return NextResponse.json(
      { error: "Only JPG, PNG, WebP, AVIF images and PDF documents are allowed." },
      { status: 415 },
    );
  if (accept === "image" && type.kind !== "IMAGE")
    return NextResponse.json({ error: "Please choose an image (JPG, PNG, WebP or AVIF)." }, { status: 415 });
  if (accept === "document" && type.kind !== "DOCUMENT")
    return NextResponse.json({ error: "Please choose a PDF file." }, { status: 415 });
  if (type.kind === "IMAGE" && alt.length < 3)
    return NextResponse.json(
      { error: "Describe the image (alt text) — it helps blind users and Google." },
      { status: 400 },
    );

  try {
    const stored = await storeFile(buf, type, file.name);
    const media = await prisma.media.create({
      data: {
        kind: type.kind,
        url: stored.url,
        publicId: stored.publicId,
        filename: file.name.slice(0, 200),
        mimeType: type.mime,
        bytes: stored.bytes,
        width: stored.width ?? null,
        height: stored.height ?? null,
        blurDataUrl: stored.blurDataUrl ?? null,
        alt: type.kind === "IMAGE" ? alt : alt || file.name,
        caption,
        uploadedById: user.id,
      },
      select: mediaSelect,
    });
    await audit(
      user,
      "upload",
      "media",
      media.id,
      `Uploaded ${type.kind === "IMAGE" ? "image" : "document"} "${media.filename}"`,
    );
    return NextResponse.json({ media });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed." },
      { status: 500 },
    );
  }
}
