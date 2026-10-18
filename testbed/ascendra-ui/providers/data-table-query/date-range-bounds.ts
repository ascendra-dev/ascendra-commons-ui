import { addDays } from 'date-fns';
import type { QueryParamValues } from './data-table-query.types';

/**
 * A `daterange` field's value as half-open bounds for an API, or `{}` when unset. The range is whole days, both
 * inclusive, and each day is held as its local midnight — so `from` is the first instant, and `before` is the start of
 * the day *after* the last one: filter `>= from` and `< before`. (Sending the last day's own midnight as the end
 * would drop that whole day.) Dates stay Dates — axios ISO-formats them.
 */
export function dateRangeBounds(value: QueryParamValues[string]): { from?: Date; before?: Date } {
  if (!value || typeof value !== 'object' || value instanceof Date || Array.isArray(value)) return {};
  return { from: value.from, before: value.to ? addDays(value.to, 1) : undefined };
}
