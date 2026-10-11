"use client";

import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2, Wand2 } from "lucide-react";
import type { FieldDef, FormValues, Option } from "@/lib/admin/fields";
import { emptyValues } from "@/lib/admin/fields";
import { ICON_NAMES, Icon } from "@/lib/icons";
import { cn, slugify } from "@/lib/utils";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Field, describedBy } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "./rich-text-editor";
import { MediaField } from "./media-picker";
import { TagsInput } from "./tags-input";

export type RelationOptions = Record<string, Option[]>;

function getError(errors: unknown, name: string): string | undefined {
  const parts = name.split(".");
  let cur: unknown = errors;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return (cur as { message?: string } | undefined)?.message;
}

export function FieldRenderer({
  field,
  prefix = "",
  relations,
}: {
  field: FieldDef;
  prefix?: string;
  relations: RelationOptions;
}) {
  const { control, register, formState, setValue, getValues } = useFormContext<FormValues>();
  const name = `${prefix}${field.name}`;
  const id = `f-${name.replace(/\./g, "-")}`;
  const error = getError(formState.errors, name);
  const aria = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy(id, { hint: field.hint, error }),
  };

  if (field.type === "repeater") return <RepeaterField field={field} name={name} relations={relations} />;

  if (field.type === "boolean") {
    return (
      <div className={cn(field.wide && "md:col-span-2")}>
        <label
          htmlFor={id}
          className="border-border bg-surface flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3"
        >
          <span>
            <span className="block text-sm font-semibold">{field.label}</span>
            {field.hint ? (
              <span id={`${id}-hint`} className="text-muted-foreground text-[0.825rem]">
                {field.hint}
              </span>
            ) : null}
          </span>
          <Controller
            control={control}
            name={name}
            render={({ field: f }) => (
              <Switch
                id={id}
                checked={Boolean(f.value)}
                onCheckedChange={f.onChange}
                aria-describedby={field.hint ? `${id}-hint` : undefined}
              />
            )}
          />
        </label>
        {error ? <p className="text-danger mt-1 text-sm font-medium">{error}</p> : null}
      </div>
    );
  }

  let control_: React.ReactNode;
  switch (field.type) {
    case "textarea":
      control_ = (
        <Textarea
          {...register(name)}
          {...aria}
          rows={field.rows ?? 4}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
        />
      );
      break;
    case "richtext":
      control_ = (
        <Controller
          control={control}
          name={name}
          render={({ field: f }) => (
            <RichTextEditor
              id={id}
              value={String(f.value ?? "")}
              onChange={f.onChange}
              invalid={Boolean(error)}
              describedBy={aria["aria-describedby"]}
            />
          )}
        />
      );
      break;
    case "number":
      control_ = (
        <Input
          {...register(name)}
          {...aria}
          type="number"
          inputMode="decimal"
          step={field.integer ? 1 : "any"}
          min={field.min}
          max={field.max}
          placeholder={field.placeholder}
          className="h-11"
        />
      );
      break;
    case "date":
      control_ = <Input {...register(name)} {...aria} type="date" className="h-11" />;
      break;
    case "datetime":
      control_ = <Input {...register(name)} {...aria} type="datetime-local" className="h-11" />;
      break;
    case "select":
      control_ = (
        <NativeSelect {...register(name)} {...aria} className="h-11">
          {!field.required ? <option value="">—</option> : <option value="">Choose…</option>}
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
      );
      break;
    case "relation":
      control_ = (
        <NativeSelect {...register(name)} {...aria} className="h-11">
          <option value="">{field.required ? "Choose…" : "None"}</option>
          {(relations[field.relation] ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
      );
      break;
    case "icon":
      control_ = (
        <Controller
          control={control}
          name={name}
          render={({ field: f }) => (
            <div className="flex items-center gap-2">
              <span className="bg-primary-soft text-primary-soft-foreground grid size-11 shrink-0 place-items-center rounded-xl">
                <Icon name={String(f.value || "")} className="size-5" />
              </span>
              <NativeSelect id={id} value={String(f.value ?? "")} onChange={f.onChange} className="h-11">
                <option value="">Default</option>
                {ICON_NAMES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}
        />
      );
      break;
    case "tags":
      control_ = (
        <Controller
          control={control}
          name={name}
          render={({ field: f }) => (
            <TagsInput
              id={id}
              value={Array.isArray(f.value) ? (f.value as string[]) : []}
              onChange={f.onChange}
            />
          )}
        />
      );
      break;
    case "image":
    case "file":
      control_ = (
        <Controller
          control={control}
          name={name}
          render={({ field: f }) => (
            <MediaField
              id={id}
              value={String(f.value ?? "")}
              onChange={f.onChange}
              kind={field.type === "image" ? "IMAGE" : "DOCUMENT"}
              invalid={Boolean(error)}
            />
          )}
        />
      );
      break;
    case "slug":
      control_ = (
        <div className="flex gap-2">
          <Input
            {...register(name)}
            {...aria}
            className="h-11 font-mono text-sm"
            placeholder="auto-generated"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 shrink-0 rounded-xl"
            aria-label="Generate from title"
            title="Generate from title"
            onClick={() =>
              setValue(name, slugify(String(getValues(`${prefix}${field.from}`) ?? "")), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            <Wand2 aria-hidden />
          </Button>
        </div>
      );
      break;
    case "color":
      control_ = (
        <Controller
          control={control}
          name={name}
          render={({ field: f }) => (
            <div className="flex gap-2">
              <input
                type="color"
                aria-label={`${field.label} picker`}
                value={/^#[0-9a-f]{6}$/i.test(String(f.value)) ? String(f.value) : "#1f4d3a"}
                onChange={(e) => f.onChange(e.target.value)}
                className="border-border-strong bg-surface h-11 w-14 cursor-pointer rounded-xl border p-1"
              />
              <Input
                {...aria}
                value={String(f.value ?? "")}
                onChange={f.onChange}
                placeholder="#1f4d3a"
                className="h-11 font-mono"
              />
            </div>
          )}
        />
      );
      break;
    default:
      control_ = (
        <Input
          {...register(name)}
          {...aria}
          type={field.type === "email" ? "email" : field.type === "url" ? "text" : "text"}
          placeholder={field.placeholder}
          maxLength={"maxLength" in field ? field.maxLength : undefined}
          className="h-11"
        />
      );
  }

  return (
    <Field
      id={id}
      label={field.label}
      hint={field.hint}
      error={error}
      required={field.required}
      className={cn(field.wide && "md:col-span-2")}
    >
      {control_}
      {"maxLength" in field && field.maxLength && (field.type === "text" || field.type === "textarea") ? (
        <CharCount name={name} max={field.maxLength} />
      ) : null}
    </Field>
  );
}

function CharCount({ name, max }: { name: string; max: number }) {
  const v = useWatch({ name }) as string | undefined;
  const n = (v ?? "").length;
  return (
    <p
      className={cn("text-muted-foreground text-right text-xs", n > max * 0.9 && "text-warning")}
    >{`${n}/${max}`}</p>
  );
}

function RepeaterField({
  field,
  name,
  relations,
}: {
  field: Extract<FieldDef, { type: "repeater" }>;
  name: string;
  relations: RelationOptions;
}) {
  const { control } = useFormContext<FormValues>();
  const { fields, append, remove, move } = useFieldArray({ control, name: name as never });
  const watched = useWatch({ name }) as FormValues[] | undefined;
  return (
    <fieldset className="md:col-span-2">
      <legend className="text-sm font-semibold">{field.label}</legend>
      {field.hint ? <p className="text-muted-foreground mt-0.5 text-[0.825rem]">{field.hint}</p> : null}
      <ol className="mt-3 space-y-3">
        {fields.map((item, i) => {
          const values = watched?.[i] ?? {};
          const preview =
            String(values.title ?? values.label ?? values.category ?? values.caption ?? "") ||
            `${field.itemLabel ?? "Item"} ${i + 1}`;
          return (
            <li key={item.id} className="border-border bg-surface-2/40 rounded-2xl border">
              <details open={fields.length <= 3 || !values.title}>
                <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="bg-surface grid size-6 place-items-center rounded-full text-xs font-semibold">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium">{preview}</span>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Move up"
                    disabled={i === 0}
                    onClick={(e) => (e.preventDefault(), move(i, i - 1))}
                  >
                    <ArrowUp aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Move down"
                    disabled={i === fields.length - 1}
                    onClick={(e) => (e.preventDefault(), move(i, i + 1))}
                  >
                    <ArrowDown aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remove ${preview}`}
                    onClick={(e) => (e.preventDefault(), remove(i))}
                    className="text-danger"
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </summary>
                <div className="border-border grid gap-4 border-t p-4 md:grid-cols-2">
                  {field.fields.map((sub) => (
                    <FieldRenderer
                      key={sub.name}
                      field={sub}
                      prefix={`${name}.${i}.`}
                      relations={relations}
                    />
                  ))}
                </div>
              </details>
            </li>
          );
        })}
      </ol>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => append(emptyValues(field.fields) as never)}
      >
        <Plus aria-hidden /> {field.addLabel ?? `Add ${(field.itemLabel ?? "item").toLowerCase()}`}
      </Button>
    </fieldset>
  );
}
