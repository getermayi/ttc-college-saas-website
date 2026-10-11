"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { buildSchema, type FormValues } from "@/lib/admin/fields";
import { SETTINGS_FIELDS } from "@/lib/admin/settings-fields";
import { saveSettings } from "@/lib/admin/settings-actions";
import type { MediaLite } from "@/lib/content-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldRenderer } from "./fields/field-renderer";
import { MediaProvider } from "./fields/media-context";

const schema = buildSchema(SETTINGS_FIELDS);

export function SettingsForm({ initial, media }: { initial: FormValues; media: MediaLite[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema as never) as never,
    defaultValues: initial,
    mode: "onTouched",
  });
  const groups = [...new Set(SETTINGS_FIELDS.map((f) => f.group!))];
  const onSubmit = form.handleSubmit(
    (values) =>
      start(async () => {
        const res = await saveSettings(values);
        if (!res.ok) {
          toast.error(res.message);
          if ("fieldErrors" in res && res.fieldErrors)
            for (const [k, m] of Object.entries(res.fieldErrors)) form.setError(k, { message: m });
          return;
        }
        toast.success(res.message);
        form.reset(values);
        router.refresh();
      }),
    () => toast.error("Please fix the highlighted fields."),
  );
  return (
    <MediaProvider initial={media}>
      <FormProvider {...form}>
        <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[12rem_1fr]">
          <nav aria-label="Settings sections" className="hidden lg:block">
            <ul className="sticky top-24 space-y-1 text-sm">
              {groups.map((g) => (
                <li key={g}>
                  <a
                    href={`#${g.replace(/\W+/g, "-")}`}
                    className="text-muted-foreground hover:bg-surface-2 hover:text-foreground block rounded-lg px-3 py-2"
                  >
                    {g.replace(/ \(.*\)/, "")}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="min-w-0 space-y-6">
            {groups.map((g) => (
              <Card key={g} id={g.replace(/\W+/g, "-")} className="scroll-mt-24">
                <CardHeader>
                  <CardTitle>{g}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                  {SETTINGS_FIELDS.filter((f) => f.group === g).map((f) => (
                    <FieldRenderer key={f.name} field={f} relations={{}} />
                  ))}
                </CardContent>
              </Card>
            ))}
            <div className="sticky bottom-4 z-10 flex justify-end">
              <Button type="submit" size="lg" disabled={pending} className="shadow-[var(--shadow-float)]">
                {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />} Save
                settings
              </Button>
            </div>
          </div>
        </form>
      </FormProvider>
    </MediaProvider>
  );
}
