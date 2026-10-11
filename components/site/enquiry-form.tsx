"use client";

import Link from "next/link";
import { useEffect, useId, useState, useTransition } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CircleCheck, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Field, describedBy } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ARUNACHAL_DISTRICTS,
  CATEGORIES,
  CATEGORY_LABELS,
  CONSENT_TEXT,
  CONTACT_TIMES,
  QUALIFICATIONS,
} from "@/lib/constants";
import { enquirySchema, type EnquiryData, type EnquiryInput } from "@/lib/validation/enquiry";
import { submitEnquiry } from "@/lib/actions/public";
import { cn } from "@/lib/utils";
import { readAttribution } from "./utm-capture";
import { Turnstile, turnstileEnabled } from "./turnstile";
import { trackLead } from "./consent";
import { WhatsAppIcon } from "./brand-icons";

export type EnquiryPrefill = Partial<Pick<EnquiryInput, "programmeId" | "qualification" | "category">> & {
  percentage?: number | string;
};

export function EnquiryForm({
  programmes,
  defaultProgrammeId,
  prefill,
  formName = "enquiry",
  whatsappUrl,
  phoneHref,
  className,
}: {
  programmes: { id: string; shortName: string; name: string }[];
  defaultProgrammeId?: string;
  prefill?: EnquiryPrefill | null;
  formName?: string;
  whatsappUrl?: string | null;
  phoneHref?: string | null;
  className?: string;
}) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<{ firstName: string; programme: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const form = useForm<EnquiryInput, unknown, EnquiryData>({
    resolver: zodResolver(enquirySchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      programmeId: defaultProgrammeId ?? (programmes.length === 1 ? programmes[0].id : ""),
      district: "" as EnquiryInput["district"],
      qualification: "",
      percentage: "",
      category: "" as EnquiryInput["category"],
      preferredTime: "Any time",
      message: "",
      consent: false as unknown as true,
      website: "",
    },
  });
  const { register, handleSubmit, formState, setValue, setError, setFocus, control } = form;
  const consent = useWatch({ control, name: "consent" });
  const errors = formState.errors;

  useEffect(() => {
    if (!prefill) return;
    if (prefill.programmeId) setValue("programmeId", prefill.programmeId);
    if (prefill.qualification) setValue("qualification", prefill.qualification);
    if (prefill.category) setValue("category", prefill.category);
    if (prefill.percentage !== undefined && prefill.percentage !== "")
      setValue("percentage", String(prefill.percentage));
  }, [prefill, setValue]);

  const onSubmit = handleSubmit(
    (values) => {
      setFormError(null);
      if (turnstileEnabled && !turnstileToken) {
        setFormError("Please complete the quick security check below.");
        return;
      }
      const attribution = readAttribution() ?? {};
      startTransition(async () => {
        const res = await submitEnquiry({
          ...(values as unknown as EnquiryInput),
          ...attribution,
          formName,
          turnstileToken,
        });
        if (res.ok) {
          setDone(res.data ?? { firstName: "", programme: "" });
          trackLead(res.data?.programme);
          window.scrollTo({
            top: Math.max(
              0,
              (document.getElementById(id("form"))?.getBoundingClientRect().top ?? 0) + window.scrollY - 120,
            ),
            behavior: "smooth",
          });
          return;
        }
        setResetKey((k) => k + 1);
        setTurnstileToken("");
        setFormError(res.message);
        if (res.fieldErrors) {
          for (const [k, msg] of Object.entries(res.fieldErrors))
            setError(k as FieldPath<EnquiryInput>, { message: msg });
        }
        toast.error(res.message);
      });
    },
    (errs) => {
      const first = Object.keys(errs)[0] as FieldPath<EnquiryInput> | undefined;
      if (first) setFocus(first);
    },
  );

  if (done) {
    return (
      <div
        id={id("form")}
        role="status"
        aria-live="polite"
        className={cn(
          "border-success/30 bg-success-soft rounded-3xl border p-7 text-center md:p-10",
          className,
        )}
      >
        <div className="bg-success mx-auto grid size-16 place-items-center rounded-full text-white dark:text-black">
          <CircleCheck className="size-8" aria-hidden />
        </div>
        <h3 className="font-display text-success-soft-foreground mt-5 text-2xl font-semibold">
          Thank you{done.firstName ? `, ${done.firstName}` : ""}! We&apos;ve got your enquiry.
        </h3>
        <p className="text-success-soft-foreground/90 mx-auto mt-3 max-w-md">
          Our admissions team will call you soon{done.programme ? ` about the ${done.programme}` : ""}. If you
          shared your email, a confirmation is on its way.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {whatsappUrl ? (
            <Button asChild size="lg" className="bg-[#1f7a4c] text-white hover:bg-[#19663f]">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon /> Chat on WhatsApp now
              </a>
            </Button>
          ) : null}
          {phoneHref ? (
            <Button asChild size="lg" variant="outline">
              <a href={phoneHref}>
                <Phone aria-hidden /> Call the office
              </a>
            </Button>
          ) : null}
          <Button asChild size="lg" variant="ghost">
            <Link href="/admissions">See the admission steps</Link>
          </Button>
        </div>
      </div>
    );
  }

  const err = (name: keyof EnquiryInput) => errors[name]?.message as string | undefined;
  const aria = (name: keyof EnquiryInput, hint?: unknown) => ({
    id: id(name),
    "aria-invalid": err(name) ? true : undefined,
    "aria-describedby": describedBy(id(name), { hint, error: err(name) }),
  });

  return (
    <form
      id={id("form")}
      onSubmit={onSubmit}
      noValidate
      className={cn("grid gap-5", className)}
      aria-label="Admission enquiry form"
    >
      {formError ? (
        <div
          role="alert"
          className="border-danger/30 bg-danger-soft text-danger-soft-foreground rounded-2xl border px-4 py-3 text-sm font-medium"
        >
          {formError}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={id("name")} label="Full name" required error={err("name")}>
          <Input {...register("name")} {...aria("name")} autoComplete="name" placeholder="e.g. Yamin Bagra" />
        </Field>
        <Field
          id={id("phone")}
          label="Mobile number"
          required
          error={err("phone")}
          hint="We'll call you on this number."
        >
          <div className="relative">
            <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[0.975rem]">
              +91
            </span>
            <Input
              {...register("phone")}
              {...aria("phone", true)}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="98765 43210"
              className="pl-12"
            />
          </div>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={id("programmeId")} label="Programme" required error={err("programmeId")}>
          <NativeSelect {...register("programmeId")} {...aria("programmeId")}>
            <option value="">Choose a programme</option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id={id("district")} label="Your district" required error={err("district")}>
          <NativeSelect {...register("district")} {...aria("district")} autoComplete="address-level2">
            <option value="">Choose district</option>
            {ARUNACHAL_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          id={id("qualification")}
          label="Highest qualification"
          required
          error={err("qualification")}
          className="sm:col-span-2"
        >
          <NativeSelect {...register("qualification")} {...aria("qualification")}>
            <option value="">Choose qualification</option>
            {QUALIFICATIONS.map((q) => (
              <option key={q.value} value={q.value}>
                {q.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id={id("percentage")} label="Marks (%)" optional error={err("percentage")}>
          <Input
            {...register("percentage")}
            {...aria("percentage")}
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            max={100}
            placeholder="e.g. 58"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={id("category")} label="Category" required error={err("category")}>
          <NativeSelect {...register("category")} {...aria("category")}>
            <option value="">Choose category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id={id("preferredTime")} label="Best time to call" required error={err("preferredTime")}>
          <NativeSelect {...register("preferredTime")} {...aria("preferredTime")}>
            {CONTACT_TIMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <Field
        id={id("email")}
        label="Email"
        optional
        error={err("email")}
        hint="Add it to get a confirmation email."
      >
        <Input
          {...register("email")}
          {...aria("email", true)}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
      </Field>

      <details className="group border-border bg-surface-2/50 rounded-2xl border px-4 py-3 [&_summary::-webkit-details-marker]:hidden">
        <summary className="text-foreground cursor-pointer list-none text-sm font-semibold">
          <span className="inline-block transition-transform group-open:rotate-90" aria-hidden>
            ›
          </span>{" "}
          Add a question or message (optional)
        </summary>
        <div className="mt-3">
          <label htmlFor={id("message")} className="sr-only">
            Your question or message
          </label>
          <Textarea
            {...register("message")}
            id={id("message")}
            placeholder="Anything you'd like to ask us?"
            rows={3}
          />
        </div>
      </details>

      {/* Honeypot — hidden from people, tempting for bots */}
      <div aria-hidden className="absolute top-auto left-[-10000px] size-px overflow-hidden">
        <label htmlFor={id("website")}>Website</label>
        <input {...register("website")} id={id("website")} tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label
          htmlFor={id("consent")}
          className="border-border bg-surface has-[[aria-invalid=true]]:border-danger flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm leading-relaxed"
        >
          <Checkbox
            id={id("consent")}
            checked={consent === true}
            onCheckedChange={(v) =>
              setValue("consent", (v === true) as true, { shouldValidate: formState.isSubmitted })
            }
            aria-invalid={err("consent") ? true : undefined}
            aria-describedby={err("consent") ? `${id("consent")}-error` : undefined}
            className="mt-0.5"
          />
          <span className="text-muted-foreground">
            {CONSENT_TEXT.replace(" as explained in the privacy policy.", "")}{" "}
            <Link
              href="/privacy-policy"
              className="text-primary font-medium underline underline-offset-2"
              target="_blank"
            >
              Privacy policy
            </Link>
            .
          </span>
        </label>
        {err("consent") ? (
          <p id={`${id("consent")}-error`} role="alert" className="text-danger mt-1.5 text-sm font-medium">
            {err("consent")}
          </p>
        ) : null}
      </div>

      <Turnstile onToken={setTurnstileToken} resetKey={resetKey} />

      <Button
        type="submit"
        variant="accent"
        size="lg"
        className="h-14 w-full text-base sm:w-auto sm:justify-self-start sm:px-10"
        disabled={pending}
      >
        {pending ? (
          <>
            <Loader2 className="animate-spin" aria-hidden /> Sending…
          </>
        ) : (
          <>
            Send my enquiry <ArrowRight aria-hidden />
          </>
        )}
      </Button>
      <p className="text-muted-foreground -mt-2 text-xs">
        It takes about a minute. We never share your details.
      </p>
    </form>
  );
}
