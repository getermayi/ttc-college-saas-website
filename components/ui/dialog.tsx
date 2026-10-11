"use client";

import * as React from "react";
import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({
  className,
  children,
  hideClose,
  ...props
}: React.ComponentProps<typeof D.Content> & { hideClose?: boolean }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_150ms_ease-out]" />
      <D.Content
        className={cn(
          "border-border bg-surface fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border p-6 shadow-[var(--shadow-float)] focus:outline-none",
          className,
        )}
        {...props}
      >
        {children}
        {hideClose ? null : (
          <D.Close
            className="text-muted-foreground hover:bg-surface-2 hover:text-foreground absolute top-3 right-3 grid size-9 place-items-center rounded-full"
            aria-label="Close"
          >
            <X className="size-4" />
          </D.Close>
        )}
      </D.Content>
    </D.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mb-4 flex flex-col gap-1.5 pr-8", className)} {...props} />;
}
export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}
export function DialogTitle({ className, ...props }: React.ComponentProps<typeof D.Title>) {
  return <D.Title className={cn("font-sans text-lg font-semibold", className)} {...props} />;
}
export function DialogDescription({ className, ...props }: React.ComponentProps<typeof D.Description>) {
  return <D.Description className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

export function SheetContent({
  className,
  children,
  side = "right",
  title,
  ...props
}: React.ComponentProps<typeof D.Content> & { side?: "right" | "left" | "bottom"; title: string }) {
  const sideClass = {
    right:
      "inset-y-0 right-0 h-dvh w-[min(24rem,100%)] border-l data-[state=open]:animate-[sheet-in-right_260ms_cubic-bezier(0.22,1,0.36,1)]",
    left: "inset-y-0 left-0 h-dvh w-[min(20rem,100%)] border-r data-[state=open]:animate-[sheet-in-left_260ms_cubic-bezier(0.22,1,0.36,1)]",
    bottom:
      "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-3xl border-t data-[state=open]:animate-[sheet-in-bottom_260ms_cubic-bezier(0.22,1,0.36,1)]",
  }[side];
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
      <D.Content
        className={cn(
          "border-border bg-background fixed z-50 flex flex-col overflow-y-auto shadow-[var(--shadow-float)] focus:outline-none",
          sideClass,
          className,
        )}
        {...props}
      >
        <D.Title className="sr-only">{title}</D.Title>
        {children}
      </D.Content>
    </D.Portal>
  );
}
