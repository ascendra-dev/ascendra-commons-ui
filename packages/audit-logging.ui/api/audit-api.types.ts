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
}

export interface AuditActorCount {
  actor: string;
  count: number;
}

export interface AuditTenantCount {
  tenantId: string | null;
  count: number;
}

/** GET /audit/stats — the Overview screen. */
export interface AuditStats {
  /** Normalized window label, e.g. '30d'. */
  window: string;
  /** Oldest first. */
  perDay: AuditDailyCount[];
  topActions: AuditActionCount[];
  topActors: AuditActorCount[];
  perTenant: AuditTenantCount[];
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
