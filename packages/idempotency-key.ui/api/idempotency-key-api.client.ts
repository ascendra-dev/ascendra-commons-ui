import { api } from '@/ascendra-ui/lib/api';
import { dateRangeBounds } from '@/ascendra-ui';
import type { CursorListResponse, QueryParamValues } from '@/ascendra-ui';
import type { ClaimHealthSummary, IdempotencyClaim, RouteClaimCount, SavedResponse } from './idempotency-key-api.types';

const claimPath = (claim: { scope: string; key: string }) =>
  `/idempotency-keys/${encodeURIComponent(claim.scope)}/${encodeURIComponent(claim.key)}`;

export const idempotencyApi = {
  /** GET /idempotency-keys — the filter form's params; `createdRange` is one daterange field, two params on the wire. */
  findClaims(params: QueryParamValues, limit: number, cursor?: string): Promise<CursorListResponse<IdempotencyClaim>> {
    const { createdRange, ...filters } = params;
    const { from: since, before: until } = dateRangeBounds(createdRange);
    return api.get<CursorListResponse<IdempotencyClaim>>('/idempotency-keys', { ...filters, since, until, limit, cursor });
  },

  /** GET /idempotency-keys?status=pending — claims whose request hasn't finished, newest first. */
  inProgress(limit: number): Promise<CursorListResponse<IdempotencyClaim>> {
    return api.get<CursorListResponse<IdempotencyClaim>>('/idempotency-keys', { status: 'pending', limit });
  },

  /** GET /idempotency-keys/trace/:correlationId — every claim raised under one correlation id. */
  trace(correlationId: string, query: { limit?: number; cursor?: string } = {}): Promise<CursorListResponse<IdempotencyClaim>> {
    return api.get<CursorListResponse<IdempotencyClaim>>(`/idempotency-keys/trace/${encodeURIComponent(correlationId)}`, query);
  },

  /** GET /idempotency-keys/:scope/:key — one claim, without its saved body; a 404 once it's cleaned up. */
  claim(claim: { scope: string; key: string }): Promise<IdempotencyClaim> {
    return api.get<IdempotencyClaim>(claimPath(claim));
  },

  /**
   * GET /idempotency-keys/:scope/:key/response — the saved body; a 403 without `idempotency.view-response`, a 404
   * once cleaned up (or while still in progress).
   */
  savedResponse(claim: { scope: string; key: string }): Promise<SavedResponse> {
    return api.get<SavedResponse>(`${claimPath(claim)}/response`);
  },

  /** GET /idempotency-keys/health — claims made since `since`, plus how far back the store goes. */
  health(since?: Date): Promise<ClaimHealthSummary> {
    return api.get<ClaimHealthSummary>('/idempotency-keys/health', { since });
  },

  /** GET /idempotency-keys/routes — per endpoint, most duplicates first. */
  routes(since?: Date): Promise<RouteClaimCount[]> {
    return api.get<RouteClaimCount[]>('/idempotency-keys/routes', { since });
  },
};
