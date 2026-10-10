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
 * `GET /audit/entities/:type/:id/neighbors` — the adjacent entities of the
 * same type, ordered by last activity (MAX(occurredAt) per entity), not by
 * this entity's own event list. One entity's own audit trail is normally
 * short enough to show in full without pagination (see AuditEntityHistory's
 * own fetch); Newer/Older instead moves between *entities* of the same
 * type — e.g. from one invoice to the next-most-recently-active invoice —
 * which is the actually useful review workflow (going through every
 * flagged invoice/user in turn without returning to the list each time).
 *
 * `tenantId` scopes the neighbor set to the current entity's own tenant;
 * when the current entity's tenant is null (a platform-level entity), the
 * scope is every tenant instead — there's no tenant boundary to enforce for
 * an entity that isn't owned by one.
 */
export interface EntityNeighbors {
  newer: { entityId: string } | null;
  older: { entityId: string } | null;
  /** Count of distinct entities of this type in the same (tenant-scoped) neighbor set. */
  totalRecords: number;
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
