import type { QueryFn, QueryFunctionMap, QueryParamValues } from '@/ascendra-ui';
import { auditApi } from '../api/audit-api.client';
import type { AuditEvent, AuditQuery, AuditQueryResult } from '../api/audit-api.types';

const PAGE_SIZE = 50;

function toISODate(value: QueryParamValues[string]): string | undefined {
  return value instanceof Date ? value.toISOString() : undefined;
}

function toStringParam(value: QueryParamValues[string]): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function baseQueryFromParams(params: QueryParamValues): Omit<AuditQuery, 'limit' | 'cursor'> {
  return {
    entityType: toStringParam(params.entityType),
    entityId: toStringParam(params.entityId),
    actor: toStringParam(params.actor),
    action: toStringParam(params.action),
    correlationId: toStringParam(params.correlationId),
    occurredAfter: toISODate(params.occurredAfter),
    occurredBefore: toISODate(params.occurredBefore),
  };
}

/**
 * data-table-lab's batch model assumes any batch N is directly addressable;
 * audit-logging.api is keyset-paginated (forward-only cursor, no "give me
 * batch N" concept). This is reconcilable because DataTableQueryProvider
 * only ever steps currentBatch by exactly +/-1 from whatever it currently
 * is, and always resets to batch 1 on a param change (never jumps) — so
 * caching "the cursor to use for batch N" as we walk forward is enough:
 * batch 1 has no cursor, batch N+1 uses whatever batch N's response returned
 * as nextCursor. `totalBatches` is reused purely as a has-next-page signal
 * (see BatchNavigator's `atLast` check) — currentBatch+1 while nextCursor is
 * present, currentBatch itself (disabling Next) once it isn't. This does
 * not attempt to support jumping backward past a batch never visited in
 * this session, which the provider's own navigation model never does.
 */
function createCursorWalkingQueryFn(
  runQuery: (query: AuditQuery) => Promise<AuditQueryResult>,
): QueryFn<AuditEvent> {
  const nextCursorByKey = new Map<string, string>();

  return async (params, batch) => {
    const base = baseQueryFromParams(params);
    const paramsKey = JSON.stringify(base);
    const cursor = batch === 1 ? undefined : nextCursorByKey.get(`${paramsKey}:${batch}`);
    const result = await runQuery({ ...base, limit: PAGE_SIZE, cursor });

    if (result.nextCursor) {
      nextCursorByKey.set(`${paramsKey}:${batch + 1}`, result.nextCursor);
    }

    return {
      data: result.records,
      totalBatches: result.nextCursor ? batch + 1 : batch,
    };
  };
}

export const auditQueryFunctions: QueryFunctionMap<AuditEvent> = {
  recent: createCursorWalkingQueryFn((query) => auditApi.findEvents(query)),
  'by-entity': createCursorWalkingQueryFn((query) => auditApi.findEvents(query)),
  'by-actor-action': createCursorWalkingQueryFn((query) => auditApi.findEvents(query)),
  'by-date-range': createCursorWalkingQueryFn((query) => auditApi.findEvents(query)),
  'by-correlation': createCursorWalkingQueryFn((query) => auditApi.findEvents(query)),
};
