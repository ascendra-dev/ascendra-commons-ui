import { api, fetchExport } from '@/ascendra-ui/lib/api';
import { dateRangeBounds } from '@/ascendra-ui';
import type { CursorListResponse, ExportResult, QueryParamValues } from '@/ascendra-ui';
import type {
  ActorActivitySummary,
  AuditCatalogEntry,
  AuditEvent,
  AuditEventDetail,
  AuditStats,
} from './audit-api.types';

type CursorPage = { limit?: number; cursor?: string };

export const auditApi = {
  findEvents(
    params: QueryParamValues,
    limit: number,
    cursor?: string,
  ): Promise<CursorListResponse<AuditEvent>> {
    // occurredRange is one `daterange` field in the form (see audit-query-defs.ts)
    // but two independent params on the wire — split back out here.
    const { occurredRange, ...filters } = params;
    const { from: occurredAfter, to: occurredBefore } = dateRangeBounds(occurredRange);
    return api.get<CursorListResponse<AuditEvent>>('/audit/events', {
      ...filters,
      limit,
      cursor,
      occurredAfter,
      occurredBefore,
    });
  },

  /** GET /audit/catalog — the app's configured entity types and their actions (a bare array; `[]` when none). */
  catalog(): Promise<AuditCatalogEntry[]> {
    return api.get<AuditCatalogEntry[]>('/audit/catalog');
  },

  getEvent(id: string): Promise<AuditEventDetail> {
    return api.get<AuditEventDetail>(`/audit/events/${encodeURIComponent(id)}`);
  },

  entityHistory(
    entityType: string,
    entityId: string,
    query: CursorPage = {},
  ): Promise<CursorListResponse<AuditEvent>> {
    return api.get<CursorListResponse<AuditEvent>>(
      `/audit/entities/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/history`,
      query,
    );
  },

  trace(correlationId: string, query: CursorPage = {}): Promise<CursorListResponse<AuditEvent>> {
    return api.get<CursorListResponse<AuditEvent>>(`/audit/trace/${encodeURIComponent(correlationId)}`, query);
  },

  actorActivity(
    actor: string,
    query: { occurredAfter?: string; occurredBefore?: string } = {},
  ): Promise<ActorActivitySummary> {
    return api.get<ActorActivitySummary>(`/audit/actors/${encodeURIComponent(actor)}/activity`, query);
  },

  stats(window = '30d', tenantId?: string | null): Promise<AuditStats> {
    const params: Record<string, string> = { window };
    if (tenantId !== undefined) params.tenantId = tenantId ?? 'null';
    return api.get<AuditStats>('/audit/stats', params);
  },

  /**
   * GET /audit/events.csv (api-contract Rule 9) — every record matching the same filter form params as
   * findEvents, not one page, up to the server's export cap.
   */
  exportEvents(params: QueryParamValues): Promise<ExportResult> {
    const { occurredRange, ...filters } = params;
    const { from: occurredAfter, to: occurredBefore } = dateRangeBounds(occurredRange);
    return fetchExport('/audit/events.csv', { ...filters, occurredAfter, occurredBefore });
  },
};
