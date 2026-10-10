import type { CursorListResponse, PageListResponse } from '@/ascendra-ui/lib/api/types';
import type { QueryFn, QueryParamValues } from './data-table-query.types';

/**
 * Adapts a page-based list endpoint (api-contract.md Rule 4) into a QueryFn — batch N is page N,
 * and `meta.totalPages` is a real, exact total.
 */
export function createPageQueryFn<T>(
  runQuery: (params: QueryParamValues, page: number) => Promise<PageListResponse<T>>,
): QueryFn<T> {
  return async (params, batch) => {
    const { data, meta } = await runQuery(params, batch);
    return { data, totalBatches: meta.totalPages };
  };
}

/**
 * Adapts a cursor-based list endpoint (api-contract.md Rule 4) into a QueryFn. DataTableQueryProvider
 * only ever steps currentBatch by +/-1 from wherever it currently is, and resets to batch 1 on a param
 * change (never jumps), so caching "the cursor to use for batch N" as callers walk forward is
 * enough: batch 1 has no cursor, batch N+1 uses whatever batch N's response returned as
 * nextCursor. totalBatches is reused purely as a has-next-page signal — currentBatch+1 while
 * nextCursor is present, currentBatch itself (disabling Next) once it isn't.
 */
export function createCursorQueryFn<T>(
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
