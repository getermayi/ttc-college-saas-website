"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { MediaLite } from "@/lib/content-types";

type Ctx = { get: (id: string | null | undefined) => MediaLite | undefined; add: (m: MediaLite) => void };
const MediaCtx = createContext<Ctx>({ get: () => undefined, add: () => {} });

/** Keeps known media (for thumbnails in forms) in one place. */
export function MediaProvider({ initial, children }: { initial: MediaLite[]; children: React.ReactNode }) {
  const [map, setMap] = useState(() => new Map(initial.map((m) => [m.id, m])));
  const add = useCallback((m: MediaLite) => setMap((prev) => new Map(prev).set(m.id, m)), []);
  const value = useMemo<Ctx>(() => ({ get: (id) => (id ? map.get(id) : undefined), add }), [map, add]);
  return <MediaCtx value={value}>{children}</MediaCtx>;
}

export const useMediaCache = () => useContext(MediaCtx);
