"use client";

import { useMemo, useState } from "react";
import { GraduationCap, Mail, Search } from "lucide-react";
import type { FacultyItem } from "@/lib/data/public";
import { STAFF_TYPES, STAFF_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Input, NativeSelect } from "@/components/ui/input";
import { Photo } from "./photo";

export function FacultyDirectory({ people }: { people: FacultyItem[] }) {
  const [type, setType] = useState<string>("ALL");
  const [dept, setDept] = useState("ALL");
  const [q, setQ] = useState("");
  const departments = useMemo(() => [...new Set(people.map((p) => p.department).filter((d): d is string => Boolean(d)))].sort(), [people]);
  const types = STAFF_TYPES.filter((t) => people.some((p) => p.type === t));
  const filtered = people.filter(
    (p) =>
      (type === "ALL" || p.type === type) &&
      (dept === "ALL" || p.department === dept) &&
      (!q.trim() || `${p.name} ${p.designation} ${p.qualifications ?? ""} ${p.specialisation ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())),
  );

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div role="group" aria-label="Filter by role" className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {(["ALL", ...types] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => setType(t)}
              className={cn(
                "h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors",
                type === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary/50",
              )}
            >
              {t === "ALL" ? "Everyone" : STAFF_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="flex gap-3 md:ml-auto">
          {departments.length > 1 ? (
            <div className="w-48">
              <label htmlFor="dept" className="sr-only">
                Department
              </label>
              <NativeSelect id="dept" value={dept} onChange={(e) => setDept(e.target.value)} className="h-11">
                <option value="ALL">All departments</option>
                {departments.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </NativeSelect>
            </div>
          ) : null}
          <div className="relative flex-1 md:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <label htmlFor="staff-search" className="sr-only">
              Search staff
            </label>
            <Input id="staff-search" type="search" placeholder="Search by name or subject" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 pl-10" />
          </div>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {filtered.length} people shown
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((p, i) => (
          <li key={p.id} className="overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow-soft)]">
            <Photo media={p.photo} label={p.photo ? undefined : "Photo"} rounded="rounded-none" className="aspect-[4/4.2]" variant={i} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
            <div className="p-5">
              <p className="font-display text-xl font-semibold leading-tight">{p.name}</p>
              <p className="mt-1 text-sm font-semibold text-accent">{p.designation}</p>
              {p.department ? <p className="text-sm text-muted-foreground">{p.department}</p> : null}
              {p.qualifications ? (
                <p className="mt-3 flex items-start gap-2 text-sm">
                  <GraduationCap className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {p.qualifications}
                </p>
              ) : null}
              {p.specialisation ? <p className="mt-1 text-sm text-muted-foreground">Specialisation: {p.specialisation}</p> : null}
              {p.experience ? <p className="mt-1 text-sm text-muted-foreground">Experience: {p.experience}</p> : null}
              {p.email ? (
                <a href={`mailto:${p.email}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                  <Mail className="size-4" aria-hidden /> Email
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {!filtered.length ? <p className="mt-8 text-center text-muted-foreground">No one matches your search.</p> : null}
    </div>
  );
}
