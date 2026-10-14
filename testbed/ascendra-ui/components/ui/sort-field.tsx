"use client";

import * as React from "react";
import { LuArrowDownWideNarrow, LuArrowUpNarrowWide } from "react-icons/lu";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
} from "@/ascendra-ui/components/ui/combobox";
import {
  formatSortToken,
  parseSortToken,
  type SortKey,
} from "@/ascendra-ui/utils/order-by.util";

// Base UI's Chip uses a `value` prop at runtime but the TS type doesn't expose it
const ComboboxChipItem = ComboboxChip as React.ComponentType<
  React.ComponentProps<typeof ComboboxChip> & { value: string }
>;

export interface SortFieldOption {
  /** The column name sent to the backend, e.g. `issuedAt`. */
  value: string;
  label: string;
}

export interface SortFieldProps {
  /** Sort tokens in priority order — `'amount'` (ascending) or `'issuedAt:desc'`. See `toOrderBy`. */
  value: string[];
  onChange: (value: string[]) => void;
  options: SortFieldOption[];
  /** Most columns that can be sorted on at once. */
  maxItems?: number;
  placeholder?: string;
  /** Id of the text input — for a label's `htmlFor`. */
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
  onBlur?: () => void;
}

/**
 * Picks the columns to sort by, as chips in priority order — each chip toggles its own direction (ascending when
 * added). The value is a list of sort tokens, ready for api-contract Rule 6's `orderBy` param via `toOrderBy`.
 */
export function SortField({
  value,
  onChange,
  options,
  maxItems,
  placeholder = "Sort by…",
  id,
  invalid,
  disabled,
  onBlur,
}: SortFieldProps) {
  const keys = value
    .map(parseSortToken)
    .filter((key): key is SortKey => key !== null);
  const selectedFields = keys.map((key) => key.field);
  const atMax = maxItems !== undefined && keys.length >= maxItems;
  const labelOf = (field: string) =>
    options.find((o) => o.value === field)?.label ?? field;

  // Selecting keeps each kept column's direction and adds a new one ascending, last.
  const handleFieldsChange = (fields: string[]) => {
    const byField = new Map(keys.map((key) => [key.field, key]));
    onChange(
      fields.map((field) =>
        formatSortToken(byField.get(field) ?? { field, direction: "asc" }),
      ),
    );
  };

  const toggleDirection = (field: string) => {
    onChange(
      keys.map((key) =>
        formatSortToken(
          key.field === field
            ? { field, direction: key.direction === "asc" ? "desc" : "asc" }
            : key,
        ),
      ),
    );
  };

  return (
    <Combobox
      multiple
      value={selectedFields}
      onValueChange={handleFieldsChange}
      disabled={disabled}
    >
      <ComboboxChips aria-invalid={invalid || undefined}>
        {keys.map((key, index) => {
          const label = labelOf(key.field);
          const descending = key.direction === "desc";
          return (
            <ComboboxChipItem
              key={key.field}
              value={key.field}
              data-slot="sort-field-chip"
            >
              {keys.length > 1 && (
                <span className="text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
              )}
              {label}
              <button
                type="button"
                data-slot="sort-field-direction"
                aria-label={`${label}: ${descending ? "descending" : "ascending"} — switch to ${descending ? "ascending" : "descending"}`}
                disabled={disabled}
                // Keep the press on the button — the chip and its input would otherwise take it.
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDirection(key.field);
                }}
                // Same look as the chip's remove button beside it.
                className="flex items-center justify-center rounded-xs p-0.5 opacity-50 hover:bg-black/5 hover:opacity-100 focus-visible:outline-1 dark:hover:bg-white/10"
              >
                {descending ? (
                  <LuArrowDownWideNarrow className="pointer-events-none size-3" />
                ) : (
                  <LuArrowUpNarrowWide className="pointer-events-none size-3" />
                )}
              </button>
            </ComboboxChipItem>
          );
        })}
        <ComboboxChipsInput
          id={id}
          placeholder={keys.length ? "" : placeholder}
          onBlur={onBlur}
        />
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxEmpty>No columns found.</ComboboxEmpty>
        <ComboboxList>
          {options.map((option) => (
            <ComboboxItem
              key={option.value}
              value={option.value}
              disabled={atMax && !selectedFields.includes(option.value)}
            >
              {option.label}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
