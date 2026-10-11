"use client";

import { useId, useState, useTransition } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Field, describedBy } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { GRIEVANCE_CATEGORIES, GRIEVANCE_ROLES } from "@/lib/constants";
import { grievanceSchema, type GrievanceInput } from "@/lib/validation/enquiry";
import { submitGrievance } from "@/lib/actions/public";
import { Turnstile, turnstileEnabled } from "./turnstile";

export function GrievanceForm() {
  const uid = useId();
  const id = (n: string) => `${uid}-${n}`;
  const [pending, start] = useTransition();
  const [ticket, setTicket] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const { register, handleSubmit, formState, setValue, setError, setFocus, control } =
    useForm<GrievanceInput>({
      resolver: zodResolver(grievanceSchema) as never,
      mode: "onTouched",
      defaultValues: {
        anonymous: false,
        name: "",
        email: "",
        phone: "",
        role: "",
        category: "",
        subject: "",
        description: "",
        consent: false as unknown as true,
        website: "",
      },
    });
  const anonymous = useWatch({ control, name: "anonymous" });
  const consent = useWatch({ control, name: "consent" });
  const e = formState.errors;
  const err = (n: keyof GrievanceInput) => e[n]?.message as string | undefined;
  const a = (n: keyof GrievanceInput) => ({
    id: id(n),
    "aria-invalid": err(n) ? true : undefined,
    "aria-describedby": describedBy(id(n), { error: err(n) }),
  });

  const onSubmit = handleSubmit(
    (values) => {
      if (turnstileEnabled && !token) {
        setFormError("Please complete the quick security check.");
        return;
      }
      setFormError(null);
      start(async () => {
        const res = await submitGrievance({ ...values, turnstileToken: token });
        if (res.ok) {
          setTicket(res.data?.ticket ?? "");
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        setResetKey((k) => k + 1);
        setToken("");
        setFormError(res.message);
        toast.error(res.message);
        if (res.fieldErrors)
          for (const [k, m] of Object.entries(res.fieldErrors))
            setError(k as FieldPath<GrievanceInput>, { message: m });
      });
    },
    (errs) => {
      const first = Object.keys(errs)[0] as FieldPath<GrievanceInput> | undefined;
      if (first) setFocus(first);
    },
  );

  if (ticket !== null) {
    return (
      <div
        role="status"
        className="border-success/30 bg-success-soft text-success-soft-foreground rounded-3xl border p-8 text-center"
      >
        <CircleCheck className="mx-auto size-12" aria-hidden />
        <h2 className="font-display mt-4 text-2xl font-semibold">Your grievance has been submitted</h2>
        {ticket ? (
          <p className="mt-3">
            Your ticket number is{" "}
            <strong className="rounded-lg bg-white/60 px-2 py-0.5 font-mono dark:bg-black/30">
              {ticket}
            </strong>
            . Please note it down.
          </p>
        ) : null}
        <p className="mt-3 opacity-90">
          The grievance redressal committee will review it. If you shared contact details, we will update you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5" aria-label="Grievance form">
      {formError ? (
        <div
          role="alert"
          className="border-danger/30 bg-danger-soft text-danger-soft-foreground rounded-2xl border px-4 py-3 text-sm font-medium"
        >
          {formError}
        </div>
      ) : null}

      <label
        htmlFor={id("anon")}
        className="border-border bg-surface-2/60 flex items-center justify-between gap-4 rounded-2xl border p-4"
      >
        <span className="flex items-start gap-3">
          <ShieldCheck className="text-primary mt-0.5 size-5" aria-hidden />
          <span>
            <span className="block font-semibold">Submit anonymously</span>
            <span className="text-muted-foreground text-sm">
              We won&apos;t store your name or contact details. We also won&apos;t be able to update you.
            </span>
          </span>
        </span>
        <Switch id={id("anon")} checked={anonymous} onCheckedChange={(v) => setValue("anonymous", v)} />
      </label>

      {!anonymous ? (
        <div className="grid gap-5 sm:grid-cols-3">
          <Field id={id("name")} label="Your name" required error={err("name")}>
            <Input {...register("name")} {...a("name")} autoComplete="name" />
          </Field>
          <Field id={id("phone")} label="Mobile number" error={err("phone")}>
            <Input
              {...register("phone")}
              {...a("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
            />
          </Field>
          <Field id={id("email")} label="Email" error={err("email")}>
            <Input {...register("email")} {...a("email")} type="email" autoComplete="email" />
          </Field>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={id("role")} label="I am a" required error={err("role")}>
          <NativeSelect {...register("role")} {...a("role")}>
            <option value="">Choose one</option>
            {GRIEVANCE_ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field id={id("category")} label="Category" required error={err("category")}>
          <NativeSelect {...register("category")} {...a("category")}>
            <option value="">Choose a category</option>
            {GRIEVANCE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field id={id("subject")} label="Subject" required error={err("subject")}>
        <Input {...register("subject")} {...a("subject")} placeholder="A short summary" />
      </Field>
      <Field id={id("description")} label="Describe what happened" required error={err("description")}>
        <Textarea
          {...register("description")}
          {...a("description")}
          rows={6}
          placeholder="Include dates, places and anything that helps us understand."
        />
      </Field>

      <div aria-hidden className="absolute left-[-10000px] size-px overflow-hidden">
        <input {...register("website")} tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label
          htmlFor={id("consent")}
          className="text-muted-foreground flex cursor-pointer items-start gap-3 text-sm"
        >
          <Checkbox
            id={id("consent")}
            className="mt-0.5"
            checked={consent === true}
            onCheckedChange={(v) =>
              setValue("consent", (v === true) as true, { shouldValidate: formState.isSubmitted })
            }
            aria-invalid={err("consent") ? true : undefined}
          />
          I confirm the information I have shared is true to the best of my knowledge.
        </label>
        {err("consent") ? (
          <p role="alert" className="text-danger mt-1.5 text-sm font-medium">
            {err("consent")}
          </p>
        ) : null}
      </div>

      <Turnstile onToken={setToken} resetKey={resetKey} />
      <Button type="submit" size="lg" disabled={pending} className="sm:justify-self-start">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Submit grievance
      </Button>
    </form>
  );
}
