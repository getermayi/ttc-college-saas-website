"use client";

import { useEffect, useRef, useState } from "react";

/** Animated number counter. Shows the final value immediately for reduced-motion users and no-JS. */
export function CountUp({ value, suffix = "" }: { value: string; suffix?: string }) {
  const target = Number.parseInt(value.replace(/[^\d]/g, ""), 10);
  const numeric = /^\d+$/.test(value.trim()) && Number.isFinite(target);
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || !numeric) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const from = target >= 1000 ? target - 25 : 0;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const duration = 1400;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 4);
          setDisplay(String(Math.round(from + (target - from) * eased)));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        setDisplay(String(from));
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [numeric, target]);

  return (
    <span ref={ref} className="tabular-nums">
      <span aria-hidden>{display}</span>
      <span className="sr-only">{value}</span>
      {suffix ? <span aria-hidden>{suffix}</span> : null}
      {suffix ? <span className="sr-only">{suffix}</span> : null}
    </span>
  );
}
