"use client";

import * as React from "react";
import { DropdownMenu as M } from "radix-ui";
import { cn } from "@/lib/utils";

export const DropdownMenu = M.Root;
export const DropdownMenuTrigger = M.Trigger;
export const DropdownMenuGroup = M.Group;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof M.Content>) {
  return (
    <M.Portal>
      <M.Content
        sideOffset={sideOffset}
        className={cn(
          "border-border bg-surface z-50 min-w-48 overflow-hidden rounded-xl border p-1.5 text-sm shadow-[var(--shadow-float)]",
          className,
        )}
        {...props}
      />
    </M.Portal>
  );
}
export function DropdownMenuItem({
  className,
  destructive,
  ...props
}: React.ComponentProps<typeof M.Item> & { destructive?: boolean }) {
  return (
    <M.Item
      className={cn(
        "data-[highlighted]:bg-surface-2 [&_svg]:text-muted-foreground flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4",
        destructive && "text-danger [&_svg]:text-danger",
        className,
      )}
      {...props}
    />
  );
}
export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof M.Label>) {
  return (
    <M.Label
      className={cn("text-muted-foreground px-2.5 py-1.5 text-xs font-semibold", className)}
      {...props}
    />
  );
}
export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof M.Separator>) {
  return <M.Separator className={cn("bg-border -mx-1.5 my-1.5 h-px", className)} {...props} />;
}
