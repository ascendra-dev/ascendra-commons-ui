import { api } from '@/ascendra-ui/lib/api';
import { dateRangeBounds } from '@/ascendra-ui';
import type { CursorListResponse, QueryParamValues } from '@/ascendra-ui';
import type {
  IdentifierRejectionCount,
  RateLimitRejection,
  RejectionVolume,
  RouteRejectionCount,
} from './rate-limiting-api.types';

export const rateLimitApi = {
  /** GET /rate-limits/rejections — the filter form's params; `rejectedRange` is one daterange field, two params on the wire. */
  findRejections(params: QueryParamValues, limit: number, cursor?: string): Promise<CursorListResponse<RateLimitRejection>> {
    const { rejectedRange, ...filters } = params;
    const { from: since, before: until } = dateRangeBounds(rejectedRange);
    return api.get<CursorListResponse<RateLimitRejection>>('/rate-limits/rejections', { ...filters, since, until, limit, cursor });
  },

  /** GET /rate-limits/rejections/trace/:correlationId — every window under one correlation id. */
  trace(correlationId: string, query: { limit?: number; cursor?: string } = {}): Promise<CursorListResponse<RateLimitRejection>> {
    return api.get<CursorListResponse<RateLimitRejection>>(`/rate-limits/rejections/trace/${encodeURIComponent(correlationId)}`, query);
  },

  /** GET /rate-limits/rejections/catalog — total rejections per route since `since`, most first. */
  catalog(since?: Date): Promise<RouteRejectionCount[]> {
    return api.get<RouteRejectionCount[]>('/rate-limits/rejections/catalog', { since });
  },

  /** GET /rate-limits/rejections/top-identifiers — the sources with the most rejections since `since`. */
  topIdentifiers(query: { since?: Date; route?: string; limit?: number } = {}): Promise<IdentifierRejectionCount[]> {
    return api.get<IdentifierRejectionCount[]>('/rate-limits/rejections/top-identifiers', query);
  },

  /** GET /rate-limits/rejections/volume — pass the viewer's IANA zone, so each day is a day on their calendar. */
  volume(timeZone?: string): Promise<RejectionVolume> {
    return api.get<RejectionVolume>('/rate-limits/rejections/volume', timeZone ? { tz: timeZone } : {});
  },
};
