import type { ColumnDef, FieldOptionsMap, QueryDef } from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import type { JobRun, JobStatus } from '../api/background-jobs-api.types';
import { runDuration, runResult, runResultLabel, type RunResult } from '../display';

/** A run as the list shows it — its three-way result and how long it took, derived once so the table can filter and
 *  sort on them. */
export type JobRunRow = JobRun & { result: RunResult; duration: string };

export const toRunRow = (run: JobRun): JobRunRow => ({ ...run, result: runResult(run), duration: runDuration(run) });

/**
 * One row per run — background-jobs.api/mocks.html's Runs list. Each custom-formatted cell carries a `searchValue`
 * matching what it renders (AUI-035), so search and highlight agree.
 */
export const jobRunColumns: ColumnDef<JobRunRow>[] = [
  {
    key: 'startedAt',
    label: 'Started',
    type: 'date',
    freeze: true,
    searchValue: (value) => formatDateTime(value as string, { time: true }),
  },
  { key: 'jobName', label: 'Job', filter: true },
  { key: 'trigger', label: 'Trigger', filter: true },
  { key: 'result', label: 'Outcome', filter: true, searchValue: (_value, row) => runResultLabel(row.result) },
  { key: 'itemsDue', label: 'Due', type: 'number', align: 'right' },
  { key: 'itemsProcessed', label: 'Processed', type: 'number', align: 'right' },
  { key: 'itemsFailed', label: 'Failed', type: 'number', align: 'right' },
  { key: 'duration', label: 'Took', align: 'right', sortable: false },
  { key: 'correlationId', label: 'Correlation', sortable: false },
];

/** The list's query ids — for a link or row action that runs one (`backgroundJobsLinks.list({ queryId, params })`). */
export const backgroundJobsQueryIds = { recent: 'recent', advancedFilter: 'advanced-filter' } as const;

/** The app keeps runs 90 days (its job-run-pruner), so a range can't usefully reach further. */
export const MAX_RANGE_DAYS = 90;

/**
 * Two scenarios: every run newest first, and one Advanced Filter — the API ANDs job, outcome, trigger, failed items,
 * correlation id and a time range independently (AUI-028). The range is one `daterange` field (AUI-038), split into
 * `since`/`until` by the client; it bounds when the run started. Job is a select fed by `GET /jobs`
 * (`backgroundJobsFieldOptionsFor`).
 */
export const backgroundJobsQueryDefs: QueryDef[] = [
  {
    id: backgroundJobsQueryIds.recent,
    title: 'Recent Runs',
    description: 'Newest runs first, no filters applied.',
    group: 'query',
  },
  {
    id: backgroundJobsQueryIds.advancedFilter,
    title: 'Advanced Filter',
    description: 'Filter runs by any combination of the fields below.',
    info: `Started between is required (up to ${MAX_RANGE_DAYS} days); the rest are optional. Results must match all of them (AND logic).`,
    group: 'filter',
    columns: { sm: 1, md: 2, lg: 3 },
    params: [
      { name: 'jobName', label: 'Job', type: 'select', span: 1, optional: true },
      {
        name: 'outcome',
        label: 'Outcome',
        type: 'select',
        span: 1,
        optional: true,
        description: 'Completed includes runs where some items failed',
      },
      { name: 'trigger', label: 'Trigger', type: 'select', span: 1, optional: true },
      { name: 'hasFailedItems', label: 'Failed items', type: 'select', span: 1, optional: true },
      {
        name: 'correlationId',
        label: 'Correlation ID',
        type: 'text',
        placeholder: '5b9e1c04-2a71-4c3e-9f8a-d3b6e0c1a1a1',
        span: 1,
        maxLength: 128,
        optional: true,
        description: 'A Run now request — the same id its audit record carries',
      },
      { _type: 'section', title: 'Started', showTitle: true },
      {
        name: 'startedRange',
        label: 'Started between',
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

/** The selects' options: outcome, trigger and failed items are fixed; jobs come from `GET /jobs`. Empty while it loads. */
export function backgroundJobsFieldOptionsFor(jobs: readonly JobStatus[]): FieldOptionsMap {
  return {
    [backgroundJobsQueryIds.advancedFilter]: {
      jobName: jobs.map(({ name }) => ({ value: name, label: name })),
      outcome: [
        { value: 'completed', label: 'completed' },
        { value: 'job_failed', label: 'job failed' },
      ],
      trigger: [
        { value: 'scheduled', label: 'scheduled' },
        { value: 'bootstrap', label: 'bootstrap' },
        { value: 'manual', label: 'manual' },
      ],
      hasFailedItems: [
        { value: 'true', label: 'yes' },
        { value: 'false', label: 'no' },
      ],
    },
  };
}
