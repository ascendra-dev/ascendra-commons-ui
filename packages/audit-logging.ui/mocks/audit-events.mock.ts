import type { DateRange } from 'react-day-picker';
import type { CursorListResponse, ExportResult, QueryFn, QueryFunctionMap, QueryParamValues } from '@/ascendra-ui';
import { objectsToCsv } from '@/ascendra-ui/utils/common.util';
import { diffFields } from '../api/audit-diff.util';
import type {
  ActorActivitySummary,
  AuditActionCount,
  AuditActorCount,
  AuditCatalogEntry,
  AuditDailyCount,
  AuditEvent,
  AuditEventDetail,
  AuditOverviewStats,
  AuditStats,
  AuditTenantCount,
  AuditTopActionsStats,
  EntityNeighbors,
} from '../api/audit-api.types';

const NOW = Date.now();
const hoursAgo = (h: number) => new Date(NOW - h * 60 * 60 * 1000).toISOString();

/** Fixture ids look like the real thing (uuids) — see AUI-004 in this repo's hard-instructions.md. */
export const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e23',
    entityType: 'user',
    entityId: 'c9e3f6d4-7b5f-4c8a-9d4e-8f3b2a6c9d01',
    tenantId: 'tenant_globex',
    actor: 'admin@globex.test',
    action: 'user.profile_updated',
    before: {
      name: 'Ayesha Noor',
      address: { street: '12 Old Rd', city: 'Lahore', geo: { lat: 31.52, lng: 74.35 } },
      roles: ['viewer', 'billing_admin'],
    },
    after: {
      name: 'Ayesha Noor',
      address: { street: '7 New St', city: 'Lahore', geo: { lat: 31.55, lng: 74.35 } },
      roles: ['viewer', 'billing_admin'],
    },
    occurredAt: hoursAgo(0.5),
    reason:
      'Moved to the new Gulberg office after the lease on Old Rd ended; geo pin re-captured on site by the facilities team, and the billing address will follow in a separate change once finance signs off.',
    correlationId: '7d2e9a41-6c3b-4f8e-a1d5-2b9c8e7f6a23',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e01',
    entityType: 'invoice',
    entityId: 'a7c1e4b2-5f3d-4a8e-9b2c-6d1f0e4a7c01',
    tenantId: 'tenant_acme',
    actor: 'jane@acme.test',
    action: 'invoice.created',
    before: null,
    after: { status: 'draft', amount: 4200, currency: 'USD' },
    occurredAt: hoursAgo(120),
    reason: null,
    correlationId: '5b9e1c04-2a71-4c3e-9f8a-d3b6e0c1a1a1',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e02',
    entityType: 'invoice',
    entityId: 'a7c1e4b2-5f3d-4a8e-9b2c-6d1f0e4a7c01',
    tenantId: 'tenant_acme',
    actor: 'jane@acme.test',
    action: 'invoice.issued',
    before: { status: 'draft', amount: 4200, currency: 'USD' },
    after: { status: 'issued', amount: 4200, currency: 'USD' },
    occurredAt: hoursAgo(119),
    reason: null,
    correlationId: '5b9e1c04-2a71-4c3e-9f8a-d3b6e0c1a1a1',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e15',
    entityType: 'invoice',
    entityId: 'a7c1e4b2-5f3d-4a8e-9b2c-6d1f0e4a7c01',
    tenantId: 'tenant_acme',
    actor: 'customer_4471',
    action: 'invoice.viewed',
    before: null,
    after: null,
    occurredAt: hoursAgo(115),
    reason: null,
    correlationId: 'b2e5f8a1-3c6d-4b9e-8f2a-5c7d0e3b6a11',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e16',
    entityType: 'invoice',
    entityId: 'a7c1e4b2-5f3d-4a8e-9b2c-6d1f0e4a7c01',
    tenantId: 'tenant_acme',
    actor: 'system',
    action: 'invoice.reminder_sent',
    before: null,
    after: null,
    occurredAt: hoursAgo(110),
    reason: null,
    correlationId: 'c3f6a9b2-4d7e-4c0f-9a3b-6d8e1f4c7b12',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e17',
    entityType: 'invoice',
    entityId: 'a7c1e4b2-5f3d-4a8e-9b2c-6d1f0e4a7c01',
    tenantId: 'tenant_acme',
    actor: 'system',
    action: 'invoice.payment_failed',
    before: { status: 'issued', amount: 4200, currency: 'USD' },
    after: { status: 'issued', amount: 4200, currency: 'USD', lastPaymentError: 'card_declined' },
    occurredAt: hoursAgo(105),
    reason: 'Card declined by issuing bank',
    correlationId: 'd4a7b0c3-5e8f-4d1a-0b4c-7e9f2a5d8c13',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e18',
    entityType: 'invoice',
    entityId: 'a7c1e4b2-5f3d-4a8e-9b2c-6d1f0e4a7c01',
    tenantId: 'tenant_acme',
    actor: 'system',
    action: 'invoice.reminder_sent',
    before: null,
    after: null,
    occurredAt: hoursAgo(100),
    reason: null,
    correlationId: 'e5b8c1d4-6f9a-4e2b-1c5d-8f0a3b6e9d14',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e03',
    entityType: 'invoice',
    entityId: 'a7c1e4b2-5f3d-4a8e-9b2c-6d1f0e4a7c01',
    tenantId: 'tenant_acme',
    actor: 'system',
    action: 'invoice.void',
    before: { status: 'issued', amount: 4200, currency: 'USD' },
    after: { status: 'void', amount: 4200, currency: 'USD' },
    occurredAt: hoursAgo(96),
    reason: 'Duplicate invoice raised in error',
    correlationId: '71a29f6e-0c3d-4b8a-9e1f-2c5d6a7b8c02',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e04',
    entityType: 'payment-link',
    entityId: 'b8d2f5c3-6a4e-4b9f-8c3d-7e2a1f5b8d01',
    tenantId: 'tenant_acme',
    actor: 'jane@acme.test',
    action: 'payment-link.created',
    before: null,
    after: { amount: 1500, currency: 'USD', expiresAt: hoursAgo(-168) },
    occurredAt: hoursAgo(88),
    reason: null,
    correlationId: '3f10a2c7-4b8d-4e9a-9c1f-5d6e7a8b9c03',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e13',
    entityType: 'payment-link',
    entityId: 'b8d2f5c3-6a4e-4b9f-8c3d-7e2a1f5b8d01',
    tenantId: 'tenant_acme',
    actor: 'system',
    action: 'payment-link.reminder_sent',
    before: null,
    after: null,
    occurredAt: hoursAgo(87.5),
    reason: null,
    correlationId: '3f10a2c7-4b8d-4e9a-9c1f-5d6e7a8b9c03',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e05',
    entityType: 'payment-link',
    entityId: 'b8d2f5c3-6a4e-4b9f-8c3d-7e2a1f5b8d01',
    tenantId: 'tenant_acme',
    actor: 'customer_9021',
    action: 'payment-link.resolved',
    before: { status: 'active', amount: 1500, currency: 'USD' },
    after: { status: 'resolved', amount: 1500, currency: 'USD', resolvedAt: hoursAgo(87) },
    occurredAt: hoursAgo(87),
    reason: null,
    correlationId: '3f10a2c7-4b8d-4e9a-9c1f-5d6e7a8b9c03',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e06',
    entityType: 'user',
    entityId: 'c9e3f6d4-7b5f-4c8a-9d4e-8f3b2a6c9d01',
    tenantId: 'tenant_globex',
    actor: 'admin@globex.test',
    action: 'user.role_granted',
    before: { roles: ['viewer'], mfaEnabled: true },
    after: { roles: ['viewer', 'billing_admin'], mfaEnabled: true },
    occurredAt: hoursAgo(78),
    reason: 'Requested via support ticket #4471',
    correlationId: '91be0d4a-3c7e-4f9b-8d2c-6a1e5f7b8c04',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e07',
    entityType: 'invoice',
    entityId: 'd0f4a7e5-8c6a-4d9b-9e5f-9a4c3b7d0e01',
    tenantId: 'tenant_globex',
    actor: 'admin@globex.test',
    action: 'invoice.created',
    before: null,
    after: { status: 'draft', amount: 980, currency: 'USD' },
    occurredAt: hoursAgo(68),
    reason: null,
    correlationId: 'c2b1a3f8-5d9e-4a7c-8b3f-7d2e6a9c1b05',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e08',
    entityType: 'invoice',
    entityId: 'd0f4a7e5-8c6a-4d9b-9e5f-9a4c3b7d0e01',
    tenantId: 'tenant_globex',
    actor: 'admin@globex.test',
    action: 'invoice.issued',
    before: { status: 'draft', amount: 980, currency: 'USD' },
    after: { status: 'issued', amount: 980, currency: 'USD' },
    occurredAt: hoursAgo(67),
    reason: null,
    correlationId: 'c2b1a3f8-5d9e-4a7c-8b3f-7d2e6a9c1b05',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e14',
    entityType: 'invoice',
    entityId: 'd0f4a7e5-8c6a-4d9b-9e5f-9a4c3b7d0e01',
    tenantId: 'tenant_globex',
    actor: 'system',
    action: 'invoice.paid',
    before: { status: 'issued', amount: 980, currency: 'USD' },
    after: { status: 'paid', amount: 980, currency: 'USD', paidAt: hoursAgo(60) },
    occurredAt: hoursAgo(60),
    reason: 'Payment received via bank transfer',
    correlationId: 'a1f4e9c2-6b3d-4e7a-8c5f-9d2b1e6a3f10',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e19',
    entityType: 'invoice',
    entityId: 'f7a2c5e8-3b6d-4c9e-8f1a-5d2b7e4c9a01',
    tenantId: 'tenant_acme',
    actor: 'jane@acme.test',
    action: 'invoice.created',
    before: null,
    after: { status: 'draft', amount: 2100, currency: 'USD' },
    occurredAt: hoursAgo(20),
    reason: null,
    correlationId: 'f1a4c7e0-9b2d-4e5f-8a3c-6d9e0b4f7c15',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e20',
    entityType: 'invoice',
    entityId: 'f7a2c5e8-3b6d-4c9e-8f1a-5d2b7e4c9a01',
    tenantId: 'tenant_acme',
    actor: 'jane@acme.test',
    action: 'invoice.issued',
    before: { status: 'draft', amount: 2100, currency: 'USD' },
    after: { status: 'issued', amount: 2100, currency: 'USD' },
    occurredAt: hoursAgo(15),
    reason: null,
    correlationId: 'f1a4c7e0-9b2d-4e5f-8a3c-6d9e0b4f7c15',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e21',
    entityType: 'invoice',
    entityId: 'a9c3e6f1-4d7e-4b0f-9a2c-6e3d8f5b1c02',
    tenantId: 'tenant_acme',
    actor: 'jane@acme.test',
    action: 'invoice.created',
    before: null,
    after: { status: 'draft', amount: 750, currency: 'USD' },
    occurredAt: hoursAgo(5),
    reason: null,
    correlationId: 'a2b5d8e1-0c3f-4a6b-9d4e-7f1a5c8e2b16',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e22',
    entityType: 'invoice',
    entityId: 'c48f1a92-5e8b-4c1d-8a3f-7b4e9c2d6a03',
    tenantId: null,
    actor: 'system',
    action: 'invoice.created',
    before: null,
    after: { status: 'draft', amount: 300, currency: 'USD' },
    occurredAt: hoursAgo(30),
    reason: 'Platform-level billing adjustment, not tied to a tenant',
    correlationId: 'b3c6e9f2-1d4a-4b7c-8e5f-9a2b6d0f3c17',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e09',
    entityType: 'payment-link',
    entityId: 'e1a5b8f6-9d7b-4e8a-8f6a-0b5d4c8e1f01',
    tenantId: null,
    actor: 'system',
    action: 'payment-link.expired',
    before: { status: 'active' },
    after: { status: 'expired' },
    occurredAt: hoursAgo(50),
    reason: null,
    correlationId: 'd3c2b4a9-6e0f-4b8d-9c4a-8e3f7b0d2c06',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e10',
    entityType: 'user',
    entityId: 'f2b6c9a7-0e8c-4f9b-9a7b-1c6e5d9f2a01',
    tenantId: 'tenant_meridian',
    actor: 'ops@meridian.test',
    action: 'user.role_revoked',
    before: { roles: ['viewer', 'billing_admin'] },
    after: { roles: ['viewer'] },
    occurredAt: hoursAgo(40),
    reason: 'Offboarded contractor',
    correlationId: 'e4d3c5b0-7f1a-4c9e-8d5b-9f4a8c1e3d07',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e11',
    entityType: 'attachment',
    entityId: 'a3c7d0b8-1f9d-4a0c-8b8c-2d7f6e0a3b01',
    tenantId: 'tenant_acme',
    actor: 'jane@acme.test',
    action: 'attachment.uploaded',
    before: null,
    after: { fileName: 'certificate-of-incorporation.pdf' },
    occurredAt: hoursAgo(24),
    reason: 'KYC — certificate of incorporation',
    correlationId: 'f5e4d6c1-8a2b-4d0f-9e6c-0a5b9d2f4e08',
    application: 'ascendra-pay',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e12',
    entityType: 'channel_route',
    entityId: 'b4d8e1c9-2a0e-4b1d-9c9d-3e8a7f1b4c01',
    tenantId: 'tenant_meridian',
    actor: 'ops@meridian.test',
    action: 'notification.route_set',
    before: { channel: 'email', retryLimit: 3 },
    after: { channel: 'sms', retryLimit: 3 },
    occurredAt: hoursAgo(3),
    reason: 'Enable SMS for invoice notices',
    correlationId: '06f5e7d2-9b3c-4e1a-8f7d-1b6a0e3c5f09',
    application: 'ascendra-pay',
  },
];

function matchesText(value: string, filter: string | undefined): boolean {
  return !filter || value === filter;
}

const PAGE_SIZE = 5;

/**
 * Reports the true total, not a one-page-ahead peek — unlike the real
 * cursor-paginated API (createCursorQueryFn in audit-query-functions.ts),
 * this mock already holds the entire filtered array in memory before
 * slicing it, so there's no reason to under-report what it already knows.
 */
function paginate(records: AuditEvent[], batch: number): { data: AuditEvent[]; totalBatches: number } {
  const start = (batch - 1) * PAGE_SIZE;
  const page = records.slice(start, start + PAGE_SIZE);
  const totalBatches = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  return { data: page, totalBatches };
}

function sortNewestFirst(records: AuditEvent[]): AuditEvent[] {
  return [...records].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

const mockRecent: QueryFn<AuditEvent> = async (_params, batch) => paginate(sortNewestFirst(MOCK_AUDIT_EVENTS), batch);

/** The advanced filter's param semantics — shared by the list query and the export. */
function filterEvents(params: QueryParamValues): AuditEvent[] {
  const entityType = typeof params.entityType === 'string' ? params.entityType : undefined;
  const action = typeof params.action === 'string' ? params.action : undefined;
  const actor = typeof params.actor === 'string' ? params.actor : undefined;
  const tenantId = typeof params.tenantId === 'string' ? params.tenantId : undefined;
  const correlationId = typeof params.correlationId === 'string' ? params.correlationId : undefined;
  const occurredRange = params.occurredRange as DateRange | undefined;
  const occurredAfter = occurredRange?.from;
  const occurredBefore = occurredRange?.to;

  return MOCK_AUDIT_EVENTS.filter((event) => {
    if (!matchesText(event.entityType, entityType)) return false;
    if (!matchesText(event.action, action)) return false;
    if (!matchesText(event.actor, actor)) return false;
    if (!matchesText(event.tenantId ?? '', tenantId)) return false;
    if (!matchesText(event.correlationId, correlationId)) return false;
    const occurredAt = new Date(event.occurredAt);
    if (occurredAfter && occurredAt < occurredAfter) return false;
    if (occurredBefore && occurredAt > occurredBefore) return false;
    return true;
  });
}

const mockAdvancedFilter: QueryFn<AuditEvent> = async (params, batch) => {
  return paginate(sortNewestFirst(filterEvents(params)), batch);
};

export const mockAuditQueryFunctions: QueryFunctionMap<AuditEvent> = {
  recent: mockRecent,
  'advanced-filter': mockAdvancedFilter,
};

/** Small on purpose, so the unfiltered "Recent" export (22 rows) shows the truncation warning. */
const MOCK_EXPORT_LIMIT = 15;

/** Mirrors auditApi.exportEvents: every match newest-first, capped, with the Rule 9 metadata. */
export async function mockExportEvents(params: QueryParamValues): Promise<ExportResult> {
  await delay(1500);
  const matched = sortNewestFirst(filterEvents(params));
  const rows = matched.slice(0, MOCK_EXPORT_LIMIT);
  return {
    blob: new Blob([objectsToCsv(rows)], { type: 'text/csv' }),
    filename: `audit-events-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}Z.csv`,
    rowCount: rows.length,
    truncated: matched.length > MOCK_EXPORT_LIMIT,
    limit: MOCK_EXPORT_LIMIT,
  };
}

export async function mockGetEvent(id: string): Promise<AuditEventDetail> {
  const event = MOCK_AUDIT_EVENTS.find((e) => e.id === id);
  if (!event) throw new Error(`mock audit record '${id}' not found`);
  return { ...event, diff: diffFields(event.before, event.after) };
}

/**
 * Offset-as-cursor paging (the cursor is just the next offset, stringified)
 * — safe here because the mock already holds every matching record in
 * memory, unlike the real cursor-paginated API this mirrors the shape of.
 * `totalRecords` is likewise mock-only, reported because it's free to
 * compute from the in-memory array.
 */
/** One entity's own trail is normally short enough to show in full — no pagination. */
export async function mockEntityHistory(
  entityType: string,
  entityId: string,
  query: { limit?: number; cursor?: string } = {},
): Promise<CursorListResponse<AuditEvent>> {
  await delay(400);
  const all = sortNewestFirst(MOCK_AUDIT_EVENTS.filter((e) => e.entityType === entityType && e.entityId === entityId));
  // Same shape as the real endpoint: a page of `limit` (default 50), and an opaque cursor while more remain.
  const start = query.cursor ? Number(query.cursor) : 0;
  const end = start + (query.limit ?? 50);
  return { data: all.slice(start, end), meta: end < all.length ? { nextCursor: String(end) } : {} };
}

/**
 * See EntityNeighbors' own doc comment for what this actually orders by
 * (last activity per entity) and the tenant-scoping rule. `tenantId` here
 * is the CURRENT entity's own tenant, passed by the caller (which already
 * has it loaded) — not a filter the caller chooses independently.
 */
export async function mockEntityNeighbors(
  entityType: string,
  entityId: string,
  tenantId?: string | null,
): Promise<EntityNeighbors> {
  await delay(400);

  const scoped = MOCK_AUDIT_EVENTS.filter((e) => {
    if (e.entityType !== entityType) return false;
    return tenantId ? e.tenantId === tenantId : true;
  });

  const lastActivityByEntity = new Map<string, number>();
  for (const e of scoped) {
    const t = new Date(e.occurredAt).getTime();
    const prev = lastActivityByEntity.get(e.entityId);
    if (prev === undefined || t > prev) lastActivityByEntity.set(e.entityId, t);
  }

  const entities = [...lastActivityByEntity.entries()]
    .map(([id, lastActivity]) => ({ id, lastActivity }))
    .sort((a, b) => a.lastActivity - b.lastActivity || a.id.localeCompare(b.id));

  const index = entities.findIndex((e) => e.id === entityId);
  const older = index > 0 ? entities[index - 1] : null;
  const newer = index >= 0 && index < entities.length - 1 ? entities[index + 1] : null;

  return {
    newer: newer ? { entityId: newer.id } : null,
    older: older ? { entityId: older.id } : null,
    totalRecords: entities.length,
  };
}

/** Grouped from the mock events themselves, so the filter selects always match what the mock can return. */
export async function mockCatalog(): Promise<AuditCatalogEntry[]> {
  await delay(300);
  const byEntity = new Map<string, Set<string>>();
  for (const e of MOCK_AUDIT_EVENTS) {
    if (!byEntity.has(e.entityType)) byEntity.set(e.entityType, new Set());
    byEntity.get(e.entityType)!.add(e.action);
  }
  return [...byEntity].map(([entityType, actions]) => ({ entityType, actions: [...actions].sort() }));
}

export async function mockTrace(
  correlationId: string,
  query: { limit?: number; cursor?: string } = {},
): Promise<CursorListResponse<AuditEvent>> {
  await delay(400);
  const all = sortNewestFirst(MOCK_AUDIT_EVENTS.filter((e) => e.correlationId === correlationId));
  // Same shape as the real endpoint: a page of `limit` (default 50), and an opaque cursor while more remain.
  const start = query.cursor ? Number(query.cursor) : 0;
  const end = start + (query.limit ?? 50);
  return { data: all.slice(start, end), meta: end < all.length ? { nextCursor: String(end) } : {} };
}

// ─── Overview stats (synthetic, realistic-scale) ───────────────────────────
// mockStats() deliberately does NOT aggregate MOCK_AUDIT_EVENTS above — those
// 12 rows exist only to demo List/Detail/History/Trace click-throughs, and
// aggregating them produces single-digit daily counts, which makes Recharts
// pick decimal Y-axis ticks and makes every KPI read "1" or "2" (see this
// repo's own hard-instructions.md AUI-004 note on a similarly-undersized
// batch size, and the framework-level hard-instructions.md AUI-017). This
// section generates a separate, realistic-scale synthetic dataset — the
// Overview screen's KPI row, volume chart, and top-actions table are built
// from it instead.

/** Deterministic PRNG (mulberry32) — stable fixture across runs/environments. */
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STATS_ACTIONS = [
  'invoice.status_changed',
  'payment.settled',
  'attachment.uploaded',
  'role.assigned',
  'invoice.created',
  'payment-link.created',
  'user.role_granted',
  'notification.route_set',
  'kyc_document.verified',
  'payout.reversed',
] as const;

const STATS_ENTITY_TYPES = [
  'invoice',
  'payment',
  'payment-link',
  'user',
  'attachment',
  'channel_route',
  'kyc_document',
  'dispute',
  'payout',
  'subscription',
] as const;

/** 60 days of daily volume — the trailing 30 are shown; all 60 back the prior-period comparisons. */
function generateDailyVolume(days: number, rng: () => number): number[] {
  const base = 1400;
  const out: number[] = [];
  for (let i = 0; i < days; i++) {
    const weekendDip = i % 7 === 5 || i % 7 === 6 ? 0.55 : 1;
    const drift = 1 + (i / days) * 0.35;
    const noise = 0.85 + rng() * 0.3;
    let value = Math.round(base * weekendDip * drift * noise);
    if (i === days - 5) value = Math.round(value * 2.1); // one visible spike day
    out.push(Math.max(120, value));
  }
  return out;
}

function pctDelta(current: number, prior: number): number {
  if (prior === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - prior) / prior) * 1000) / 10;
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Simulated network/DB round trip — a real aggregation query is not instant. */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Computes the full synthetic dataset once. `mockOverviewStats` and
 * `mockTopActionsStats` each call this and slice what they need — the
 * underlying data is shared so the two independently-loading sections still
 * agree with each other, but each function applies its own simulated delay,
 * so they resolve (and error, if ever wired to) independently. This is a
 * mock-layer-only split — see AuditOverviewStats/AuditTopActionsStats's own
 * doc comments in audit-api.types.ts for why AuditStats itself is unchanged.
 */
function buildSyntheticStats(window: string): AuditStats {
  const rng = mulberry32(20260923);
  const totalDays = 60;
  const volumes = generateDailyVolume(totalDays, rng);

  const today = new Date();
  const dayLabel = (daysAgo: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  };

  // volumes[totalDays - 1] is today, volumes[0] is 59 days ago.
  const perDay: AuditDailyCount[] = volumes.slice(30).map((count, i) => ({
    day: dayLabel(29 - i),
    count,
  }));

  const last7d = volumes.slice(53, 60);
  const prior7d = volumes.slice(46, 53);
  const last30d = volumes.slice(30, 60);

  const recordsToday = volumes[59];
  const recordsYesterday = volumes[58];
  const last7Total = sum(last7d);
  const last30Total = sum(last30d);

  // Distinct actors / entity types touched — pool sizes picked to read like a
  // real multi-tenant console, not simulated at the individual-event level.
  const actorPoolSize = 340;
  const distinctActors30 = Math.round(actorPoolSize * (0.58 + rng() * 0.08));
  const distinctActorsPrior30 = Math.round(actorPoolSize * (0.52 + rng() * 0.08));
  const entityTypes30 = STATS_ENTITY_TYPES.length;
  const entityTypesPrior30 = STATS_ENTITY_TYPES.length - 1;

  const actionWeights = [0.24, 0.19, 0.14, 0.11, 0.09, 0.08, 0.06, 0.05, 0.03, 0.01];
  const topActions: AuditActionCount[] = STATS_ACTIONS.map((action, i) => {
    const count = Math.round(last7Total * actionWeights[i]);
    const actors = Math.max(1, Math.round(count / (6 + rng() * 10)));
    return { action, count, actors };
  }).sort((a, b) => b.count - a.count);

  const topActors: AuditActorCount[] = [
    { actor: 'svc_reconciler', count: Math.round(last7Total * 0.12) },
    { actor: 'jane@acme.test', count: Math.round(last7Total * 0.07) },
    { actor: 'admin@globex.test', count: Math.round(last7Total * 0.06) },
    { actor: 'svc_notifier', count: Math.round(last7Total * 0.05) },
    { actor: 'ops@meridian.test', count: Math.round(last7Total * 0.04) },
  ];

  const perTenant: AuditTenantCount[] = [
    { tenantId: 'tenant_acme', count: Math.round(last30Total * 0.38) },
    { tenantId: 'tenant_globex', count: Math.round(last30Total * 0.27) },
    { tenantId: 'tenant_meridian', count: Math.round(last30Total * 0.19) },
    { tenantId: null, count: Math.round(last30Total * 0.16) },
  ];

  return {
    window,
    perDay,
    topActions,
    topActors,
    perTenant,
    kpis: {
      recordsToday: { value: recordsToday, deltaPct: pctDelta(recordsToday, recordsYesterday) },
      records7d: { value: last7Total, deltaPct: pctDelta(last7Total, sum(prior7d)) },
      distinctActors30d: { value: distinctActors30, deltaPct: pctDelta(distinctActors30, distinctActorsPrior30) },
      entityTypes30d: { value: entityTypes30, deltaPct: pctDelta(entityTypes30, entityTypesPrior30) },
    },
  };
}

/** KPI row + volume chart — a lighter daily-rollup aggregation, so it resolves first. */
export async function mockOverviewStats(window = '30d'): Promise<AuditOverviewStats> {
  await delay(3000);
  const { perDay, kpis } = buildSyntheticStats(window);
  return { window, perDay, kpis };
}

/** Top actions table — a heavier `GROUP BY action` aggregation, so it resolves after the overview section, independently. */
export async function mockTopActionsStats(window = '7d'): Promise<AuditTopActionsStats> {
  await delay(4000);
  const { topActions } = buildSyntheticStats(window);
  return { window, topActions };
}

export async function mockActorActivity(actor: string): Promise<ActorActivitySummary> {
  await delay(800);
  const events = MOCK_AUDIT_EVENTS.filter((e) => e.actor === actor);
  const byAction = new Map<string, { count: number; lastOccurredAt: string }>();
  for (const event of events) {
    const existing = byAction.get(event.action);
    if (existing) {
      existing.count += 1;
      if (event.occurredAt > existing.lastOccurredAt) existing.lastOccurredAt = event.occurredAt;
    } else {
      byAction.set(event.action, { count: 1, lastOccurredAt: event.occurredAt });
    }
  }
  const sorted = sortNewestFirst(events);
  return {
    actor,
    firstSeen: events.length ? sorted[sorted.length - 1].occurredAt : null,
    lastSeen: events.length ? sorted[0].occurredAt : null,
    totalRecords: events.length,
    tenantsTouched: [...new Set(events.map((e) => e.tenantId))],
    byAction: [...byAction.entries()]
      .map(([action, v]) => ({ action, ...v }))
      .sort((a, b) => b.count - a.count),
  };
}

