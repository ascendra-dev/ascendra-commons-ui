/**
 * Client-side mirror of audit-logging.api's DTOs (ascendra-commons). Dates are
 * ISO strings here, not Date instances — this is what actually crosses the
 * wire as JSON. Copy-distributed like everything else in this repo, so this
 * duplicates rather than imports from ascendra-commons.
 */

export interface AuditEvent {
  id: string;
  entityType: string;
  entityId: string;
  tenantId: string | null;
  actor: string;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  occurredAt: string;
  reason: string | null;
  correlationId: string;
}

export interface FieldDiffEntry {
  field: string;
  before: unknown;
  after: unknown;
}

export interface AuditEventDetail extends AuditEvent {
  diff: FieldDiffEntry[];
}

/**
 * Filter for GET /audit/events (and, with one extra fixed field each,
 * /entities/:type/:id/history and /trace/:correlationId). Every field is
 * optional and ANDed, matching AuditQuery in audit-logging.core.
 */
export interface AuditQuery {
  entityType?: string;
  entityId?: string;
  tenantId?: string | null;
  actor?: string;
  action?: string;
  correlationId?: string;
  /** ISO date string. */
  occurredAfter?: string;
  /** ISO date string. */
  occurredBefore?: string;
  /** Default 50, capped at 200 server-side. */
  limit?: number;
  /** Opaque — pass back a previous result's nextCursor. */
  cursor?: string;
}

export interface AuditQueryResult {
  /** Newest first. */
  records: AuditEvent[];
  /** Present only when more records match. */
  nextCursor?: string;
}

export interface AuditDailyCount {
  /** YYYY-MM-DD, UTC. */
  day: string;
  count: number;
}

export interface AuditActionCount {
  action: string;
  count: number;
  /** Distinct actors who performed this action within the window. */
  actors: number;
}

export interface AuditActorCount {
  actor: string;
  count: number;
}

export interface AuditTenantCount {
  tenantId: string | null;
  count: number;
}

export interface AuditKpiValue {
  value: number;
  /** Percentage change vs. the prior equivalent period. */
  deltaPct: number;
}

export interface AuditStatsKpis {
  /** vs. yesterday */
  recordsToday: AuditKpiValue;
  /** vs. prior 7 days */
  records7d: AuditKpiValue;
  /** vs. prior 30 days */
  distinctActors30d: AuditKpiValue;
  /** vs. prior 30 days */
  entityTypes30d: AuditKpiValue;
}

/**
 * GET /audit/stats — the Overview screen's full aggregate, as currently
 * proposed as ONE endpoint in audit-logging.api/mocks.html. The mock layer
 * (mocks/audit-events.mock.ts) currently splits delivery into two narrower
 * calls instead — AuditOverviewStats and AuditTopActionsStats — so the
 * dashboard's KPI/chart section and its table can load independently. This
 * type stays as the real API's still-current single-endpoint shape until
 * ascendra-commons's own API is actually redesigned to match the split;
 * update both together when that happens.
 */
export interface AuditStats {
  /** Normalized window label, e.g. '30d'. */
  window: string;
  /** Oldest first. */
  perDay: AuditDailyCount[];
  topActions: AuditActionCount[];
  /** Kept for other consumers (e.g. an actor-focused screen); the Overview screen no longer renders this as its own table. */
  topActors: AuditActorCount[];
  perTenant: AuditTenantCount[];
  kpis: AuditStatsKpis;
}

/** Mock-only narrower slice of AuditStats — the Overview dashboard's KPI row + volume chart. See AuditStats's own doc comment. */
export interface AuditOverviewStats {
  window: string;
  /** Oldest first. */
  perDay: AuditDailyCount[];
  kpis: AuditStatsKpis;
}

/** Mock-only narrower slice of AuditStats — the Overview dashboard's Top Actions table. See AuditStats's own doc comment. */
export interface AuditTopActionsStats {
  window: string;
  topActions: AuditActionCount[];
}

export interface ActorActionCount {
  action: string;
  count: number;
  lastOccurredAt: string;
}

/** GET /audit/actors/:actor/activity — the Actor Activity screen. */
export interface ActorActivitySummary {
  actor: string;
  firstSeen: string | null;
  lastSeen: string | null;
  totalRecords: number;
  /** Includes null when the actor touched a platform-level record. */
  tenantsTouched: Array<string | null>;
  byAction: ActorActionCount[];
}
