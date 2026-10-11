"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "!rounded-2xl !border-border !shadow-[var(--shadow-float)] !font-sans",
        },
      }}
    />
  );
}
