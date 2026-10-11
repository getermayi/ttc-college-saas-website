"use client";

import * as React from "react";
import { AlertDialog as A } from "radix-ui";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

export const AlertDialog = A.Root;
export const AlertDialogTrigger = A.Trigger;

export function AlertDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof A.Content>) {
  return (
    <A.Portal>
      <A.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" />
      <A.Content
        className={cn(
          "border-border bg-surface fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-6 shadow-[var(--shadow-float)] focus:outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </A.Content>
    </A.Portal>
  );
}
export function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof A.Title>) {
  return <A.Title className={cn("font-sans text-lg font-semibold", className)} {...props} />;
}
export function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof A.Description>) {
  return <A.Description className={cn("text-muted-foreground mt-2 text-sm", className)} {...props} />;
}
export function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}
export function AlertDialogCancel({ className, ...props }: React.ComponentProps<typeof A.Cancel>) {
  return <A.Cancel className={cn(buttonVariants({ variant: "outline" }), className)} {...props} />;
}
export function AlertDialogAction({
  className,
  destructive,
  ...props
}: React.ComponentProps<typeof A.Action> & { destructive?: boolean }) {
  return (
    <A.Action
      className={cn(buttonVariants({ variant: destructive ? "danger" : "primary" }), className)}
      {...props}
    />
  );
}

/** Convenience confirm dialog used for deletes and other irreversible actions. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Delete",
  destructive = true,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction destructive={destructive} onClick={() => void onConfirm()}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
