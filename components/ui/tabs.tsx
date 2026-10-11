"use client";

import * as React from "react";
import { Tabs as T } from "radix-ui";
import { cn } from "@/lib/utils";

export const Tabs = T.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof T.List>) {
  return (
    <T.List
      className={cn(
        "border-border bg-surface-2 inline-flex items-center gap-1 rounded-full border p-1",
        className,
      )}
      {...props}
    />
  );
}
export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        "text-muted-foreground hover:text-foreground data-[state=active]:bg-surface data-[state=active]:text-foreground inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors data-[state=active]:shadow-[var(--shadow-soft)] [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}
export function TabsContent({ className, ...props }: React.ComponentProps<typeof T.Content>) {
  return <T.Content className={cn("mt-4 focus-visible:outline-none", className)} {...props} />;
}
