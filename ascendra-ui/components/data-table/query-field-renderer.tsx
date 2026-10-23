"use client";

import { useEffect, useMemo } from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import type { DateRange } from "react-day-picker";

import {
  Field,
  FieldLabel,
  FieldHint,
  FieldLabelGroup,
  FieldInfo,
} from "@/ascendra-ui/components/ui/field";
import { Input } from "@/ascendra-ui/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/ascendra-ui/components/ui/select";
import {
  Combobox,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from "@/ascendra-ui/components/ui/combobox";

// Base UI's Chip uses a `value` prop at runtime but the TS type doesn't expose it
const ComboboxChipItem = ComboboxChip as React.ComponentType<
  React.ComponentProps<typeof ComboboxChip> & { value: string }
>;
import { DatePicker } from "@/ascendra-ui/components/date/date-picker";
import { resolveDateBounds } from "@/ascendra-ui/providers/data-table-query/date-expr";
import { DateRangePicker } from "@/ascendra-ui/components/date/date-range-picker";
import { Checkbox } from "@/ascendra-ui/components/ui/checkbox";
import { SortField } from "@/ascendra-ui/components/ui/sort-field";
import { parseSortToken } from "@/ascendra-ui/utils/order-by.util";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/ascendra-ui/components/ui/radio-group";
import type {
  FieldDef,
  QueryParamValues,
  SelectOption,
} from "@/ascendra-ui/providers/data-table-query/data-table-query.types";
import { useOptionalQueryContext } from "@/ascendra-ui/providers/data-table-query/data-table-query.provider";

interface QueryFieldRendererProps {
  field: FieldDef;
}

export function QueryFieldRenderer({ field }: QueryFieldRendererProps) {
  "use no memo";
  const {
    register,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext();
  const ctx = useOptionalQueryContext();
  const allValues = useWatch({ control }) as QueryParamValues;

  const resolvedOptions: SelectOption[] = (() => {
    const def = ctx?.fieldOptions[ctx.activeQuery.id]?.[field.name];
    if (!def) return field.options ?? [];
    return typeof def === "function" ? def(allValues) : def;
  })();

  // When a resolver narrows this field's options (e.g. actions filtered by the chosen entity type),
  // drop a selection that's no longer among them rather than leave an impossible filter in place.
  // Skipped while the list is empty, so a restored value survives options that haven't loaded yet.
  const optionValuesKey = resolvedOptions.map((o) => o.value).join("\u0000");
  const isChoiceField =
    field.type === "select" || field.type === "multiselect" || field.type === "sort";
  useEffect(() => {
    if (!isChoiceField || optionValuesKey === "") return;
    const allowed = new Set(optionValuesKey.split("\u0000"));
    const current = getValues(field.name);
    const opts = { shouldDirty: true, shouldValidate: true };
    if (typeof current === "string" && current !== "" && !allowed.has(current)) {
      setValue(field.name, undefined, opts);
    } else if (Array.isArray(current)) {
      // A sort token names its column before any `:desc`.
      const columnOf = (v: string) =>
        field.type === "sort" ? (parseSortToken(v)?.field ?? v) : v;
      const kept = current.filter((v: string) => allowed.has(columnOf(v)));
      if (kept.length !== current.length) setValue(field.name, kept, opts);
    }
  }, [optionValuesKey, isChoiceField, field.type, field.name, getValues, setValue]);

  const error = errors[field.name];
  const dateBounds = useMemo(
    () => resolveDateBounds({ minDate: field.minDate, maxDate: field.maxDate }),
    [field.minDate, field.maxDate],
  );
  const inputId = `qf-${field.name}`;
  const labelId = `qf-${field.name}-label`;

  return (
    <Field>
      {/* Label + optional subtitle — a checkbox renders its own inline label, unless it has a checkboxLabel */}
      {(field.type !== "checkbox" || field.checkboxLabel) && (
        <FieldLabelGroup>
          <FieldLabel id={labelId} htmlFor={inputId}>
            {field.label}
          </FieldLabel>
          <FieldInfo>{field.info}</FieldInfo>
        </FieldLabelGroup>
      )}

      {/* ── text ─────────────────────────────────────────────────────── */}
      {field.type === "text" && (
        <Input
          id={inputId}
          full
          placeholder={field.placeholder}
          aria-invalid={!!error}
          {...register(field.name)}
        />
      )}

      {/* ── number ───────────────────────────────────────────────────── */}
      {field.type === "number" && (
        <Input
          id={inputId}
          full
          type="number"
          placeholder={field.placeholder}
          aria-invalid={!!error}
          {...register(field.name, {
            setValueAs: (v: string) => (v === "" ? undefined : Number(v)),
          })}
        />
      )}

      {/* ── select ───────────────────────────────────────────────────── */}
      {field.type === "select" && (
        <Controller
          name={field.name}
          control={control}
          render={({ field: f }) => (
            <Select
              value={f.value ?? ""}
              onValueChange={(v) => f.onChange(v === "" ? undefined : v)}
              onOpenChange={(open) => {
                if (!open) f.onBlur();
              }}
            >
              <SelectTrigger
                id={inputId}
                className="w-full"
                aria-invalid={!!error || undefined}
                showClear={!field.required}
              >
                <SelectValue
                  placeholder={field.placeholder ?? `Select ${field.label}`}
                />
              </SelectTrigger>
              <SelectContent>
                {resolvedOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      )}

      {/* ── multiselect ──────────────────────────────────────────────── */}
      {field.type === "multiselect" && (
        <Controller
          name={field.name}
          control={control}
          render={({ field: f }) => {
            const selected: string[] = f.value ?? [];
            return (
              <Combobox multiple value={selected} onValueChange={f.onChange}>
                <ComboboxChips aria-invalid={!!error || undefined}>
                  {selected.map((val) => {
                    const opt = resolvedOptions.find((o) => o.value === val);
                    return (
                      <ComboboxChipItem key={val} value={val}>
                        {opt?.label ?? val}
                      </ComboboxChipItem>
                    );
                  })}
                  <ComboboxChipsInput
                    placeholder={
                      selected.length
                        ? ""
                        : (field.placeholder ?? `Select ${field.label}…`)
                    }
                    onBlur={f.onBlur}
                  />
                </ComboboxChips>
                <ComboboxContent>
                  <ComboboxList>
                    {resolvedOptions.map((opt) => (
                      <ComboboxItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            );
          }}
        />
      )}

      {/* ── sort ─────────────────────────────────────────────────────── */}
      {field.type === "sort" && (
        <Controller
          name={field.name}
          control={control}
          render={({ field: f }) => (
            <SortField
              id={inputId}
              value={f.value ?? []}
              onChange={f.onChange}
              onBlur={f.onBlur}
              options={resolvedOptions}
              maxItems={field.maxItems}
              placeholder={field.placeholder}
              invalid={!!error}
            />
          )}
        />
      )}

      {/* ── date ─────────────────────────────────────────────────────── */}
      {field.type === "date" && (
        <Controller
          name={field.name}
          control={control}
          render={({ field: f }) => (
            <DatePicker
              id={inputId}
              value={f.value as Date | undefined}
              minDate={dateBounds.min}
              maxDate={dateBounds.max}
              showClear={!field.required}
              onChange={f.onChange}
              onBlur={f.onBlur}
              placeholder={field.placeholder}
              editable={field.editable}
              invalid={!!error}
            />
          )}
        />
      )}

      {/* ── daterange ────────────────────────────────────────────────── */}
      {field.type === "daterange" && (
        <Controller
          name={field.name}
          control={control}
          render={({ field: f }) => (
            <DateRangePicker
              value={f.value as DateRange | undefined}
              minDate={dateBounds.min}
              maxDate={dateBounds.max}
              maxRangeDays={field.maxRangeDays}
              showClear={!field.required}
              onChange={f.onChange}
              onBlur={f.onBlur}
              placeholder={field.placeholder}
              editable={field.editable}
              invalid={!!error}
            />
          )}
        />
      )}

      {/* ── checkbox ─────────────────────────────────────────────────── */}
      {field.type === "checkbox" && (
        <Controller
          name={field.name}
          control={control}
          render={({ field: f }) => (
            // Under a label: as tall as an input, so the box sits on the inputs' line.
            <Field orientation="horizontal" className={field.checkboxLabel ? "min-h-8 items-center" : undefined}>
              <Checkbox
                id={inputId}
                checked={f.value as boolean}
                onCheckedChange={f.onChange}
                onBlur={f.onBlur}
                aria-invalid={!!error}
              />
              <FieldLabel
                htmlFor={inputId}
                className="cursor-pointer font-normal"
              >
                {field.checkboxLabel ?? field.label}
              </FieldLabel>
            </Field>
          )}
        />
      )}

      {/* ── radio ────────────────────────────────────────────────────── */}
      {field.type === "radio" && (
        <Controller
          name={field.name}
          control={control}
          render={({ field: f }) => (
            <RadioGroup
              value={f.value ?? ""}
              onValueChange={f.onChange}
              onBlurCapture={(e: React.FocusEvent) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node))
                  f.onBlur();
              }}
              aria-labelledby={labelId}
              className="grid-cols-2 gap-y-1.5"
            >
              {resolvedOptions.map((opt) => (
                <Field
                  key={opt.value}
                  orientation="horizontal"
                  className="items-center"
                >
                  <RadioGroupItem
                    value={opt.value}
                    id={`${inputId}-${opt.value}`}
                  />
                  <FieldLabel
                    htmlFor={`${inputId}-${opt.value}`}
                    className="cursor-pointer font-normal"
                  >
                    {opt.label}
                  </FieldLabel>
                </Field>
              ))}
            </RadioGroup>
          )}
        />
      )}

      <FieldHint
        error={error as { message?: string } | undefined}
        description={field.description}
        mandatory={field.mandatory}
        optional={field.optional}
      />
    </Field>
  );
}
