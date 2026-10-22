import type { ColumnDef, FieldOptionsMap, QueryDef } from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import type { EventCatalogEntry, EventDelivery } from '../api/domain-events-api.types';
import { methodLabel, statusLabel } from '../display';

/**
 * One row per delivery — domain-events.api/mocks.html's Deliveries list. Each custom-formatted cell carries a
 * `searchValue` matching what it renders (AUI-035), so search and highlight agree.
 */
export const domainEventDeliveryColumns: ColumnDef<EventDelivery>[] = [
  {
    key: 'occurredAt',
    label: 'Occurred',
    type: 'date',
    freeze: true,
    searchValue: (value) => formatDateTime(value as string, { time: true }),
  },
  { key: 'eventName', label: 'Event', filter: true },
  { key: 'method', label: 'Raised with', filter: true, searchValue: (_value, row) => methodLabel(row.method) },
  { key: 'listenerCount', label: 'Listeners', type: 'number', align: 'right' },
  { key: 'status', label: 'Status', filter: true, searchValue: (_value, row) => statusLabel(row.status) },
  { key: 'correlationId', label: 'Correlation', sortable: false },
];

/** The list's query ids — for a link or row action that runs one (`domainEventsLinks.list({ queryId, params })`). */
export const domainEventsQueryIds = { recent: 'recent', advancedFilter: 'advanced-filter' } as const;

/** The app keeps deliveries 90 days (its prune), so a range can't usefully reach further. */
export const MAX_RANGE_DAYS = 90;

/**
 * Two scenarios: every delivery newest first, and one Advanced Filter — the API ANDs event, method, status, correlation
 * id and a time range independently (AUI-028). The range is one `daterange` field (AUI-038), split into `since`/`until`
 * by the client; it bounds when the event occurred. Event is a select fed by the catalog (`domainEventsFieldOptionsFor`).
 */
export const domainEventsQueryDefs: QueryDef[] = [
  {
    id: domainEventsQueryIds.recent,
    title: 'Recent Deliveries',
    description: 'Newest deliveries first, no filters applied.',
    group: 'query',
  },
  {
    id: domainEventsQueryIds.advancedFilter,
    title: 'Advanced Filter',
    description: 'Filter deliveries by any combination of the fields below.',
    info: `Occurred between is required (up to ${MAX_RANGE_DAYS} days); the rest are optional. Results must match all of them (AND logic).`,
    group: 'filter',
    columns: { sm: 1, md: 2, lg: 3 },
    params: [
      { name: 'eventName', label: 'Event', type: 'select', span: 1, optional: true },
      { name: 'method', label: 'Raised with', type: 'select', span: 1, optional: true },
      { name: 'status', label: 'Status', type: 'select', span: 1, optional: true },
      {
        name: 'correlationId',
        label: 'Correlation ID',
        type: 'text',
        placeholder: '5b9e1c04-2a71-4c3e-9f8a-d3b6e0c1a1a1',
        span: 1,
        maxLength: 128,
        optional: true,
        description: 'One request or job — audit’s own deliveries carry none',
      },
      { _type: 'section', title: 'Occurred', showTitle: true },
      {
        name: 'occurredRange',
        label: 'Occurred between',
        type: 'daterange',
        span: 'full',
        editable: true,
        info: `Inclusive of both the start and end date, up to ${MAX_RANGE_DAYS} days`,
        mandatory: true,
        required: true,
        maxRangeDays: MAX_RANGE_DAYS,
        maxDate: 'today',
        // -6d through today is 7 days counting both ends.
        defaultValue: { from: '-6d', to: 'today' },
      },
    ],
  },
];

/** The selects' options: method and status are fixed; events come from the catalog. Empty while it loads. */
export function domainEventsFieldOptionsFor(catalog: readonly EventCatalogEntry[]): FieldOptionsMap {
  return {
    [domainEventsQueryIds.advancedFilter]: {
      eventName: catalog.map(({ eventName }) => ({ value: eventName, label: eventName })),
      method: [
        { value: 'emit', label: 'emit' },
        { value: 'emitCritical', label: 'critical (emitCritical)' },
      ],
      status: [
        { value: 'delivered', label: statusLabel('delivered') },
        { value: 'no_listeners', label: statusLabel('no_listeners') },
        { value: 'dispatch_failed', label: statusLabel('dispatch_failed') },
      ],
    },
  };
}
