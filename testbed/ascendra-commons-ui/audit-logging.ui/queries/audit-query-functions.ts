import { createCursorWalkingQueryFn } from '@/ascendra-ui';
import type { QueryFunctionMap } from '@/ascendra-ui';
import { auditApi } from '../api/audit-api.client';
import type { AuditEvent } from '../api/audit-api.types';

const PAGE_SIZE = 50;

export const auditQueryFunctions: QueryFunctionMap<AuditEvent> = {
  recent: createCursorWalkingQueryFn((params, cursor) => auditApi.findEvents(params, PAGE_SIZE, cursor)),
  'advanced-filter': createCursorWalkingQueryFn((params, cursor) => auditApi.findEvents(params, PAGE_SIZE, cursor)),
};
