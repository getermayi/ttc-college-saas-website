import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

type FieldProps = {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
};

/** Accessible field wrapper: label, hint and error are wired with aria attributes by the caller via ids. */
export function Field({ id, label, hint, error, required, optional, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="text-accent ml-0.5" aria-hidden>
            *
          </span>
        ) : null}
        {optional ? (
          <span className="text-muted-foreground ml-1.5 text-xs font-normal">(optional)</span>
        ) : null}
      </Label>
      {hint ? (
        <p id={`${id}-hint`} className="text-muted-foreground -mt-0.5 text-[0.825rem] leading-snug">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-danger flex items-start gap-1.5 text-sm font-medium"
        >
          <svg aria-hidden viewBox="0 0 20 20" className="mt-0.5 size-4 shrink-0" fill="currentColor">
            <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-.75 4.5a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0v-4ZM10 14.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
          </svg>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, opts: { hint?: unknown; error?: unknown }) {
  const ids = [opts.hint ? `${id}-hint` : null, opts.error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}
