import { createCursorQueryFn } from '@/ascendra-ui';
import type { QueryFunctionMap } from '@/ascendra-ui';
import { idempotencyApi } from '../api/idempotency-key-api.client';
import type { IdempotencyClaim } from '../api/idempotency-key-api.types';

const PAGE_SIZE = 50;

/** One per query — each keeps its own cursors. "In Progress" is a query (no params), so its filter is fixed here. */
export const idempotencyQueryFunctions: QueryFunctionMap<IdempotencyClaim> = {
  recent: createCursorQueryFn((params, cursor) => idempotencyApi.findClaims(params, PAGE_SIZE, cursor)),
  'in-progress': createCursorQueryFn((params, cursor) =>
    idempotencyApi.findClaims({ ...params, status: 'pending' }, PAGE_SIZE, cursor),
  ),
  'advanced-filter': createCursorQueryFn((params, cursor) => idempotencyApi.findClaims(params, PAGE_SIZE, cursor)),
};
