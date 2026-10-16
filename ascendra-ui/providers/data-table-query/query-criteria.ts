import { format } from 'date-fns';
import { parseSortToken } from '@/ascendra-ui/utils/order-by.util';
import type { SortDirection } from '@/ascendra-ui/providers/data-table/data-table.types';
import type { FieldDef, FieldOptionsDef, QueryParamValues, SelectOption } from './data-table-query.types';

/** One applied param of a run, as text — e.g. `{ label: 'Entity', text: 'Invoice' }`. */
export interface QueryCriterion {
  name: string;
  label: string;
  text: string;
  /** Required fields can't be muted — the run needs them. */
  required: boolean;
}

/** A run's `sort` field — its columns in priority order. */
export interface QueryOrderBy {
  name: string;
  label: string;
  columns: { label: string; direction: SortDirection }[];
  required: boolean;
}

export interface QueryCriteria {
  criteria: QueryCriterion[];
  orderBy: QueryOrderBy | null;
}

/** How many option labels a multiselect shows before "+N". */
const MULTISELECT_SHOWN = 2;
const DATE_FORMAT = 'MMM d, yyyy';

function toDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && value !== '') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
}

function formatDay(value: unknown): string | undefined {
  const date = toDate(value);
  return date ? format(date, DATE_FORMAT) : undefined;
}

/** A value as criterion text, or undefined when it isn't applied (empty, unchecked, an unset range). */
function valueText(field: FieldDef, value: QueryParamValues[string], options: SelectOption[]): string | undefined {
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;
  switch (field.type) {
    case 'checkbox':
      return value === true ? '' : undefined;
    case 'date':
      return formatDay(value);
    case 'daterange': {
      if (!value || typeof value !== 'object' || Array.isArray(value) || value instanceof Date) return undefined;
      const from = formatDay(value.from);
      const to = formatDay(value.to);
      if (from && to) return `${from} – ${to}`;
      if (from) return `from ${from}`;
      return to ? `until ${to}` : undefined;
    }
    case 'multiselect': {
      if (!Array.isArray(value) || value.length === 0) return undefined;
      const shown = value.slice(0, MULTISELECT_SHOWN).map(labelOf).join(', ');
      const more = value.length - MULTISELECT_SHOWN;
      return more > 0 ? `${shown} +${more}` : shown;
    }
    case 'select':
    case 'radio':
      return typeof value === 'string' && value !== '' ? labelOf(value) : undefined;
    default:
      if (value === undefined || value === null || value === '') return undefined;
      return String(value);
  }
}

/**
 * A run's params as display text — one criterion per applied field, in form order, and its `sort` field as an
 * order-by. Option labels come from `fieldOptions` (resolved with the run's own values) or the field's `options`.
 */
export function describeQueryCriteria(
  fields: FieldDef[],
  params: QueryParamValues | null,
  fieldOptions: Record<string, FieldOptionsDef> = {},
): QueryCriteria {
  const result: QueryCriteria = { criteria: [], orderBy: null };
  if (!params) return result;

  for (const field of fields) {
    const def = fieldOptions[field.name];
    const options = !def ? (field.options ?? []) : typeof def === 'function' ? def(params) : def;
    const value = params[field.name];
    const required = !!field.required;

    if (field.type === 'sort') {
      if (!Array.isArray(value) || value.length === 0) continue;
      const columns = value.flatMap((token) => {
        const key = parseSortToken(token);
        if (!key) return [];
        return [{ label: options.find((o) => o.value === key.field)?.label ?? key.field, direction: key.direction }];
      });
      if (columns.length) result.orderBy = { name: field.name, label: field.label, columns, required };
      continue;
    }

    const text = valueText(field, value, options);
    if (text !== undefined) result.criteria.push({ name: field.name, label: field.label, text, required });
  }
  return result;
}
