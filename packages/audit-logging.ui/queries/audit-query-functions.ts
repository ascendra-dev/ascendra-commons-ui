import type { DateRange } from 'react-day-picker';
import { createCursorWalkingQueryFn } from '@/ascendra-ui';
import type { QueryFunctionMap, QueryParamValues } from '@/ascendra-ui';
import { auditApi } from '../api/audit-api.client';
import type { AuditEvent, AuditQuery } from '../api/audit-api.types';

const PAGE_SIZE = 50;

function toStringParam(value: QueryParamValues[string]): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function baseQueryFromParams(params: QueryParamValues): Omit<AuditQuery, 'limit' | 'cursor'> {
  // occurredRange is one `daterange` field in the form (see audit-query-defs.ts)
  // but two independent params on the wire — split back out here.
  const occurredRange = params.occurredRange as DateRange | undefined;
  return {
    entityType: toStringParam(params.entityType),
    entityId: toStringParam(params.entityId),
    tenantId: toStringParam(params.tenantId),
    actor: toStringParam(params.actor),
    action: toStringParam(params.action),
    correlationId: toStringParam(params.correlationId),
    occurredAfter: occurredRange?.from?.toISOString(),
    occurredBefore: occurredRange?.to?.toISOString(),
  };
}

/**
 * audit-logging.api still predates api-contract.md's `{ data, meta: { nextCursor } }` cursor
 * shape — it returns `{ records, nextCursor }` on the wire — so this adapts the client's response
 * into what the shared `createCursorWalkingQueryFn` expects. Revisit once the API is updated to
 * the contract shape, at which point this can just pass `auditApi.findEvents` through directly.
 */
async function fetchAuditEventsPage(params: QueryParamValues, cursor: string | undefined) {
  const result = await auditApi.findEvents({ ...baseQueryFromParams(params), limit: PAGE_SIZE, cursor });
  return { data: result.records, meta: { nextCursor: result.nextCursor } };
}

export const auditQueryFunctions: QueryFunctionMap<AuditEvent> = {
  recent: createCursorWalkingQueryFn(fetchAuditEventsPage),
  'advanced-filter': createCursorWalkingQueryFn(fetchAuditEventsPage),
};
