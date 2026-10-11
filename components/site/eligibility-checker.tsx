"use client";

import { useId, useMemo, useState } from "react";
import { ArrowDown, CircleAlert, CircleCheck, HelpCircle, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { CATEGORIES, CATEGORY_LABELS, QUALIFICATIONS, type CategoryValue } from "@/lib/constants";
import { checkEligibility, type EligibilityResult } from "@/lib/eligibility";
import type { EligibilityConfig } from "@/lib/data/public";
import { cn } from "@/lib/utils";
import { EnquiryForm, type EnquiryPrefill } from "./enquiry-form";

const TONES: Record<EligibilityResult["status"], { box: string; icon: React.ReactNode }> = {
  eligible: { box: "border-success/30 bg-success-soft text-success-soft-foreground", icon: <CircleCheck className="size-6" aria-hidden /> },
  likely: { box: "border-info/30 bg-info-soft text-info-soft-foreground", icon: <Sparkles className="size-6" aria-hidden /> },
  "not-eligible": { box: "border-warning/30 bg-warning-soft text-warning-soft-foreground", icon: <CircleAlert className="size-6" aria-hidden /> },
  unknown: { box: "border-border bg-surface-2 text-foreground", icon: <HelpCircle className="size-6" aria-hidden /> },
};

export function EligibilityAndEnquiry({
  config,
  whatsappUrl,
  phoneHref,
  showForm = true,
  formTitle = "Send your enquiry",
}: {
  config: EligibilityConfig;
  whatsappUrl?: string | null;
  phoneHref?: string | null;
  showForm?: boolean;
  formTitle?: string;
}) {
  const uid = useId();
  const [programmeId, setProgrammeId] = useState(config[0]?.id ?? "");
  const [qualification, setQualification] = useState("");
  const [percentage, setPercentage] = useState("");
  const [category, setCategory] = useState<CategoryValue | "">("");
  const [inService, setInService] = useState(false);
  const [otherUniversity, setOtherUniversity] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [prefill, setPrefill] = useState<EnquiryPrefill | null>(null);
  const [error, setError] = useState<string | null>(null);

  const programme = useMemo(() => config.find((p) => p.id === programmeId), [config, programmeId]);

  if (!config.length) return null;

  function check(e: React.FormEvent) {
    e.preventDefault();
    if (!programme || !qualification || !category) {
      setError("Please answer the questions above to see your result.");
      return;
    }
    const pct = percentage.trim() === "" ? null : Number(percentage);
    if (pct !== null && (Number.isNaN(pct) || pct < 0 || pct > 100)) {
      setError("Marks must be a number between 0 and 100.");
      return;
    }
    setError(null);
    const r = checkEligibility(programme.eligibilityRules, { qualification, percentage: pct, category, inService, otherUniversity }, programme.shortName);
    setResult(r);
    setPrefill({ programmeId, qualification, category, percentage: pct ?? undefined });
    requestAnimationFrame(() => document.getElementById(`${uid}-result`)?.focus());
  }

  function reset() {
    setResult(null);
    setQualification("");
    setPercentage("");
    setCategory("");
    setInService(false);
    setOtherUniversity(false);
  }

  return (
    <div className="grid gap-8">
      <form onSubmit={check} className="grid gap-5" aria-label="Eligibility checker" noValidate>
        {config.length > 1 ? (
          <Field id={`${uid}-programme`} label="Which programme?" required>
            <NativeSelect id={`${uid}-programme`} value={programmeId} onChange={(e) => setProgrammeId(e.target.value)}>
              {config.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        ) : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id={`${uid}-qual`} label="1. Your highest qualification" required>
            <NativeSelect id={`${uid}-qual`} value={qualification} onChange={(e) => setQualification(e.target.value)}>
              <option value="">Choose one</option>
              {QUALIFICATIONS.map((q) => (
                <option key={q.value} value={q.value}>
                  {q.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field id={`${uid}-pct`} label="2. Marks in that degree (%)" hint="Use your aggregate percentage.">
            <Input
              id={`${uid}-pct`}
              aria-describedby={`${uid}-pct-hint`}
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="0.01"
              placeholder="e.g. 56.5"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
            />
          </Field>
        </div>
        <fieldset>
          <legend className="text-sm font-semibold">
            3. Your category <span className="text-accent" aria-hidden>*</span>
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CATEGORIES.map((c) => (
              <label
                key={c}
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-xl border px-3 py-3 text-center text-sm font-semibold transition-colors",
                  category === c ? "border-primary bg-primary text-primary-foreground" : "border-border-strong bg-surface hover:border-primary/60",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                )}
              >
                <input type="radio" name={`${uid}-cat`} value={c} checked={category === c} onChange={() => setCategory(c)} className="sr-only" />
                {CATEGORY_LABELS[c]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <label htmlFor={`${uid}-inservice`} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
            <Checkbox id={`${uid}-inservice`} checked={inService} onCheckedChange={(v) => setInService(v === true)} />
            I am an in-service teacher
          </label>
          <label htmlFor={`${uid}-otheruni`} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
            <Checkbox id={`${uid}-otheruni`} checked={otherUniversity} onCheckedChange={(v) => setOtherUniversity(v === true)} />
            My degree is not from RGU
          </label>
        </div>
        {error ? (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="lg">
            Check my eligibility
          </Button>
          {result ? (
            <Button type="button" variant="ghost" size="lg" onClick={reset}>
              <RotateCcw aria-hidden /> Start again
            </Button>
          ) : null}
        </div>
      </form>

      <div aria-live="polite">
        {result ? (
          <div
            id={`${uid}-result`}
            tabIndex={-1}
            className={cn("animate-fade-up rounded-3xl border p-6 outline-none md:p-8", TONES[result.status].box)}
          >
            <div className="flex items-start gap-3">
              {TONES[result.status].icon}
              <div>
                <h3 className="font-display text-2xl font-semibold">{result.title}</h3>
                <p className="mt-2 leading-relaxed opacity-95">{result.message}</p>
              </div>
            </div>
            {result.nextSteps.length ? (
              <ul className="mt-5 space-y-2 border-t border-current/15 pt-5 text-sm">
                {result.nextSteps.map((s) => (
                  <li key={s} className="flex gap-2">
                    <span aria-hidden>→</span>
                    {s}
                  </li>
                ))}
              </ul>
            ) : null}
            {showForm ? (
              <Button asChild variant="accent" className="mt-6">
                <a href={`#${uid}-enquiry`}>
                  Send an enquiry with these details <ArrowDown aria-hidden />
                </a>
              </Button>
            ) : null}
            <p className="mt-4 text-xs opacity-80">This is a guide only. Final eligibility is confirmed by the college as per university and NCTE rules.</p>
          </div>
        ) : null}
      </div>

      {showForm ? (
        <div id={`${uid}-enquiry`} className="scroll-mt-28 rounded-3xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)] sm:p-8">
          <h3 className="font-display text-2xl font-semibold">{formTitle}</h3>
          <p className="mt-1.5 text-muted-foreground">Share a few details. Our admissions team will call you back.</p>
          <EnquiryForm
            className="mt-6"
            programmes={config.map((p) => ({ id: p.id, name: p.name, shortName: p.shortName }))}
            prefill={prefill}
            formName="eligibility"
            whatsappUrl={whatsappUrl}
            phoneHref={phoneHref}
          />
        </div>
      ) : null}
    </div>
  );
}
