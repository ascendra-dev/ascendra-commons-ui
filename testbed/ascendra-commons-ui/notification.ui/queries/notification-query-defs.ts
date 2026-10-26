import type { ColumnDef, FieldDef, FieldOptionsMap, QueryDef } from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import type { Delivery, NotificationTypeSummary, Suppression } from '../api/notification-api.types';
import { channelLabel, NOTIFICATION_CHANNELS, REASON_CODES, reasonLabel, reasonTitle, recipientLabel } from '../display';

/** The list's query ids — for a link or row action that runs one (`notificationLinks.deliveries({ queryId, params })`). */
export const notificationQueryIds = { recent: 'recent', advancedFilter: 'advanced-filter' } as const;

/** The delivery log keeps rows 90 days (the notification-retention job). */
export const MAX_DELIVERY_RANGE_DAYS = 90;

/** A platform admin may pick a tenant; for anyone else the API forces theirs, so the field isn't offered. */
const tenantParam: FieldDef = { name: 'tenantId', label: 'Tenant', type: 'select', span: 1, optional: true };

/**
 * Deliveries — every send newest first, and one Advanced Filter (AUI-028): the API ANDs type, channel, status, reason,
 * tenant, recipient, correlation id and when. A recipient is a user (by id) or a guest's address — the API hashes the
 * address before it reaches the database; "everything to this recipient" fills the recipient key. Test sends are
 * hidden unless asked for.
 */
export function deliveryQueryDefs(platform: boolean): QueryDef[] {
  return [
    { id: notificationQueryIds.recent, title: 'Recent', description: 'Every send, newest first — test sends left out.', group: 'query' },
    {
      id: notificationQueryIds.advancedFilter,
      title: 'Advanced Filter',
      description: 'Filter deliveries by any combination of the fields below.',
      info: `Attempted between is required (up to ${MAX_DELIVERY_RANGE_DAYS} days); the rest are optional. Results match all of them.`,
      group: 'filter',
      columns: { sm: 1, md: 2, lg: 3 },
      params: [
        { name: 'notificationType', label: 'Type', type: 'select', span: 1, optional: true },
        { name: 'channel', label: 'Channel', type: 'select', span: 1, optional: true },
        { name: 'status', label: 'Status', type: 'select', span: 1, optional: true },
        { name: 'reason', label: 'Reason', type: 'select', span: 1, optional: true },
        ...(platform ? [tenantParam] : []),
        { name: 'test', label: 'Test sends', type: 'select', span: 1, optional: true, placeholder: 'Hidden' },
        { _type: 'section', title: 'Recipient', showTitle: true },
        { name: 'user', label: 'User', type: 'text', span: 1, maxLength: 256, optional: true, placeholder: 'hana.ito@acme.test', description: "A user's id" },
        {
          name: 'address',
          label: 'Guest address',
          type: 'text',
          span: 1,
          maxLength: 320,
          optional: true,
          placeholder: 'billing@northwind.test',
          description: 'Hashed before the search — the log never stores it',
        },
        {
          name: 'recipientKey',
          label: 'Recipient key',
          type: 'text',
          span: 1,
          maxLength: 256,
          optional: true,
          description: 'Set by “Everything to this recipient”',
        },
        {
          name: 'correlationId',
          label: 'Correlation ID',
          type: 'text',
          span: 1,
          maxLength: 128,
          optional: true,
          placeholder: '5b9e1c04-2a71-4c3e-9f8a-d3b6e0c1a1a1',
          description: 'One request or job — the same id its audit records carry',
        },
        { _type: 'section', title: 'Attempted', showTitle: true },
        {
          name: 'attemptedRange',
          label: 'Attempted between',
          type: 'daterange',
          span: 'full',
          editable: true,
          info: `Inclusive of both dates, up to ${MAX_DELIVERY_RANGE_DAYS} days`,
          mandatory: true,
          required: true,
          maxRangeDays: MAX_DELIVERY_RANGE_DAYS,
          maxDate: 'today',
          defaultValue: { from: '-6d', to: 'today' },
        },
      ],
    },
  ];
}

export interface TenantOption {
  id: string;
  name: string;
}

/** The selects' options: the declared types, the fixed channels and statuses, and the app's tenants. */
export function deliveryFieldOptions(types: readonly NotificationTypeSummary[], tenants: readonly TenantOption[]): FieldOptionsMap {
  return {
    [notificationQueryIds.advancedFilter]: {
      notificationType: types.map((t) => ({ value: t.name, label: t.name })),
      channel: NOTIFICATION_CHANNELS.map((c) => ({ value: c, label: channelLabel(c) })),
      status: ['sent', 'delivered', 'failed', 'bounced', 'skipped'].map((s) => ({ value: s, label: s })),
      reason: REASON_CODES.map((code) => ({ value: code, label: reasonTitle(code) })),
      tenantId: tenants.map((t) => ({ value: t.id, label: t.name })),
      test: [
        { value: 'hidden', label: 'Hidden' },
        { value: 'only', label: 'Test sends only' },
        { value: 'both', label: 'Shown with the rest' },
      ],
    },
  };
}

/** Each custom-formatted cell carries a `searchValue` matching what it renders (AUI-035). */
export const deliveryColumns: ColumnDef<Delivery>[] = [
  { key: 'attemptedAt', label: 'Attempted', type: 'date', freeze: true, searchValue: (v) => formatDateTime(v as string, { time: true }) },
  { key: 'notificationType', label: 'Type', filter: true },
  { key: 'channel', label: 'Channel', filter: true, searchValue: (_v, row) => channelLabel(row.channel) },
  { key: 'recipientName', label: 'Recipient', searchValue: (_v, row) => recipientLabel(row) },
  { key: 'tenantId', label: 'Tenant', filter: true },
  { key: 'status', label: 'Status', filter: true, searchValue: (_v, row) => `${row.status} ${reasonLabel(row.reason) ?? ''}` },
  { key: 'correlationId', label: 'Correlation', sortable: false },
];

/** Suppressions — every entry that skips the viewer's sends, newest first. */
export const suppressionQueryDefs: QueryDef[] = [
  { id: 'all', title: 'Suppressed recipients', description: 'Everyone a channel stopped sending to — newest first.', group: 'query' },
];

export const suppressionColumns: ColumnDef<Suppression>[] = [
  { key: 'recipientName', label: 'Recipient', freeze: true, sortable: false, searchValue: (_v, row) => row.recipientName ?? 'Guest' },
  { key: 'channel', label: 'Channel', filter: true, searchValue: (_v, row) => channelLabel(row.channel) },
  { key: 'reason', label: 'Why', searchValue: (_v, row) => `${row.reason} ${row.detail ?? ''}` },
  { key: 'firstAt', label: 'Since', type: 'date', searchValue: (v) => formatDateTime(v as string) },
  { key: 'eventCount', label: 'Bounces', type: 'number', align: 'right' },
  { key: 'tenantId', label: 'Filed by', filter: true },
  { key: 'id', label: '', sortable: false },
];
