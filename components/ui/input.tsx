import * as React from "react";
import { cn } from "@/lib/utils";

export const fieldBase =
  "w-full rounded-xl border border-border-strong bg-surface px-3.5 text-[0.975rem] text-foreground shadow-[inset_0_1px_0_rgb(0_0_0/0.02)] transition-[border-color,box-shadow] placeholder:text-muted-foreground/80 hover:border-primary/50 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/20";

export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(fieldBase, "h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea data-slot="textarea" className={cn(fieldBase, "min-h-28 py-3 leading-relaxed", className)} {...props} />
  );
}

/** Native select: fastest and most accessible option on mid-range Android phones. */
export function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(fieldBase, "h-12 cursor-pointer appearance-none pr-10", className)}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      >
        <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    </div>
  );
}
