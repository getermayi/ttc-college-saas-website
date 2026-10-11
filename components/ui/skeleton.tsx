import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div aria-hidden className={cn("bg-surface-2 animate-pulse rounded-xl", className)} {...props} />;
}
