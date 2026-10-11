"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import type { EnquiryForm as EnquiryFormType } from "./enquiry-form";

const EnquiryForm = dynamic(() => import("./enquiry-form").then((m) => m.EnquiryForm), {
  ssr: false,
  loading: () => <FormSkeleton />,
});

function FormSkeleton() {
  return (
    <div aria-hidden className="grid gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="grid gap-5 sm:grid-cols-2">
          <div className="bg-surface-2 h-[4.5rem] animate-pulse rounded-xl" />
          <div className="bg-surface-2 h-[4.5rem] animate-pulse rounded-xl" />
        </div>
      ))}
      <div className="bg-surface-2 h-14 w-56 animate-pulse rounded-full" />
    </div>
  );
}

/**
 * Loads the enquiry form (React Hook Form + Zod) only when it scrolls near the
 * viewport, keeping the first load light on mid-range phones.
 */
export function LazyEnquiryForm(props: ComponentProps<typeof EnquiryFormType>) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={props.className}>
      {show ? <EnquiryForm {...props} className={undefined} /> : <FormSkeleton />}
    </div>
  );
}
