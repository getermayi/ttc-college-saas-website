"use client";

import * as React from "react";
import { Checkbox as C } from "radix-ui";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({ className, ...props }: React.ComponentProps<typeof C.Root>) {
  return (
    <C.Root
      className={cn(
        "peer grid size-5 shrink-0 place-items-center rounded-md border-2 border-border-strong bg-surface transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[invalid=true]:border-danger data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      <C.Indicator>
        {props.checked === "indeterminate" ? <Minus className="size-3.5" strokeWidth={3} /> : <Check className="size-3.5" strokeWidth={3} />}
      </C.Indicator>
    </C.Root>
  );
}
