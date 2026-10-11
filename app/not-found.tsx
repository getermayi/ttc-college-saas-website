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
        <p className="mt-8 font-display text-[clamp(5rem,4rem+6vw,9rem)] font-semibold leading-none text-primary">404</p>
        <h1 className="mt-4 text-h2 font-semibold">This page wandered off</h1>
        <p className="mt-3 max-w-md text-lead text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back on the path.
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
