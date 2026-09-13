import { apiClient } from '@/ascendra-ui/lib/api/client';
import type { AuditEventDetail, AuditQuery, AuditQueryResult } from './audit-api.types';

/**
 * Uses the raw apiClient axios instance, not ascendra-ui's `api.get<T>`
 * helper — that helper expects an `{ success, data, meta }` envelope, but
 * audit-logging.api's NestJS controllers return the DTO directly as the
 * response body (confirmed against the controller source; no
 * response-wrapping interceptor exists in ascendra-commons or
 * ascendra-pay-api today). Revisit if that changes.
 */

function toQueryParams(query: AuditQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (query.entityType) params.entityType = query.entityType;
  if (query.entityId) params.entityId = query.entityId;
  if (query.tenantId !== undefined) params.tenantId = query.tenantId ?? 'null';
  if (query.actor) params.actor = query.actor;
  if (query.action) params.action = query.action;
  if (query.correlationId) params.correlationId = query.correlationId;
  if (query.occurredAfter) params.occurredAfter = query.occurredAfter;
  if (query.occurredBefore) params.occurredBefore = query.occurredBefore;
  if (query.limit !== undefined) params.limit = query.limit;
  if (query.cursor) params.cursor = query.cursor;
  return params;
}

export const auditApi = {
  async findEvents(query: AuditQuery): Promise<AuditQueryResult> {
    const { data } = await apiClient.get<AuditQueryResult>('/audit/events', {
      params: toQueryParams(query),
    });
    return data;
  },

  async getEvent(id: string): Promise<AuditEventDetail> {
    const { data } = await apiClient.get<AuditEventDetail>(`/audit/events/${encodeURIComponent(id)}`);
    return data;
  },

  async entityHistory(
    entityType: string,
    entityId: string,
    query: Pick<AuditQuery, 'limit' | 'cursor'> = {},
  ): Promise<AuditQueryResult> {
    const { data } = await apiClient.get<AuditQueryResult>(
      `/audit/entities/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/history`,
      { params: toQueryParams(query) },
    );
    return data;
  },

  async trace(correlationId: string, query: Pick<AuditQuery, 'limit' | 'cursor'> = {}): Promise<AuditQueryResult> {
    const { data } = await apiClient.get<AuditQueryResult>(
      `/audit/trace/${encodeURIComponent(correlationId)}`,
      { params: toQueryParams(query) },
    );
    return data;
  },
};
