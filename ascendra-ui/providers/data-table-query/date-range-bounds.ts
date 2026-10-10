import type { QueryParamValues } from './data-table-query.types';

/** Bounds of a `daterange` field's value, or `{}` when unset. Dates stay Dates — axios ISO-formats them. */
export function dateRangeBounds(value: QueryParamValues[string]): { from?: Date; to?: Date } {
  if (!value || typeof value !== 'object' || value instanceof Date || Array.isArray(value)) return {};
  return { from: value.from, to: value.to };
}
