"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-h2 font-semibold">Something went wrong</h1>
      <p className="mt-3 max-w-md text-muted-foreground">Sorry — this page didn&apos;t load properly. It may be your connection. Please try again.</p>
      <Button className="mt-6" onClick={reset}>
        <RotateCcw aria-hidden /> Try again
      </Button>
    </div>
  );
}
