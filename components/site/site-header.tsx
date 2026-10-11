"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { ArrowRight, Menu, Phone, X } from "lucide-react";
import { cn, telLink } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SheetContent } from "@/components/ui/dialog";
import { ThemeToggle } from "./theme-toggle";

type NavLink = { id: string; label: string; href: string; newTab: boolean };

export function SiteHeader({
  logo,
  nav,
  phone,
  admissionsOpen,
  admissionsBadge,
}: {
  logo: React.ReactNode;
  nav: NavLink[];
  phone: string | null;
  admissionsOpen: boolean;
  admissionsBadge: string | null;
}) {
  const pathname = usePathname();
  const [condensed, setCondensed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        condensed
          ? "bg-background/85 shadow-[0_1px_0_var(--border),0_8px_24px_-12px_rgb(var(--shadow-color)/0.18)] backdrop-blur-xl"
          : "bg-background/0",
      )}
    >
      <div
        className={cn(
          "container-page flex items-center justify-between gap-4 transition-[height] duration-300",
          condensed ? "h-16" : "h-[4.75rem] md:h-20",
        )}
      >
        <Link href="/" className="-m-1 rounded-xl p-1" aria-label="TTC Aalo — home">
          {logo}
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  target={item.newTab ? "_blank" : undefined}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-[0.93rem] font-medium text-foreground/80 transition-colors hover:bg-surface-2 hover:text-foreground",
                    "aria-[current=page]:text-foreground aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-3.5 aria-[current=page]:after:-bottom-0.5 aria-[current=page]:after:h-0.5 aria-[current=page]:after:rounded-full aria-[current=page]:after:bg-accent",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle className="hidden sm:grid" />
          {phone ? (
            <a
              href={telLink(phone) ?? undefined}
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-foreground hover:bg-surface-2 xl:inline-flex"
            >
              <Phone className="size-4 text-primary" aria-hidden />
              {phone}
            </a>
          ) : null}
          <Button asChild variant="accent" size="sm" className="hidden sm:inline-flex">
            <Link href="/enquire">
              {admissionsOpen ? "Apply / Enquire" : "Enquire"}
              <ArrowRight aria-hidden />
            </Link>
          </Button>

          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="grid size-11 place-items-center rounded-full border border-border bg-surface text-foreground shadow-[var(--shadow-soft)] lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" aria-hidden />
              </button>
            </Dialog.Trigger>
            <SheetContent side="right" title="Menu" className="p-0">
              <div className="flex h-16 items-center justify-between border-b border-border px-5">
                <span className="font-display text-lg font-semibold">Menu</span>
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  <Dialog.Close className="grid size-10 place-items-center rounded-full hover:bg-surface-2" aria-label="Close menu">
                    <X className="size-5" aria-hidden />
                  </Dialog.Close>
                </div>
              </div>
              {admissionsOpen && admissionsBadge ? (
                <div className="mx-5 mt-5 rounded-2xl bg-primary-soft px-4 py-3 text-sm font-semibold text-primary-soft-foreground">
                  <span className="mr-2 inline-block size-2 animate-pulse rounded-full bg-success align-middle" aria-hidden />
                  {admissionsBadge}
                </div>
              ) : null}
              <nav aria-label="Mobile" className="px-3 py-4">
                <ul className="flex flex-col">
                  <li>
                    <Link href="/" className="flex items-center justify-between rounded-xl px-3 py-3.5 text-lg font-medium hover:bg-surface-2" aria-current={pathname === "/" ? "page" : undefined}>
                      Home
                    </Link>
                  </li>
                  {nav.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        target={item.newTab ? "_blank" : undefined}
                        aria-current={isActive(item.href) ? "page" : undefined}
                        className="flex items-center justify-between rounded-xl px-3 py-3.5 text-lg font-medium hover:bg-surface-2 aria-[current=page]:bg-surface-2 aria-[current=page]:text-primary"
                      >
                        {item.label}
                        <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="mt-auto grid gap-2 border-t border-border p-5">
                <Button asChild variant="accent" size="lg">
                  <Link href="/enquire">Check eligibility & enquire</Link>
                </Button>
                {phone ? (
                  <Button asChild variant="outline" size="lg">
                    <a href={telLink(phone) ?? undefined}>
                      <Phone aria-hidden /> Call {phone}
                    </a>
                  </Button>
                ) : null}
              </div>
            </SheetContent>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
