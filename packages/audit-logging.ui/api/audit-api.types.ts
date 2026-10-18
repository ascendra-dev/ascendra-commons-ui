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
  /** The Ascendra application that wrote the record (e.g. `ascendra-pay`). */
  application: string;
}

/**
 * One entity type the app audits, with the actions recorded against it. Actions are grouped
 * explicitly, not by name prefix (e.g. `notification.route_set` is recorded on `channel_route`).
 */
export interface AuditCatalogEntry {
  entityType: string;
  actions: string[];
}

/** `GET /audit/catalog` — what the Advanced Filter's selects offer. */
export interface AuditCatalog {
  /** The Entity type / Action selects — empty when the backend has no catalog configured. */
  entries: AuditCatalogEntry[];
  /** The Application select — every application the backend reads (one, until a backend serves several). */
  applications: string[];
}

export interface FieldDiffEntry {
  /** Dot path of the changed leaf, e.g. `address.street` — arrays are compared whole. */
  field: string;
  before: unknown;
  after: unknown;
}

export interface AuditEventDetail extends AuditEvent {
  diff: FieldDiffEntry[];
}

export interface AuditDailyCount {
  /** YYYY-MM-DD, UTC. */
  day: string;
  count: number;
}

/** One row of the Top actions ranking — by (entity type, action), so `created` for invoices and users stay apart. */
export interface AuditTopAction {
  entityType: string;
  action: string;
  count: number;
  /** Distinct actors behind those records. */
  actors: number;
}

export interface AuditKpiValue {
  value: number;
  /** Percent change vs. the equal period just before; null when that period was empty (shown as "new"). */
  deltaPct: number | null;
}

/** Fixed rolling periods, independent of the overview's window. */
export interface AuditStatsKpis {
  /** vs. the 24 hours before */
  records24h: AuditKpiValue;
  /** vs. the 7 days before */
  records7d: AuditKpiValue;
  /** vs. the 30 days before */
  distinctActors30d: AuditKpiValue;
  /** vs. the 30 days before */
  entityTypes30d: AuditKpiValue;
}

/** GET /audit/stats/overview — the Overview's KPI row and volume chart. */
export interface AuditOverviewStats {
  /** Normalized window label, e.g. '30d'. */
  window: string;
  /** Every UTC day in the window, oldest first — 0 on a quiet day. */
  perDay: AuditDailyCount[];
  kpis: AuditStatsKpis;
}

/** GET /audit/stats/top-actions — the Overview's Top actions table (the 10 most frequent). */
export interface AuditTopActionsStats {
  window: string;
  topActions: AuditTopAction[];
}

export interface AuditMonthlyCount {
  /** YYYY-MM, UTC. */
  month: string;
  count: number;
}

/** GET /audit/retention — the Retention & Volume screen. Read-only: records are kept indefinitely. */
export interface AuditRetentionStats {
  /** null when there are no records. */
  oldestRecordAt: string | null;
  rowCount: number;
  /** The whole table's on-disk size (every tenant, indexes included); null when scoped to one tenant. */
  tableSizeBytes: number | null;
  /** Every UTC month since the oldest record, oldest first — 0 on a quiet month. */
  perMonth: AuditMonthlyCount[];
}

/** One (entity type, action) pair in the Actor activity sheet's "By action" table. */
export interface ActorActionCount {
  entityType: string;
  action: string;
  count: number;
  lastOccurredAt: string;
}

/** GET /audit/actors/:actor/activity — the Actor activity sheet. */
export interface ActorActivitySummary {
  actor: string;
  firstSeen: string | null;
  lastSeen: string | null;
  totalRecords: number;
  /** Includes null when the actor touched a platform-level record. */
  tenantsTouched: Array<string | null>;
  byAction: ActorActionCount[];
}
