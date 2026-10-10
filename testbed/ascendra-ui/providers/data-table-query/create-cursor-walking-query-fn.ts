import type { QueryFn, QueryParamValues } from './data-table-query.types';

/** Wire shape for a cursor-paginated list response (api-contract.md's cursor-based list shape). */
export interface CursorListResponse<T> {
  data: T[];
  meta: { nextCursor?: string };
}

/**
 * Adapts a forward-only, cursor-paginated API into a QueryFn — DataTableQueryProvider only ever
 * steps currentBatch by +/-1 from wherever it currently is, and resets to batch 1 on a param
 * change (never jumps), so caching "the cursor to use for batch N" as callers walk forward is
 * enough: batch 1 has no cursor, batch N+1 uses whatever batch N's response returned as
 * nextCursor. totalBatches is reused purely as a has-next-page signal — currentBatch+1 while
 * nextCursor is present, currentBatch itself (disabling Next) once it isn't.
 */
export function createCursorWalkingQueryFn<T>(
  runQuery: (params: QueryParamValues, cursor: string | undefined) => Promise<CursorListResponse<T>>,
): QueryFn<T> {
  const nextCursorByKey = new Map<string, string>();

  return async (params, batch) => {
    const paramsKey = JSON.stringify(params);
    const cursor = batch === 1 ? undefined : nextCursorByKey.get(`${paramsKey}:${batch}`);
    const response = await runQuery(params, cursor);

    if (response.meta.nextCursor) {
      nextCursorByKey.set(`${paramsKey}:${batch + 1}`, response.meta.nextCursor);
    }

    return {
      data: response.data,
      totalBatches: response.meta.nextCursor ? batch + 1 : batch,
      totalBatchesExact: false,
    };
  };
}
