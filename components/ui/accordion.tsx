"use client";

import * as React from "react";
import { Accordion as A } from "radix-ui";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Accordion = A.Root;

export function AccordionItem({ className, ...props }: React.ComponentProps<typeof A.Item>) {
  return <A.Item className={cn("border-border border-b last:border-b-0", className)} {...props} />;
}

export function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof A.Trigger>) {
  return (
    <A.Header className="flex">
      <A.Trigger
        className={cn(
          "group hover:text-primary flex flex-1 items-start justify-between gap-4 py-5 text-left text-[1.0625rem] leading-snug font-semibold transition-colors",
          className,
        )}
        {...props}
      >
        {children}
        <span className="bg-surface-2 text-foreground group-hover:bg-primary-soft group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground mt-0.5 grid size-7 shrink-0 place-items-center rounded-full transition-[transform,background-color] duration-300 group-data-[state=open]:rotate-45">
          <Plus className="size-4" aria-hidden />
        </span>
      </A.Trigger>
    </A.Header>
  );
}

export function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof A.Content>) {
  return (
    <A.Content
      className="overflow-hidden data-[state=closed]:animate-[accordion-up_220ms_ease-out] data-[state=open]:animate-[accordion-down_260ms_cubic-bezier(0.22,1,0.36,1)]"
      {...props}
    >
      <div className={cn("text-muted-foreground pr-10 pb-5 leading-relaxed", className)}>{children}</div>
    </A.Content>
  );
}
