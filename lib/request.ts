import "server-only";
import { headers } from "next/headers";
import { createHash } from "node:crypto";

export async function getClientInfo() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  return {
    ip,
    ipHash: createHash("sha256").update(`${ip}:${process.env.AUTH_SECRET ?? ""}`).digest("hex").slice(0, 32),
    userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
  };
}
