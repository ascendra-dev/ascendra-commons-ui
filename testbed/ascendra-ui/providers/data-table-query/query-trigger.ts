import { format, isValid, startOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { resolveDateExpr } from './date-expr';
import {
  isFieldDef,
  type FieldDef,
  type QueryDef,
  type QueryParamValues,
  type TriggerParams,
  type TriggerParamValue,
} from './data-table-query.types';

/** URL key used when a table doesn't set `urlKey`. */
export const DEFAULT_QUERY_URL_KEY = 'q';

/** A trigger that can't run — shown in the table's error state, never retried. */
export class QueryTriggerError extends Error {
  name = 'QueryTriggerError';
}

const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T/;
const RANGE_SEPARATOR = '..';

/** A DateExpr (`'today'`, `'-7d'`, `'2026-07-01'`) or an ISO timestamp, as a Date; null when it's neither. */
function parseDateString(value: string): Date | null {
  if (ISO_TIMESTAMP.test(value)) {
    const date = new Date(value);
    return isValid(date) ? date : null;
  }
  try {
    return resolveDateExpr(value);
  } catch {
    return null;
  }
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return isValid(value) ? value : null;
  return typeof value === 'string' ? parseDateString(value) : null;
}

/** One param in a field's own value shape; undefined when it can't be read as that type. */
function coerceFieldValue(field: FieldDef, value: TriggerParamValue): QueryParamValues[string] {
  switch (field.type) {
    case 'text':
    case 'select':
    case 'radio':
      return typeof value === 'string' ? value : undefined;
    case 'number': {
      const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
      return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
    }
    case 'checkbox':
      if (typeof value === 'boolean') return value;
      return value === 'true' ? true : value === 'false' ? false : undefined;
    case 'multiselect':
    case 'sort':
      if (Array.isArray(value)) return value;
      return typeof value === 'string' ? value.split(',').filter(Boolean) : undefined;
    case 'date':
      return toDate(value) ?? undefined;
    case 'daterange': {
      let from: unknown;
      let to: unknown;
      if (typeof value === 'string') {
        [from, to] = value.split(RANGE_SEPARATOR);
      } else if (value && typeof value === 'object' && 'from' in value) {
        ({ from, to } = value);
      } else {
        return undefined;
      }
      const fromDate = toDate(from);
      const toDateValue = to === undefined || to === '' ? undefined : toDate(to);
      if (!fromDate || toDateValue === null) return undefined;
      return { from: fromDate, to: toDateValue } satisfies DateRange;
    }
  }
}

/**
 * Turns trigger params into a query's param values. Throws QueryTriggerError for a query given params, a param the
 * query doesn't define, or a value that can't be read as its field's type. Rule checks (required, min, …) are left
 * to the caller.
 */
export function coerceTriggerParams(query: QueryDef, params: TriggerParams): QueryParamValues {
  const fields = new Map((query.params ?? []).filter(isFieldDef).map((f) => [f.name, f]));
  const values: QueryParamValues = {};

  for (const [name, value] of Object.entries(params)) {
    if (value === undefined) continue;
    const field = fields.get(name);
    if (!field) {
      throw new QueryTriggerError(
        fields.size === 0
          ? `"${query.title}" takes no parameters, but was given "${name}".`
          : `"${query.title}" has no parameter "${name}".`,
      );
    }
    const coerced = coerceFieldValue(field, value);
    if (coerced === undefined) {
      throw new QueryTriggerError(`"${String(value)}" is not a valid value for ${field.label} ("${name}").`);
    }
    values[name] = coerced;
  }

  return values;
}

/** The query id and raw params a URL carries for `urlKey`; null when it doesn't name a query. */
export function readQuerySearch(
  search: URLSearchParams,
  urlKey: string,
): { queryId: string; params: TriggerParams } | null {
  const queryId = search.get(urlKey);
  if (queryId === null) return null;

  const prefix = `${urlKey}.`;
  const params: TriggerParams = {};
  for (const key of new Set(search.keys())) {
    if (!key.startsWith(prefix)) continue;
    const all = search.getAll(key);
    // A repeated key is a multiselect (`q.status=a&q.status=b`); coercion rejects it on any other field type.
    params[key.slice(prefix.length)] = all.length > 1 ? all : all[0];
  }
  return { queryId, params };
}

function hasUrlKey(key: string, urlKey: string) {
  return key === urlKey || key.startsWith(`${urlKey}.`);
}

/** Removes `urlKey`'s params from the address bar without a navigation — Back still goes to the previous page. */
export function stripQuerySearch(urlKey: string): void {
  const url = new URL(window.location.href);
  const keys = [...new Set(url.searchParams.keys())].filter((key) => hasUrlKey(key, urlKey));
  if (keys.length === 0) return;
  for (const key of keys) url.searchParams.delete(key);
  window.history.replaceState(null, '', url);
}

function encodeDate(value: Date | string): string {
  if (typeof value === 'string') return value;
  return startOfDay(value).getTime() === value.getTime() ? format(value, 'yyyy-MM-dd') : value.toISOString();
}

function encodeParam(value: TriggerParamValue): string {
  if (value instanceof Date) return encodeDate(value);
  if (Array.isArray(value)) return value.join(',');
  if (typeof value === 'object') {
    return `${encodeDate(value.from)}${RANGE_SEPARATOR}${value.to === undefined ? '' : encodeDate(value.to)}`;
  }
  return String(value);
}

/** A run's param values as trigger params — unset values and ranges without a start are left out. */
export function toTriggerParams(values: QueryParamValues): TriggerParams {
  const params: TriggerParams = {};
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) continue;
    if (typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
      if (value.from) params[name] = { from: value.from, to: value.to };
      continue;
    }
    params[name] = value;
  }
  return params;
}

/**
 * The search string (no leading `?`) that triggers `queryId` with `params` on a page whose table uses `urlKey` —
 * e.g. `href={\`/transactions?${buildQuerySearch('by-status', { status: ['failed'] })}\`}`.
 */
export function buildQuerySearch(
  queryId: string,
  params: TriggerParams = {},
  urlKey: string = DEFAULT_QUERY_URL_KEY,
): string {
  const search = new URLSearchParams({ [urlKey]: queryId });
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) search.set(`${urlKey}.${name}`, encodeParam(value));
  }
  return search.toString();
}
