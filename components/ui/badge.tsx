import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 [&_svg]:size-3.5",
  {
    variants: {
      tone: {
        neutral: "bg-surface-2 text-foreground",
        primary: "bg-primary-soft text-primary-soft-foreground",
        accent: "bg-accent-soft text-accent-soft-foreground",
        info: "bg-info-soft text-info-soft-foreground",
        success: "bg-success-soft text-success-soft-foreground",
        warning: "bg-warning-soft text-warning-soft-foreground",
        danger: "bg-danger-soft text-danger-soft-foreground",
        solid: "bg-primary text-primary-foreground",
        outline: "border border-border-strong text-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
