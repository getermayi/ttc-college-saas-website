"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark mode"
      className={cn(
        "text-foreground hover:bg-surface-2 grid size-10 place-items-center rounded-full transition-colors",
        className,
      )}
    >
      <Sun className="hidden size-[1.15rem] dark:block" aria-hidden />
      <Moon className="size-[1.15rem] dark:hidden" aria-hidden />
    </button>
  );
}
