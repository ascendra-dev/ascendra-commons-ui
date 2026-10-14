import type { DateRange } from "react-day-picker";
import { differenceInCalendarDays, endOfDay, format } from "date-fns";
import { z } from "zod";

import type { FieldDef } from "./data-table-query.types";
import { resolveDateBounds, resolveDateExpr } from "./date-expr";
import { parseSortToken } from "@/ascendra-ui/utils/order-by.util";

function beforeMessage(label: string, min: Date) {
  return `${label} can't be before ${format(min, "MMM d, yyyy")}`;
}

function afterMessage(label: string, max: Date) {
  return `${label} can't be after ${format(max, "MMM d, yyyy")}`;
}

export function buildZodSchema(
  fields: FieldDef[],
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let schema: z.ZodTypeAny;

    switch (field.type) {
      case "text": {
        // The required check comes first, so an empty required field says "is required"
        // rather than failing a length or pattern rule.
        let s = field.required
          ? z.string().min(1, `${field.label} is required`)
          : z.string();
        if (field.minLength != null)
          s = s.min(
            field.minLength,
            `${field.label} must be at least ${field.minLength} characters`,
          );
        if (field.maxLength != null)
          s = s.max(
            field.maxLength,
            `${field.label} cannot exceed ${field.maxLength} characters`,
          );
        if (field.pattern != null)
          s = s.regex(
            new RegExp(`^(?:${field.pattern})$`),
            field.patternMessage ?? `${field.label} is not in the expected format`,
          );
        // An empty optional field holds "" — it skips the rules instead of failing them.
        schema = field.required ? s : z.union([z.literal(""), s]).optional();
        break;
      }
      case "number": {
        let s = z.coerce.number({ error: "Must be a valid number" });
        if (field.min != null)
          s = s.min(field.min, `Must be at least ${field.min}`);
        if (field.max != null)
          s = s.max(field.max, `Cannot exceed ${field.max}`);
        schema = field.required ? s : s.optional();
        break;
      }
      case "select":
      case "radio": {
        const s = z.string();
        schema = field.required
          ? s.min(1, `${field.label} is required`)
          : s.optional();
        break;
      }
      case "multiselect": {
        let s = z.array(z.string());
        if (field.required) s = s.min(1, `Select at least one ${field.label}`);
        if (field.maxItems != null)
          s = s.max(
            field.maxItems,
            `Select at most ${field.maxItems} ${field.label}`,
          );
        schema = field.required ? s : s.optional();
        break;
      }
      case "sort": {
        let s = z.array(z.string());
        if (field.required) s = s.min(1, `Select at least one ${field.label || "column"} to sort by`);
        if (field.maxItems != null)
          s = s.max(field.maxItems, `Sort by at most ${field.maxItems} columns`);
        // Options aren't checked here — fieldOptions can replace them, and the form drops a column they no
        // longer include. A token must still be well formed, and a column can't be sorted on twice.
        const tokens = s.superRefine((value, ctx) => {
          const seen = new Set<string>();
          for (const token of value) {
            const key = parseSortToken(token);
            if (!key) return ctx.addIssue({ code: "custom", message: `"${token}" isn't a sort column` });
            if (seen.has(key.field))
              return ctx.addIssue({ code: "custom", message: `"${key.field}" is sorted on twice` });
            seen.add(key.field);
          }
        });
        schema = field.required ? tokens : tokens.optional();
        break;
      }
      case "date": {
        const { min, max } = resolveDateBounds(field);
        let s = z.date({
          error: (issue) =>
            issue.input === undefined
              ? `${field.label} is required`
              : "Select a valid date",
        });
        if (min) s = s.min(min, beforeMessage(field.label, min));
        if (max) s = s.max(endOfDay(max), afterMessage(field.label, max));
        schema = field.required ? s : s.optional();
        break;
      }
      case "daterange": {
        // The picker can emit { from: undefined } when a selection is toggled off — that's empty,
        // not a malformed range, so it gets the same "is required" message as a missing value.
        const { min, max } = resolveDateBounds(field);
        // Every range rule reports on the field itself (not on from/to), where the hint shows it.
        const range = z
          .object(
            { from: z.date(), to: z.date().optional() },
            { error: `${field.label} is required` },
          )
          .superRefine(({ from, to }, ctx) => {
            const fail = (message: string) =>
              ctx.addIssue({ code: "custom", message });
            if (field.required && !to)
              return fail(`${field.label} needs an end date`);
            if (min && from < min) return fail(beforeMessage(field.label, min));
            if (max && (to ?? from) > endOfDay(max))
              return fail(afterMessage(field.label, max));
            if (
              field.maxRangeDays &&
              to &&
              differenceInCalendarDays(to, from) + 1 > field.maxRangeDays
            )
              fail(
                `${field.label} can span at most ${field.maxRangeDays} days`,
              );
          });
        schema = z.preprocess(
          (value) => ((value as DateRange | undefined)?.from ? value : undefined),
          field.required ? range : range.optional(),
        );
        break;
      }
      case "checkbox": {
        schema = field.required
          ? z.boolean().refine((v) => v === true, {
              message: `${field.label} is required`,
            })
          : z.boolean().optional();
        break;
      }
      default: {
        schema = z.unknown().optional();
      }
    }

    shape[field.name] = schema;
  }

  return z.object(shape);
}

export function buildDefaultValues(fields: FieldDef[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const field of fields) {
    const value = field.defaultValue;
    switch (field.type) {
      case "text":
      case "select":
      case "radio":
        defaults[field.name] = typeof value === "string" ? value : "";
        break;
      case "number":
        defaults[field.name] = typeof value === "number" ? value : undefined;
        break;
      case "date":
        defaults[field.name] =
          typeof value === "string" ? resolveDateExpr(value) : undefined;
        break;
      case "daterange":
        defaults[field.name] =
          value && typeof value === "object" && !Array.isArray(value)
            ? {
                from: resolveDateExpr(value.from),
                to: value.to ? resolveDateExpr(value.to) : undefined,
              }
            : undefined;
        break;
      case "multiselect":
      case "sort":
        defaults[field.name] = Array.isArray(value) ? value : [];
        break;
      case "checkbox":
        defaults[field.name] = typeof value === "boolean" ? value : false;
        break;
    }
  }
  return defaults;
}
