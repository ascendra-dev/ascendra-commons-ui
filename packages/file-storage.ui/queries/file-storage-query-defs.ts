import type { ColumnDef, FieldDef, FieldOptionsMap, QueryDef } from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import type { FileCategorySummary, FileRow, RejectionRow } from '../api/file-storage-api.types';
import { categoryLabel, fileName, formatBytes, REJECTION_REASON_CODES, REJECTION_REASONS, rejectionSummary } from '../display';

/** The Files list's query ids — for a link or row action that runs one (`fileStorageLinks.files({ queryId, params })`). */
export const fileStorageQueryIds = { recent: 'recent', held: 'held', advancedFilter: 'advanced-filter' } as const;

/** Refused uploads' query ids. */
export const rejectionQueryIds = { recent: 'recent', advancedFilter: 'advanced-filter' } as const;

export interface TenantOption {
  id: string;
  name: string;
}

/** A platform admin may pick a tenant; for anyone else the API forces theirs, so the field isn't offered. */
const tenantParam: FieldDef = { name: 'tenantId', label: 'Tenant', type: 'select', span: 1, optional: true };

/**
 * Files — every stored file newest first, the ones on legal hold, and one Advanced Filter (AUI-028): the API ANDs
 * upload type, uploader, when, a minimum size, hold and a filename search. No range limit — the list is keyset-paged.
 */
export function fileQueryDefs(platform: boolean): QueryDef[] {
  return [
    { id: fileStorageQueryIds.recent, title: 'Recent', description: 'Every stored file, newest first.', group: 'query' },
    { id: fileStorageQueryIds.held, title: 'On legal hold', description: "Files nobody can delete and retention skips — until the hold's released.", group: 'query' },
    {
      id: fileStorageQueryIds.advancedFilter,
      title: 'Advanced Filter',
      description: 'Filter files by any combination of the fields below.',
      info: 'Every field is optional. Results match all of them.',
      group: 'filter',
      columns: { sm: 1, md: 2, lg: 3 },
      params: [
        { name: 'search', label: 'Filename contains', type: 'text', span: 1, maxLength: 200, optional: true, placeholder: 'contract' },
        { name: 'category', label: 'Upload type', type: 'select', span: 1, optional: true },
        ...(platform ? [tenantParam] : []),
        { name: 'uploadedBy', label: 'Uploaded by', type: 'text', span: 1, maxLength: 256, optional: true, placeholder: 'admin@acme.test', description: "A user's id" },
        { name: 'minSizeMb', label: 'At least (MB)', type: 'number', span: 1, optional: true, placeholder: '5' },
        { name: 'held', label: 'Legal hold', type: 'select', span: 1, optional: true, placeholder: 'Either' },
        { name: 'scanVerdict', label: 'Scan', type: 'select', span: 1, optional: true, placeholder: 'Any' },
        { _type: 'section', title: 'Uploaded', showTitle: true },
        { name: 'uploadedRange', label: 'Uploaded between', type: 'daterange', span: 'full', editable: true, optional: true, maxDate: 'today', info: 'Inclusive of both dates' },
      ],
    },
  ];
}

/** The selects' options: the declared upload types, the hold states and the app's tenants. */
export function fileFieldOptions(categories: readonly FileCategorySummary[], tenants: readonly TenantOption[]): FieldOptionsMap {
  return {
    [fileStorageQueryIds.advancedFilter]: {
      category: categories.map((c) => ({ value: c.key, label: c.base.label })),
      held: [
        { value: 'held', label: 'On legal hold' },
        { value: 'not-held', label: 'Not held' },
      ],
      scanVerdict: [
        { value: 'clean', label: 'Clean' },
        { value: 'unscannable', label: "Not scanned — the scanner couldn't read it" },
      ],
      tenantId: tenants.map((t) => ({ value: t.id, label: t.name })),
    },
  };
}

/** Each custom-formatted cell carries a `searchValue` matching what it renders (AUI-035). */
export function fileColumns(categories: readonly FileCategorySummary[] | undefined): ColumnDef<FileRow>[] {
  return [
    { key: 'createdAt', label: 'Uploaded', type: 'date', freeze: true, searchValue: (v) => formatDateTime(v as string, { time: true }) },
    { key: 'filename', label: 'File', searchValue: (_v, row) => `${fileName(row)} ${categoryLabel(row.category, categories)}` },
    { key: 'sizeBytes', label: 'Size', type: 'number', align: 'right', searchValue: (v) => formatBytes(v as number) },
    { key: 'uploadedByName', label: 'Uploaded by', searchValue: (_v, row) => row.uploadedByName ?? row.uploadedBy },
    { key: 'tenantId', label: 'Tenant', filter: true },
    { key: 'retainUntil', label: 'Kept until', type: 'date', searchValue: (v, row) => (row.heldAt ? 'held' : v ? formatDateTime(v as string) : 'indefinite') },
    { key: 'attachmentCount', label: 'Attached to', type: 'number', align: 'right', searchValue: (v) => (v === 0 ? 'orphan' : String(v)) },
  ];
}

/** Refused uploads — every refused attempt newest first, and a filter by reason, upload type and tenant. */
export function rejectionQueryDefs(platform: boolean): QueryDef[] {
  return [
    { id: rejectionQueryIds.recent, title: 'Recent', description: 'Every refused upload, newest first.', group: 'query' },
    {
      id: rejectionQueryIds.advancedFilter,
      title: 'Advanced Filter',
      description: 'Filter refused uploads by why, the upload type, the tenant and when.',
      info: 'Every field is optional. Results match all of them.',
      group: 'filter',
      columns: { sm: 1, md: 2, lg: 3 },
      params: [
        { name: 'reason', label: 'Why', type: 'select', span: 1, optional: true },
        { name: 'category', label: 'Upload type', type: 'select', span: 1, optional: true },
        ...(platform ? [tenantParam] : []),
        { _type: 'section', title: 'Refused', showTitle: true },
        { name: 'occurredRange', label: 'Refused between', type: 'daterange', span: 'full', editable: true, optional: true, maxDate: 'today', info: 'Inclusive of both dates' },
      ],
    },
  ];
}

/**
 * The selects' options — the upload types include keys the catalog doesn't have (`extraCategories`, e.g. a misspelling
 * an integration sends), since those are refused too.
 */
export function rejectionFieldOptions(
  categories: readonly FileCategorySummary[],
  tenants: readonly TenantOption[],
  extraCategories: readonly string[] = [],
): FieldOptionsMap {
  return {
    [rejectionQueryIds.advancedFilter]: {
      reason: REJECTION_REASON_CODES.map((r) => ({ value: r, label: REJECTION_REASONS[r].title })),
      category: [
        ...categories.map((c) => ({ value: c.key, label: c.base.label })),
        ...extraCategories.filter((k) => !categories.some((c) => c.key === k)).map((k) => ({ value: k, label: `${k} — not a type` })),
      ],
      tenantId: tenants.map((t) => ({ value: t.id, label: t.name })),
    },
  };
}

export function rejectionColumns(categories: readonly FileCategorySummary[] | undefined): ColumnDef<RejectionRow>[] {
  return [
    { key: 'occurredAt', label: 'When', type: 'date', freeze: true, searchValue: (v) => formatDateTime(v as string, { time: true }) },
    { key: 'filename', label: 'File' },
    {
      key: 'reason',
      label: 'Why',
      filter: true,
      searchValue: (_v, row) => `${REJECTION_REASONS[row.reason].badge} ${rejectionSummary(row, categories)} ${row.message}`,
    },
    { key: 'category', label: 'Upload type', filter: true, searchValue: (_v, row) => categoryLabel(row.category, categories) },
    { key: 'actorName', label: 'By', searchValue: (_v, row) => row.actorName ?? row.actorId },
    { key: 'tenantId', label: 'Tenant', filter: true },
  ];
}
