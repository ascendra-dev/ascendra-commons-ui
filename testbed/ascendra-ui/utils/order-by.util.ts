import type { SortDirection } from '@/ascendra-ui/providers/data-table/data-table.types';

export interface SortKey {
  field: string;
  direction: SortDirection;
}

const DESC_SUFFIX = ':desc';
const FIELD = /^[A-Za-z_][\w.]*$/;

/**
 * A sort token — `'amount'` (ascending) or `'issuedAt:desc'` — as a SortKey; null when it isn't one. Tokens are the
 * value of a `sort` query field and the items of api-contract Rule 6's `orderBy` param.
 */
export function parseSortToken(token: string): SortKey | null {
  const direction: SortDirection = token.endsWith(DESC_SUFFIX) ? 'desc' : 'asc';
  const field = direction === 'desc' ? token.slice(0, -DESC_SUFFIX.length) : token;
  return FIELD.test(field) ? { field, direction } : null;
}

/** A SortKey as a token — ascending is the bare field name. */
export function formatSortToken({ field, direction }: SortKey): string {
  return direction === 'desc' ? `${field}${DESC_SUFFIX}` : field;
}

/**
 * The `orderBy` query param for a sort value, in priority order — `['issuedAt:desc', 'amount']` →
 * `'issuedAt:desc,amount'`. Undefined when nothing is sorted, so the param can be left out.
 */
export function toOrderBy(tokens: string[] | undefined): string | undefined {
  return tokens?.length ? tokens.join(',') : undefined;
}
