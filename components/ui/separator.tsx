import { cn } from "@/lib/utils";

export function Separator({ className, ...props }: React.ComponentProps<"hr">) {
  return <hr className={cn("border-border border-0 border-t", className)} {...props} />;
}
