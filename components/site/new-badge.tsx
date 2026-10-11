"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const noop = () => () => {};

/** "New" badge for items published in the last 7 days. Computed in the browser so cached pages stay accurate. */
export function NewBadge({ date, days = 7, variant = "default" }: { date: string; days?: number; variant?: "default" | "light" }) {
  const isNew = useSyncExternalStore(
    noop,
    () => Date.now() - new Date(date).getTime() < days * 86_400_000,
    () => false,
  );
  if (!isNew) return null;
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider",
        variant === "light" ? "bg-[#f0b597] text-[#3b1a0b]" : "bg-accent text-accent-foreground",
      )}
    >
      New
    </span>
  );
}
