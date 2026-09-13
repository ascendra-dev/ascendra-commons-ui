import type { QueryFn, QueryFunctionMap } from '@/ascendra-ui';
import type { AuditEvent, AuditEventDetail, AuditQueryResult, FieldDiffEntry } from '../api/audit-api.types';

const NOW = Date.now();
const hoursAgo = (h: number) => new Date(NOW - h * 60 * 60 * 1000).toISOString();

export const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'evt_1001',
    entityType: 'invoice',
    entityId: 'inv_501',
    tenantId: 'tenant_acme',
    actor: 'jane@acme.test',
    action: 'invoice.created',
    before: null,
    after: { status: 'draft', amount: 4200 },
    occurredAt: hoursAgo(72),
    reason: null,
    correlationId: 'corr_a1',
  },
  {
    id: 'evt_1002',
    entityType: 'invoice',
    entityId: 'inv_501',
    tenantId: 'tenant_acme',
    actor: 'jane@acme.test',
    action: 'invoice.issued',
    before: { status: 'draft' },
    after: { status: 'issued' },
    occurredAt: hoursAgo(71),
    reason: null,
    correlationId: 'corr_a1',
  },
  {
    id: 'evt_1003',
    entityType: 'invoice',
    entityId: 'inv_501',
    tenantId: 'tenant_acme',
    actor: 'system',
    action: 'invoice.void',
    before: { status: 'issued' },
    after: { status: 'void' },
    occurredAt: hoursAgo(48),
    reason: 'Duplicate invoice raised in error',
    correlationId: 'corr_a2',
  },
  {
    id: 'evt_1004',
    entityType: 'payment-link',
    entityId: 'plk_88',
    tenantId: 'tenant_acme',
    actor: 'jane@acme.test',
    action: 'payment-link.created',
    before: null,
    after: { amount: 1500, expiresAt: hoursAgo(-168) },
    occurredAt: hoursAgo(40),
    reason: null,
    correlationId: 'corr_b1',
  },
  {
    id: 'evt_1005',
    entityType: 'payment-link',
    entityId: 'plk_88',
    tenantId: 'tenant_acme',
    actor: 'customer_9021',
    action: 'payment-link.resolved',
    before: { status: 'active' },
    after: { status: 'resolved' },
    occurredAt: hoursAgo(39),
    reason: null,
    correlationId: 'corr_b1',
  },
  {
    id: 'evt_1006',
    entityType: 'user',
    entityId: 'usr_12',
    tenantId: 'tenant_globex',
    actor: 'admin@globex.test',
    action: 'user.role_granted',
    before: { roles: ['viewer'] },
    after: { roles: ['viewer', 'billing_admin'] },
    occurredAt: hoursAgo(30),
    reason: 'Requested via support ticket #4471',
    correlationId: 'corr_c1',
  },
  {
    id: 'evt_1007',
    entityType: 'invoice',
    entityId: 'inv_777',
    tenantId: 'tenant_globex',
    actor: 'admin@globex.test',
    action: 'invoice.created',
    before: null,
    after: { status: 'draft', amount: 980 },
    occurredAt: hoursAgo(20),
    reason: null,
    correlationId: 'corr_c2',
  },
  {
    id: 'evt_1008',
    entityType: 'invoice',
    entityId: 'inv_777',
    tenantId: 'tenant_globex',
    actor: 'admin@globex.test',
    action: 'invoice.issued',
    before: { status: 'draft' },
    after: { status: 'issued' },
    occurredAt: hoursAgo(19),
    reason: null,
    correlationId: 'corr_c2',
  },
  {
    id: 'evt_1009',
    entityType: 'payment-link',
    entityId: 'plk_90',
    tenantId: null,
    actor: 'system',
    action: 'payment-link.expired',
    before: { status: 'active' },
    after: { status: 'expired' },
    occurredAt: hoursAgo(2),
    reason: null,
    correlationId: 'corr_d1',
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

function matches(event: AuditEvent, filter: Partial<Record<keyof AuditEvent, string>>): boolean {
  return Object.entries(filter).every(([key, value]) => {
    if (!value) return true;
    return event[key as keyof AuditEvent] === value;
  });
}

const PAGE_SIZE = 3;

function paginate(records: AuditEvent[], batch: number): { data: AuditEvent[]; totalBatches: number } {
  const start = (batch - 1) * PAGE_SIZE;
  const page = records.slice(start, start + PAGE_SIZE);
  const hasMore = start + PAGE_SIZE < records.length;
  return { data: page, totalBatches: hasMore ? batch + 1 : batch };
}

function mockQueryFn(filterKeys: (keyof AuditEvent)[]): QueryFn<AuditEvent> {
  return async (params, batch) => {
    const filter: Partial<Record<keyof AuditEvent, string>> = {};
    for (const key of filterKeys) {
      const value = params[key as string];
      if (typeof value === 'string') filter[key] = value;
    }
    const filtered = MOCK_AUDIT_EVENTS.filter((event) => matches(event, filter)).sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
    return paginate(filtered, batch);
  };
}

export const mockAuditQueryFunctions: QueryFunctionMap<AuditEvent> = {
  recent: mockQueryFn([]),
  'by-entity': mockQueryFn(['entityType', 'entityId']),
  'by-actor-action': mockQueryFn(['actor', 'action']),
  'by-date-range': mockQueryFn([]),
  'by-correlation': mockQueryFn(['correlationId']),
};

export async function mockGetEvent(id: string): Promise<AuditEventDetail> {
  const event = MOCK_AUDIT_EVENTS.find((e) => e.id === id);
  if (!event) throw new Error(`mock audit record '${id}' not found`);
  return { ...event, diff: diffFields(event.before, event.after) };
}

export async function mockEntityHistory(entityType: string, entityId: string): Promise<AuditQueryResult> {
  return { records: MOCK_AUDIT_EVENTS.filter((e) => e.entityType === entityType && e.entityId === entityId) };
}

export async function mockTrace(correlationId: string): Promise<AuditQueryResult> {
  return { records: MOCK_AUDIT_EVENTS.filter((e) => e.correlationId === correlationId) };
}
