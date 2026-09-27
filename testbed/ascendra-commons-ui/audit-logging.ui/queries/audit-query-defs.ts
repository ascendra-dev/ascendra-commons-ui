import type { ColumnDef, QueryDef } from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import type { AuditEvent } from '../api/audit-api.types';

/**
 * Column labels are sentence case ("Occurred at", not "Occurred At") —
 * `DataTableHead` defaults to `whitespace-nowrap` itself now (AUI-024 in
 * reference/ascendra-ui/hard-instructions.md), no per-usage className needed.
 *
 * entityType/entityId are merged into one "Entity" column in the screen
 * (badge + id) rather than two columns, matching audit-logging.api/mocks.html;
 * `key` stays entityType since filtering by entity *type* is the useful case
 * (filtering by the exact entityId belongs to the dedicated Entity History
 * screen, not this list).
 *
 * `occurredAt`'s `searchValue` mirrors exactly what the cell renders
 * (`formatDateTime(row.occurredAt, { time: true })` in the screen's
 * `DataTableHighlight`) — see AUI-034/the searchValue addition to ColumnDef —
 * so searching/highlighting agree with the displayed, time-inclusive string
 * instead of the library's fixed no-time date format.
 */
export const auditEventColumns: ColumnDef<AuditEvent>[] = [
  {
    key: 'occurredAt',
    label: 'Occurred at',
    type: 'date',
    freeze: true,
    searchValue: (value) => formatDateTime(value as string, { time: true }),
  },
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
 *
 * Fields are grouped into two rows via a section break — actor/action/
 * entityType/tenantId/correlationId (identity-style lookups) first, then
 * occurredAfter/occurredBefore (the date range) — with `columns: { sm: 1,
 * md: 2, lg: 3 }` (per AUI-028) so the form actually reflows across 1/2/3
 * columns instead of stacking one field per row regardless of screen size.
 * `tenantId` was previously missing here despite already being a real,
 * optional AuditQuery field (see audit-api.types.ts) — added along with its
 * wiring in audit-query-functions.ts/mocks.
 *
 * No field claims a specific match algorithm (partial vs exact) in its
 * `info` — the mock's own matchesText does exact string equality, but the
 * real API's actual matching behavior isn't visible from this codebase, so
 * asserting one here could just be wrong. `placeholder` gives an example
 * format instead. `info` is used only for things confirmed by the code
 * itself (the date fields' inclusive bounds) or the domain concept
 * (correlationId grouping related events).
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
    info: 'All active filters use AND logic — results must match every condition you set.',
    columns: { sm: 1, md: 2, lg: 3 },
    params: [
      {
        name: 'actor',
        label: 'Actor',
        type: 'text',
        placeholder: 'jane@acme.test',
        optional: true,
        span: 1,
        maxLength: 100,
      },
      {
        name: 'action',
        label: 'Action',
        type: 'text',
        placeholder: 'invoice.void',
        optional: true,
        span: 1,
        maxLength: 100,
      },
      {
        name: 'entityType',
        label: 'Entity type',
        type: 'text',
        placeholder: 'invoice',
        optional: true,
        span: 1,
        maxLength: 100,
      },
      {
        name: 'tenantId',
        label: 'Tenant',
        type: 'text',
        placeholder: 'tenant_acme',
        optional: true,
        span: 1,
        maxLength: 64,
      },
      {
        name: 'correlationId',
        label: 'Correlation ID',
        type: 'text',
        placeholder: '5b9e1c04-2a71-4c3e-9f8a-d3b6e0c1a1a1',
        optional: true,
        span: 1,
        maxLength: 64,
        info: 'Groups every event from one originating request',
      },
      { _type: 'section', title: 'Occurred', showTitle: true },
      {
        name: 'occurredAfter',
        label: 'Occurred after',
        type: 'date',
        optional: true,
        span: 1,
        info: 'Inclusive start date',
      },
      {
        name: 'occurredBefore',
        label: 'Occurred before',
        type: 'date',
        optional: true,
        span: 1,
        info: 'Inclusive end date',
      },
    ],
  },
];
