import type { ColumnDef, FieldOptionsMap, QueryDef } from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import type { IdempotencyClaim, RouteClaimCount } from '../api/idempotency-key-api.types';
import { claimStatusLabel, NO_ROUTE_LABEL, routeLabel } from '../display';

/**
 * One row per claim — idempotency-key.api/mocks.html's Claims list. Each custom-formatted cell carries a
 * `searchValue` matching what it renders (AUI-035), so search and highlight agree.
 */
export const idempotencyClaimColumns: ColumnDef<IdempotencyClaim>[] = [
  {
    key: 'createdAt',
    label: 'Created',
    type: 'date',
    freeze: true,
    searchValue: (value) => formatDateTime(value as string, { time: true }),
  },
  { key: 'route', label: 'Route', filter: true, searchValue: (value) => routeLabel(value as string | null) },
  { key: 'key', label: 'Key', sortable: false },
  { key: 'scope', label: 'Scope', filter: true },
  { key: 'status', label: 'Status', filter: true, searchValue: (_value, row) => claimStatusLabel(row) },
  { key: 'replayCount', label: 'Replayed', type: 'number', align: 'right' },
  { key: 'conflictCount', label: '409s', type: 'number', align: 'right' },
  { key: 'lateCompleteNoOpCount', label: 'Safety', type: 'number', sortable: false },
  { key: 'correlationId', label: 'Correlation', sortable: false },
];

/** The list's query ids — for a link or row action that runs one (`idempotencyLinks.list({ queryId, params })`). */
export const idempotencyQueryIds = { recent: 'recent', inProgress: 'in-progress', advancedFilter: 'advanced-filter' } as const;

/** The store keeps claims 24 hours, so a filter can look back two days at most — anything older is gone. */
const MAX_RANGE_DAYS = 2;

/**
 * Three scenarios: every claim newest first; the claims still in progress; and an Advanced Filter — the API ANDs
 * status, route, scope, correlation id and a time range independently (AUI-028). The range is one `daterange` field
 * (AUI-038), split into `since`/`until` by the client. Route is a select fed by the per-route counts
 * (`idempotencyFieldOptionsFor`).
 */
export const idempotencyQueryDefs: QueryDef[] = [
  {
    id: idempotencyQueryIds.recent,
    title: 'Recent Claims',
    description: 'Newest claims first, no filters applied.',
    group: 'query',
  },
  {
    id: idempotencyQueryIds.inProgress,
    title: 'In Progress',
    description: 'Claims whose request has not finished — a crashed or hung handler stays here until it goes stale.',
    group: 'query',
  },
  {
    id: idempotencyQueryIds.advancedFilter,
    title: 'Advanced Filter',
    description: 'Filter claims by any combination of the fields below.',
    info: `Created between is required (claims are kept 24 hours); the rest are optional. Results must match all of them (AND logic).`,
    group: 'filter',
    columns: { sm: 1, md: 2, lg: 3 },
    params: [
      { name: 'status', label: 'Status', type: 'select', span: 1, optional: true },
      { name: 'route', label: 'Route', type: 'select', span: 1, optional: true },
      {
        name: 'scope',
        label: 'Scope',
        type: 'text',
        placeholder: 'tenant_acme',
        span: 1,
        maxLength: 200,
        optional: true,
        description: 'Whose key it is — usually a tenant',
      },
      {
        name: 'correlationId',
        label: 'Correlation ID',
        type: 'text',
        placeholder: '5b9e1c04-2a71-4c3e-9f8a-d3b6e0c1a1a1',
        span: 1,
        maxLength: 128,
        optional: true,
      },
      { _type: 'section', title: 'Created', showTitle: true },
      {
        name: 'createdRange',
        label: 'Created between',
        type: 'daterange',
        span: 'full',
        editable: true,
        info: `Inclusive of both days, up to ${MAX_RANGE_DAYS} — claims are kept 24 hours`,
        mandatory: true,
        required: true,
        maxRangeDays: MAX_RANGE_DAYS,
        minDate: `-${MAX_RANGE_DAYS - 1}d`,
        maxDate: 'today',
        defaultValue: { from: '-1d', to: 'today' },
      },
    ],
  },
];

/** The selects' options: status is fixed; routes come from the per-route counts. Empty while they load. */
export function idempotencyFieldOptionsFor(routes: RouteClaimCount[]): FieldOptionsMap {
  return {
    [idempotencyQueryIds.advancedFilter]: {
      status: [
        { value: 'completed', label: 'completed' },
        { value: 'pending', label: 'in progress' },
      ],
      // A null route can't be filtered for — the API matches a route exactly.
      route: routes.filter((r) => r.route !== null).map((r) => ({ value: r.route as string, label: r.route ?? NO_ROUTE_LABEL })),
    },
  };
}
