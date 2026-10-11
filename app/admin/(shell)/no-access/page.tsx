import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "No access" };

export default function NoAccessPage() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <span className="bg-warning-soft text-warning-soft-foreground mx-auto grid size-14 place-items-center rounded-2xl">
        <Lock className="size-6" aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-semibold">You don&apos;t have access to this page</h1>
      <p className="text-muted-foreground mt-2">
        Your role doesn&apos;t include this section. Ask a Super Admin if you need access.
      </p>
      <Button asChild className="mt-6">
        <Link href="/admin">Back to dashboard</Link>
      </Button>
    </div>
  );
}
