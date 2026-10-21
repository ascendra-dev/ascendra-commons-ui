import type { ColumnDef, FieldOptionsMap, QueryDef } from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import type { RateLimitRejection, RouteRejectionCount } from '../api/rate-limiting-api.types';
import { limitLabel, sourceLabel, spanLabel } from '../display';

/**
 * One row per rejection window (route, source, limit, minute) — rate-limiting.api/mocks.html's Rejections list.
 * Each custom-formatted cell carries a `searchValue` matching what it renders (AUI-035), so search and highlight agree.
 */
export const rateLimitRejectionColumns: ColumnDef<RateLimitRejection>[] = [
  {
    key: 'windowStart',
    label: 'Minute',
    type: 'date',
    freeze: true,
    searchValue: (value) => formatDateTime(value as string, { time: true }),
  },
  { key: 'route', label: 'Route', filter: true },
  { key: 'identifier', label: 'Source', filter: true, searchValue: (value) => sourceLabel(value as string) },
  { key: 'count', label: 'Rejections', type: 'number' },
  { key: 'lastRejectedAt', label: 'Span', sortable: false, searchValue: (_value, row) => spanLabel(row) },
  { key: 'limit', label: 'Limit', searchValue: (_value, row) => limitLabel(row) },
  { key: 'correlationId', label: 'Correlation', sortable: false },
];

/** The list's query ids — for a link or row action that runs one (`rateLimitLinks.list({ queryId, params })`). */
export const rateLimitQueryIds = { recent: 'recent', advancedFilter: 'advanced-filter' } as const;

/**
 * Two scenarios, as audit-logging.ui has: every rejection newest first, and one Advanced Filter — the API ANDs route,
 * source and a time range independently (AUI-028). The range is one `daterange` field (AUI-038), split into
 * `since`/`until` by the client; it bounds the window's minute. Up to 90 days — the sandbox keeps 90, and a
 * product's retention is its own. Route is a select fed by the catalog (`rateLimitFieldOptionsFor`).
 */
export const rateLimitQueryDefs: QueryDef[] = [
  {
    id: rateLimitQueryIds.recent,
    title: 'Recent Rejections',
    description: 'Newest rejection windows first, no filters applied.',
    group: 'query',
  },
  {
    id: rateLimitQueryIds.advancedFilter,
    title: 'Advanced Filter',
    description: 'Filter rejections by any combination of the fields below.',
    info: 'Rejected between is required (up to 90 days); route and source are optional. Results must match all of them (AND logic).',
    group: 'filter',
    columns: { sm: 1, md: 2, lg: 3 },
    params: [
      { name: 'route', label: 'Route', type: 'select', span: 1, optional: true },
      {
        name: 'identifier',
        label: 'Source',
        type: 'text',
        placeholder: '203.0.113.7',
        span: 1,
        maxLength: 100,
        optional: true,
        description: 'What the limit counted by — usually an IP',
      },
      { _type: 'section', title: 'Rejected', showTitle: true },
      {
        name: 'rejectedRange',
        label: 'Rejected between',
        type: 'daterange',
        span: 'full',
        editable: true,
        info: 'Inclusive of both the start and end date, up to 90 days',
        mandatory: true,
        required: true,
        maxRangeDays: 90,
        maxDate: 'today',
        // -6d through today is 7 days counting both ends.
        defaultValue: { from: '-6d', to: 'today' },
      },
    ],
  },
];

/** The Route select's options, from the catalog — the routes that have rejections. Empty while it loads. */
export function rateLimitFieldOptionsFor(routes: RouteRejectionCount[]): FieldOptionsMap {
  return {
    [rateLimitQueryIds.advancedFilter]: {
      route: routes.map(({ route }) => ({ value: route, label: route })),
    },
  };
}
