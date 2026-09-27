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
 * a single occurredRange daterange field — with `columns: { sm: 1, md: 2,
 * lg: 3 }` (per AUI-028) so the form actually reflows across 1/2/3 columns
 * instead of stacking one field per row regardless of screen size.
 * `tenantId` was previously missing here despite already being a real,
 * optional AuditQuery field (see audit-api.types.ts) — added along with its
 * wiring in audit-query-functions.ts/mocks. occurredAfter/occurredBefore
 * were previously two separate `date` fields; consolidated into one
 * `daterange` field (per AUI-038) since they're really one bounded range,
 * not two independent conditions — audit-query-functions.ts/the mock now
 * split it back into the two AuditQuery params internally.
 *
 * Every field carries `optional: true` — deliberate, even though all 7 are
 * uniformly optional (field-hint-guide.md's own form-authoring guidance
 * would suggest dropping a badge with no minority to flag). The footer
 * (`info`) also states the AND-logic/all-optional fact once, so the badge
 * here is redundant with it — kept anyway, as a per-field decision, not an
 * oversight (see AUI-038 for the guidance this deliberately departs from).
 *
 * No field claims a specific match algorithm (partial vs exact) in its
 * `info`/`description` — the mock's own matchesText does exact string
 * equality, but the real API's actual matching behavior isn't visible from
 * this codebase, so asserting one here could just be wrong. `placeholder`
 * gives an example format instead. `correlationId` uses `description`
 * (not `info`) for its one explanatory line — `FieldHint` (which renders
 * `description`) safely reserves height on a bare call even when only one
 * field in a `columns`-grid row has one set; `FieldInfo` (which renders
 * `info`) does not have that same safety net (see AUI-037), so `info` is
 * reserved for the date range field only, where every field in its own
 * row has it.
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
    description: 'Filter audit events by any combination of the fields below.',
    group: 'filter',
    info: 'Every field is optional — set any combination and results must match all of them (AND logic).',
    columns: { sm: 1, md: 2, lg: 3 },
    params: [
      {
        name: 'actor',
        label: 'Actor',
        type: 'text',
        placeholder: 'jane@acme.test',
        span: 1,
        maxLength: 100,
        optional: true,
      },
      {
        name: 'action',
        label: 'Action',
        type: 'text',
        placeholder: 'invoice.void',
        span: 1,
        maxLength: 100,
        optional: true,
      },
      {
        name: 'entityType',
        label: 'Entity type',
        type: 'text',
        placeholder: 'invoice',
        span: 1,
        maxLength: 100,
        optional: true,
      },
      {
        name: 'tenantId',
        label: 'Tenant',
        type: 'text',
        placeholder: 'tenant_acme',
        span: 1,
        maxLength: 64,
        optional: true,
      },
      {
        name: 'correlationId',
        label: 'Correlation ID',
        type: 'text',
        placeholder: '5b9e1c04-2a71-4c3e-9f8a-d3b6e0c1a1a1',
        span: 1,
        maxLength: 64,
        optional: true,
        description: 'Groups every event from one originating request',
      },
      { _type: 'section', title: 'Occurred', showTitle: true },
      {
        name: 'occurredRange',
        label: 'Occurred between',
        type: 'daterange',
        span: 'full',
        info: 'Inclusive of both the start and end date',
        optional: true,
      },
    ],
  },
];
