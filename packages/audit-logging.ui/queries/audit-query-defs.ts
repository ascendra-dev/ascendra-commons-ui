import type { ColumnDef, QueryDef } from '@/ascendra-ui';
import type { AuditEvent } from '../api/audit-api.types';

/**
 * Column labels are sentence case ("Occurred at", not "Occurred At") and
 * DataTableHead/TableHead usages carry `whitespace-nowrap` as an interim
 * fix — see reference/ascendra-ui/hard-instructions.md AUI-001/AUI-002 in
 * this repo for why (a DataTableHead default fix is suggested upstream via
 * ascendra-ui's own BACKLOG.md, not applied directly here).
 *
 * entityType/entityId are merged into one "Entity" column in the screen
 * (badge + id) rather than two columns, matching audit-logging.api/mocks.html;
 * `key` stays entityType since filtering by entity *type* is the useful case
 * (filtering by the exact entityId belongs to the dedicated Entity History
 * screen, not this list).
 */
export const auditEventColumns: ColumnDef<AuditEvent>[] = [
  { key: 'occurredAt', label: 'Occurred at', type: 'date', freeze: true },
  { key: 'actor', label: 'Actor', filter: true },
  { key: 'action', label: 'Action', filter: true },
  { key: 'entityType', label: 'Entity', filter: true, sortable: false },
  { key: 'tenantId', label: 'Tenant' },
  { key: 'reason', label: 'Reason', active: false },
  { key: 'correlationId', label: 'Correlation', sortable: false },
];

/**
 * Two scenarios, not five — audit-logging.api/mocks.html's own filter bar
 * shows every AuditQuery field available at once, not as mutually-exclusive
 * named presets. "Advanced Filter" lets a user combine several fields in one
 * request; entityId is deliberately not one of them — filtering to one
 * specific entity's history is the dedicated Entity History screen's job,
 * reached by clicking the Entity cell, not this list's filter form.
 */
export const auditQueryDefs: QueryDef[] = [
  {
    id: 'recent',
    title: 'Recent Events',
    description: 'Newest audit records first, no filters applied.',
    group: 'query',
  },
  {
    id: 'advanced-filter',
    title: 'Advanced Filter',
    description: 'Combine any of the fields below — all optional, ANDed together.',
    group: 'filter',
    columns: { sm: 1, md: 2, lg: 3 },
    params: [
      { name: 'entityType', label: 'Entity type', type: 'text', placeholder: 'invoice' },
      { name: 'action', label: 'Action', type: 'text', placeholder: 'invoice.void' },
      { name: 'actor', label: 'Actor', type: 'text' },
      { name: 'occurredAfter', label: 'Occurred after', type: 'date' },
      { name: 'occurredBefore', label: 'Occurred before', type: 'date' },
      { name: 'correlationId', label: 'Correlation id', type: 'text' },
    ],
  },
];
