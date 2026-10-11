import "server-only";
import { updateTag } from "next/cache";
import type { CacheTag } from "@/lib/cache-tags";

/** Expires cached public content immediately so admin changes go live on the next request. */
export function revalidateContent(tags: CacheTag[]) {
  for (const tag of new Set(tags)) updateTag(tag);
}
