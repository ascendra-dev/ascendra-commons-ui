import type { QueryFn, QueryFunctionMap } from '@/ascendra-ui';
import type {
  ActorActivitySummary,
  AuditActionCount,
  AuditActorCount,
  AuditDailyCount,
  AuditEvent,
  AuditEventDetail,
  AuditQueryResult,
  AuditStats,
  AuditTenantCount,
  FieldDiffEntry,
} from '../api/audit-api.types';

const NOW = Date.now();
const hoursAgo = (h: number) => new Date(NOW - h * 60 * 60 * 1000).toISOString();

/** Fixture ids look like the real thing (uuids) — see AUI-004 in this repo's hard-instructions.md. */
export const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e01',
    entityType: 'invoice',
    entityId: 'a7c1e4b2-5f3d-4a8e-9b2c-6d1f0e4a7c01',
    tenantId: 'tenant_acme',
    actor: 'jane@acme.test',
    action: 'invoice.created',
    before: null,
    after: { status: 'draft', amount: 4200 },
    occurredAt: hoursAgo(120),
    reason: null,
    correlationId: '5b9e1c04-2a71-4c3e-9f8a-d3b6e0c1a1a1',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e02',
    entityType: 'invoice',
    entityId: 'a7c1e4b2-5f3d-4a8e-9b2c-6d1f0e4a7c01',
    tenantId: 'tenant_acme',
    actor: 'jane@acme.test',
    action: 'invoice.issued',
    before: { status: 'draft' },
    after: { status: 'issued' },
    occurredAt: hoursAgo(119),
    reason: null,
    correlationId: '5b9e1c04-2a71-4c3e-9f8a-d3b6e0c1a1a1',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e03',
    entityType: 'invoice',
    entityId: 'a7c1e4b2-5f3d-4a8e-9b2c-6d1f0e4a7c01',
    tenantId: 'tenant_acme',
    actor: 'system',
    action: 'invoice.void',
    before: { status: 'issued' },
    after: { status: 'void' },
    occurredAt: hoursAgo(96),
    reason: 'Duplicate invoice raised in error',
    correlationId: '71a29f6e-0c3d-4b8a-9e1f-2c5d6a7b8c02',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e04',
    entityType: 'payment-link',
    entityId: 'b8d2f5c3-6a4e-4b9f-8c3d-7e2a1f5b8d01',
    tenantId: 'tenant_acme',
    actor: 'jane@acme.test',
    action: 'payment-link.created',
    before: null,
    after: { amount: 1500, expiresAt: hoursAgo(-168) },
    occurredAt: hoursAgo(88),
    reason: null,
    correlationId: '3f10a2c7-4b8d-4e9a-9c1f-5d6e7a8b9c03',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e05',
    entityType: 'payment-link',
    entityId: 'b8d2f5c3-6a4e-4b9f-8c3d-7e2a1f5b8d01',
    tenantId: 'tenant_acme',
    actor: 'customer_9021',
    action: 'payment-link.resolved',
    before: { status: 'active' },
    after: { status: 'resolved' },
    occurredAt: hoursAgo(87),
    reason: null,
    correlationId: '3f10a2c7-4b8d-4e9a-9c1f-5d6e7a8b9c03',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e06',
    entityType: 'user',
    entityId: 'c9e3f6d4-7b5f-4c8a-9d4e-8f3b2a6c9d01',
    tenantId: 'tenant_globex',
    actor: 'admin@globex.test',
    action: 'user.role_granted',
    before: { roles: ['viewer'] },
    after: { roles: ['viewer', 'billing_admin'] },
    occurredAt: hoursAgo(78),
    reason: 'Requested via support ticket #4471',
    correlationId: '91be0d4a-3c7e-4f9b-8d2c-6a1e5f7b8c04',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e07',
    entityType: 'invoice',
    entityId: 'd0f4a7e5-8c6a-4d9b-9e5f-9a4c3b7d0e01',
    tenantId: 'tenant_globex',
    actor: 'admin@globex.test',
    action: 'invoice.created',
    before: null,
    after: { status: 'draft', amount: 980 },
    occurredAt: hoursAgo(68),
    reason: null,
    correlationId: 'c2b1a3f8-5d9e-4a7c-8b3f-7d2e6a9c1b05',
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e08',
    entityType: 'invoice',
    entityId: 'd0f4a7e5-8c6a-4d9b-9e5f-9a4c3b7d0e01',
    tenantId: 'tenant_globex',
    actor: 'admin@globex.test',
    action: 'invoice.issued',
    before: { status: 'draft' },
    after: { status: 'issued' },
    occurredAt: hoursAgo(67),
    reason: null,
    correlationId: 'c2b1a3f8-5d9e-4a7c-8b3f-7d2e6a9c1b05',
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
  },
  {
    id: '3f2a1c9e-8b7d-4e2a-9c3f-1a2b3c4d5e12',
    entityType: 'channel_route',
    entityId: 'b4d8e1c9-2a0e-4b1d-9c9d-3e8a7f1b4c01',
    tenantId: 'tenant_meridian',
    actor: 'ops@meridian.test',
    action: 'notification.route_set',
    before: { channel: 'email' },
    after: { channel: 'sms' },
    occurredAt: hoursAgo(3),
    reason: 'Enable SMS for invoice notices',
    correlationId: '06f5e7d2-9b3c-4e1a-8f7d-1b6a0e3c5f09',
  },
];

function diffFields(before: Record<string, unknown> | null, after: Record<string, unknown> | null): FieldDiffEntry[] {
  const b = before ?? {};
  const a = after ?? {};
  const fields = [...new Set([...Object.keys(b), ...Object.keys(a)])].sort();
  return fields
    .map((field) => ({ field, before: b[field] ?? null, after: a[field] ?? null }))
    .filter((entry) => JSON.stringify(entry.before) !== JSON.stringify(entry.after));
}

function matchesText(value: string, filter: string | undefined): boolean {
  return !filter || value === filter;
}

const PAGE_SIZE = 5;

function paginate(records: AuditEvent[], batch: number): { data: AuditEvent[]; totalBatches: number } {
  const start = (batch - 1) * PAGE_SIZE;
  const page = records.slice(start, start + PAGE_SIZE);
  const hasMore = start + PAGE_SIZE < records.length;
  return { data: page, totalBatches: hasMore ? batch + 1 : batch };
}

function sortNewestFirst(records: AuditEvent[]): AuditEvent[] {
  return [...records].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

const mockRecent: QueryFn<AuditEvent> = async (_params, batch) => paginate(sortNewestFirst(MOCK_AUDIT_EVENTS), batch);

const mockAdvancedFilter: QueryFn<AuditEvent> = async (params, batch) => {
  const entityType = typeof params.entityType === 'string' ? params.entityType : undefined;
  const action = typeof params.action === 'string' ? params.action : undefined;
  const actor = typeof params.actor === 'string' ? params.actor : undefined;
  const correlationId = typeof params.correlationId === 'string' ? params.correlationId : undefined;
  const occurredAfter = params.occurredAfter instanceof Date ? params.occurredAfter : undefined;
  const occurredBefore = params.occurredBefore instanceof Date ? params.occurredBefore : undefined;

  const filtered = MOCK_AUDIT_EVENTS.filter((event) => {
    if (!matchesText(event.entityType, entityType)) return false;
    if (!matchesText(event.action, action)) return false;
    if (!matchesText(event.actor, actor)) return false;
    if (!matchesText(event.correlationId, correlationId)) return false;
    const occurredAt = new Date(event.occurredAt);
    if (occurredAfter && occurredAt < occurredAfter) return false;
    if (occurredBefore && occurredAt > occurredBefore) return false;
    return true;
  });

  return paginate(sortNewestFirst(filtered), batch);
};

export const mockAuditQueryFunctions: QueryFunctionMap<AuditEvent> = {
  recent: mockRecent,
  'advanced-filter': mockAdvancedFilter,
};

export async function mockGetEvent(id: string): Promise<AuditEventDetail> {
  const event = MOCK_AUDIT_EVENTS.find((e) => e.id === id);
  if (!event) throw new Error(`mock audit record '${id}' not found`);
  return { ...event, diff: diffFields(event.before, event.after) };
}

export async function mockEntityHistory(entityType: string, entityId: string): Promise<AuditQueryResult> {
  return { records: sortNewestFirst(MOCK_AUDIT_EVENTS.filter((e) => e.entityType === entityType && e.entityId === entityId)) };
}

export async function mockTrace(correlationId: string): Promise<AuditQueryResult> {
  return { records: sortNewestFirst(MOCK_AUDIT_EVENTS.filter((e) => e.correlationId === correlationId)) };
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

export async function mockStats(window = '30d'): Promise<AuditStats> {
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

export async function mockActorActivity(actor: string): Promise<ActorActivitySummary> {
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

function toCsvValue(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function mockDownloadCsv(query: {
  entityType?: string;
  action?: string;
  actor?: string;
  correlationId?: string;
  occurredAfter?: string;
  occurredBefore?: string;
}): Promise<Blob> {
  const occurredAfter = query.occurredAfter ? new Date(query.occurredAfter) : undefined;
  const occurredBefore = query.occurredBefore ? new Date(query.occurredBefore) : undefined;
  const filtered = MOCK_AUDIT_EVENTS.filter((event) => {
    if (!matchesText(event.entityType, query.entityType)) return false;
    if (!matchesText(event.action, query.action)) return false;
    if (!matchesText(event.actor, query.actor)) return false;
    if (!matchesText(event.correlationId, query.correlationId)) return false;
    const occurredAt = new Date(event.occurredAt);
    if (occurredAfter && occurredAt < occurredAfter) return false;
    if (occurredBefore && occurredAt > occurredBefore) return false;
    return true;
  });

  const header = ['id', 'occurredAt', 'actor', 'action', 'entityType', 'entityId', 'tenantId', 'reason', 'correlationId'];
  const rows = sortNewestFirst(filtered).map((e) =>
    [e.id, e.occurredAt, e.actor, e.action, e.entityType, e.entityId, e.tenantId ?? '', e.reason ?? '', e.correlationId]
      .map(toCsvValue)
      .join(','),
  );
  return new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv' });
}
