"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import {
  BookOpen,
  CalendarClock,
  ClipboardList,
  ExternalLink,
  FileStack,
  Gavel,
  GraduationCap,
  Images,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareQuote,
  Navigation,
  PanelsTopLeft,
  ScrollText,
  Search,
  Settings2,
  Target,
  Trees,
  UserRound,
  Users,
  CalendarDays,
  HelpCircle,
  Inbox,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SheetContent } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Emblem } from "@/components/site/logo";
import { logoutAction } from "@/lib/admin/auth-actions";

export const ADMIN_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  leads: Inbox,
  campaigns: Target,
  grievances: Gavel,
  sections: PanelsTopLeft,
  pages: ScrollText,
  navigation: Navigation,
  seo: Search,
  programmes: GraduationCap,
  "eligibility-rules": ClipboardList,
  "admission-dates": CalendarClock,
  faculty: Users,
  notices: Megaphone,
  events: CalendarDays,
  albums: Images,
  testimonials: MessageSquareQuote,
  faqs: HelpCircle,
  facilities: Trees,
  downloads: FileStack,
  settings: Settings2,
  media: ImageIcon,
  users: UserRound,
  audit: BookOpen,
};

export type NavGroup = { label: string; items: { href: string; label: string; icon: string; badge?: number }[] };

function NavList({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <nav aria-label="Admin" className="space-y-6">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="px-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{g.label}</p>
          <ul className="mt-2 space-y-0.5">
            {g.items.map((item) => {
              const Icon = ADMIN_ICONS[item.icon] ?? LayoutDashboard;
              const isActive = active(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-surface-2 hover:text-foreground",
                      isActive && "bg-primary-soft text-primary-soft-foreground hover:bg-primary-soft",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge ? <span className="rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">{item.badge}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({
  user,
  groups,
  children,
}: {
  user: { name: string; email: string; roleLabel: string };
  groups: NavGroup[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  const initials = user.name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface lg:flex">
        <Link href="/admin" className="flex items-center gap-2.5 px-5 py-5">
          <Emblem className="size-9" />
          <span className="leading-none">
            <span className="block font-display text-lg font-semibold">TTC Aalo</span>
            <span className="text-xs text-muted-foreground">Admin</span>
          </span>
        </Link>
        <div className="flex-1 overflow-y-auto px-3 pb-6">
          <NavList groups={groups} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl md:px-6">
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger className="grid size-10 place-items-center rounded-xl border border-border lg:hidden" aria-label="Open navigation">
              <Menu className="size-5" aria-hidden />
            </Dialog.Trigger>
            <SheetContent side="left" title="Admin navigation" className="p-3">
              <div className="flex items-center gap-2.5 px-2 py-3">
                <Emblem className="size-8" />
                <span className="font-display text-lg font-semibold">TTC Aalo</span>
              </div>
              <NavList groups={groups} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Dialog.Root>
          <div className="flex-1" />
          <Link href="/" target="_blank" className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium hover:bg-surface-2 sm:inline-flex">
            View site <ExternalLink className="size-3.5" aria-hidden />
          </Link>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-surface-2" aria-label="Account menu">
              <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{initials}</span>
              <span className="hidden text-left text-sm leading-tight sm:block">
                <span className="block font-semibold">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.roleLabel}</span>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/account">
                  <KeyRound /> Change password
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/" target="_blank">
                  <ExternalLink /> View website
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void logoutAction()}>
                <LogOut /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main id="admin-main" className="mx-auto w-full max-w-[92rem] flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
