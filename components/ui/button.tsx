import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[background-color,color,box-shadow,transform] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-55 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-[1.1em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[var(--shadow-soft)] hover:bg-primary-hover hover:shadow-[var(--shadow-lift)]",
        accent:
          "bg-accent text-accent-foreground shadow-[var(--shadow-soft)] hover:bg-accent-hover hover:shadow-[var(--shadow-lift)]",
        outline:
          "border border-border-strong bg-surface text-foreground hover:border-primary hover:bg-primary-soft hover:text-primary-soft-foreground",
        soft: "bg-primary-soft text-primary-soft-foreground hover:bg-primary hover:text-primary-foreground",
        ghost: "text-foreground hover:bg-surface-2",
        link: "rounded-md px-0 text-primary underline-offset-4 hover:underline",
        danger: "bg-danger text-white hover:opacity-90 dark:text-black",
        light: "bg-[#fbf7f0] text-[#17211c] hover:bg-white shadow-[var(--shadow-soft)]",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-[0.95rem]",
        lg: "h-13 px-7 text-base",
        icon: "size-10 rounded-full",
        "icon-sm": "size-8 rounded-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
