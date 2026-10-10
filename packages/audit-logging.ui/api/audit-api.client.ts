import { apiClient } from '@/ascendra-ui/lib/api/client';
import { dateRangeBounds } from '@/ascendra-ui';
import type { CursorListResponse, QueryParamValues } from '@/ascendra-ui';
import type { ActorActivitySummary, AuditEvent, AuditEventDetail, AuditQuery, AuditQueryResult, AuditStats, EntityNeighbors } from './audit-api.types';

/**
 * Uses the raw apiClient axios instance, not ascendra-ui's `api.get<T>`
 * helper — that helper expects an `{ success, data, meta }` envelope, but
 * audit-logging.api's NestJS controllers return the DTO directly as the
 * response body (confirmed against the controller source; no
 * response-wrapping interceptor exists in ascendra-commons or
 * ascendra-pay-api today). Revisit if that changes.
 */

export const auditApi = {
  /**
   * Returns api-contract.md's cursor list shape. audit-logging.api still sends
   * `{ records, nextCursor }` on the wire, so it's reshaped here.
   */
  async findEvents(
    params: QueryParamValues,
    limit: number,
    cursor?: string,
  ): Promise<CursorListResponse<AuditEvent>> {
    // occurredRange is one `daterange` field in the form (see audit-query-defs.ts)
    // but two independent params on the wire — split back out here.
    const { occurredRange, ...filters } = params;
    const { from: occurredAfter, to: occurredBefore } = dateRangeBounds(occurredRange);
    const { data } = await apiClient.get<AuditQueryResult>('/audit/events', {
      params: { ...filters, limit, cursor, occurredAfter, occurredBefore },
    });
    return { data: data.records, meta: { nextCursor: data.nextCursor } };
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
      { params: query },
    );
    return data;
  },

  /**
   * `tenantId` is the current entity's own tenant (the caller already has
   * it from entityHistory's own records) — see EntityNeighbors' doc comment
   * for the tenant-scoping rule this drives.
   */
  async entityNeighbors(entityType: string, entityId: string, tenantId?: string | null): Promise<EntityNeighbors> {
    const params: Record<string, string> = {};
    if (tenantId !== undefined) params.tenantId = tenantId ?? 'null';
    const { data } = await apiClient.get<EntityNeighbors>(
      `/audit/entities/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/neighbors`,
      { params },
    );
    return data;
  },

  async trace(correlationId: string, query: Pick<AuditQuery, 'limit' | 'cursor'> = {}): Promise<AuditQueryResult> {
    const { data } = await apiClient.get<AuditQueryResult>(
      `/audit/trace/${encodeURIComponent(correlationId)}`,
      { params: query },
    );
    return data;
  },

  async actorActivity(
    actor: string,
    query: { occurredAfter?: string; occurredBefore?: string } = {},
  ): Promise<ActorActivitySummary> {
    const { data } = await apiClient.get<ActorActivitySummary>(
      `/audit/actors/${encodeURIComponent(actor)}/activity`,
      { params: query },
    );
    return data;
  },

  async stats(window = '30d', tenantId?: string | null): Promise<AuditStats> {
    const params: Record<string, string> = { window };
    if (tenantId !== undefined) params.tenantId = tenantId ?? 'null';
    const { data } = await apiClient.get<AuditStats>('/audit/stats', { params });
    return data;
  },

  /** GET /audit/events.csv — same filters as findEvents, returns the raw CSV text. */
  async downloadEventsCsv(query: Omit<AuditQuery, 'limit' | 'cursor'>): Promise<Blob> {
    const { data } = await apiClient.get<string>('/audit/events.csv', {
      // axios drops null params; an explicit null tenant (platform-level) must reach the wire as 'null'.
      params: { ...query, tenantId: query.tenantId === null ? 'null' : query.tenantId },
      responseType: 'blob',
    });
    return new Blob([data], { type: 'text/csv' });
  },
};
