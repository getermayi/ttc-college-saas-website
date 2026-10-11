import type { Metadata } from "next";
import { Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminSkeleton } from "@/components/admin/skeleton";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · TTC Aalo Admin" },
  robots: { index: false, follow: false },
};

// Admin pages always render per request (they depend on the signed-in user).
export const instant = false;

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <TooltipProvider>
      <Suspense fallback={<AdminSkeleton />}>{children}</Suspense>
      <Toaster />
    </TooltipProvider>
  );
}
