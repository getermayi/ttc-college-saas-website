"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Simple list editor: type and press Enter to add, × to remove. */
export function TagsInput({
  id,
  value,
  onChange,
  placeholder = "Type and press Enter",
}: {
  id: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v || value.includes(v)) return setDraft("");
    onChange([...value, v]);
    setDraft("");
  };
  return (
    <div className="border-border-strong bg-surface focus-within:border-primary focus-within:ring-ring/20 rounded-xl border p-2 focus-within:ring-4">
      {value.length ? (
        <ul className="mb-2 flex flex-col gap-1.5">
          {value.map((t, i) => (
            <li
              key={`${t}-${i}`}
              className="bg-surface-2 flex items-start gap-2 rounded-lg px-3 py-1.5 text-sm"
            >
              <span className="flex-1">{t}</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-danger"
                aria-label={`Remove ${t}`}
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={placeholder}
        className={cn(
          "placeholder:text-muted-foreground h-9 w-full bg-transparent px-2 text-sm outline-none",
        )}
      />
    </div>
  );
}
