import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Emblem } from "@/components/site/logo";
import { MotifBand } from "@/components/site/motif";

export default function NotFound() {
  return (
    <main id="main" className="motif-texture flex min-h-dvh flex-col">
      <div className="container-page flex flex-1 flex-col items-center justify-center py-20 text-center">
        <Emblem className="size-16" />
        <p className="font-display text-primary mt-8 text-[clamp(5rem,4rem+6vw,9rem)] leading-none font-semibold">
          404
        </p>
        <h1 className="text-h2 mt-4 font-semibold">This page wandered off</h1>
        <p className="text-lead text-muted-foreground mt-3 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back on the
          path.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/">
              <ArrowLeft aria-hidden /> Back to home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/admissions">
              <Search aria-hidden /> Admissions
            </Link>
          </Button>
        </div>
      </div>
      <MotifBand tone="accent" className="opacity-60" />
    </main>
  );
}
