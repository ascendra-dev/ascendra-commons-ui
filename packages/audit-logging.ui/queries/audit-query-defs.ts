import type { ColumnDef, QueryDef } from '@/ascendra-ui';
import type { AuditEvent } from '../api/audit-api.types';

export const auditEventColumns: ColumnDef<AuditEvent>[] = [
  { key: 'id', label: 'Event ID', freeze: true },
  { key: 'occurredAt', label: 'Occurred', type: 'date', freeze: true },
  { key: 'entityType', label: 'Entity Type', filter: true },
  { key: 'entityId', label: 'Entity ID' },
  { key: 'actor', label: 'Actor', filter: true },
  { key: 'action', label: 'Action', filter: true },
  { key: 'tenantId', label: 'Tenant', active: false },
  { key: 'correlationId', label: 'Correlation ID', active: false, sortable: false },
];

export const auditQueryDefs: QueryDef[] = [
  {
    id: 'recent',
    title: 'Recent Events',
    description: 'Newest audit records first, no filters applied.',
    group: 'query',
  },
  {
    id: 'by-entity',
    title: 'By Entity',
    description: 'All recorded changes to one entity.',
    group: 'filter',
    params: [
      { name: 'entityType', label: 'Entity Type', type: 'text', required: true, placeholder: 'invoice' },
      { name: 'entityId', label: 'Entity ID', type: 'text', required: true },
    ],
  },
  {
    id: 'by-actor-action',
    title: 'By Actor & Action',
    description: 'What one actor did, optionally narrowed to one action.',
    group: 'filter',
    params: [
      { name: 'actor', label: 'Actor', type: 'text', required: true },
      { name: 'action', label: 'Action', type: 'text', placeholder: 'invoice.void' },
    ],
  },
  {
    id: 'by-date-range',
    title: 'By Date Range',
    description: 'Events that occurred within a window.',
    group: 'filter',
    params: [
      { name: 'occurredAfter', label: 'From', type: 'date' },
      { name: 'occurredBefore', label: 'To', type: 'date' },
    ],
  },
  {
    id: 'by-correlation',
    title: 'By Correlation ID',
    description: 'Every audited step of one request/trace.',
    group: 'filter',
    params: [{ name: 'correlationId', label: 'Correlation ID', type: 'text', required: true }],
  },
];
