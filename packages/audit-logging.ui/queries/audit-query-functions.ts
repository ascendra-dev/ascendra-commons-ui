import { createCursorQueryFn } from '@/ascendra-ui';
import type { QueryFunctionMap } from '@/ascendra-ui';
import { auditApi } from '../api/audit-api.client';
import type { AuditEvent } from '../api/audit-api.types';

const PAGE_SIZE = 50;

export const auditQueryFunctions: QueryFunctionMap<AuditEvent> = {
  recent: createCursorQueryFn((params, cursor) => auditApi.findEvents(params, PAGE_SIZE, cursor)),
  'advanced-filter': createCursorQueryFn((params, cursor) => auditApi.findEvents(params, PAGE_SIZE, cursor)),
};
