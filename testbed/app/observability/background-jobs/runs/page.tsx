'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LuCopy } from 'react-icons/lu';
import {
  BackLink,
  DataTable,
  DataTableBar,
  DataTableBarContent,
  DataTableBody,
  DataTableCell,
  DataTableColumnManager,
  DataTableCopyValueAction,
  DataTableEmptyBody,
  DataTableErrorBody,
  DataTableFilterBar,
  DataTableFilterDropdown,
  DataTableFoot,
  DataTableHead,
  DataTableHeadAction,
  DataTableHeader,
  DataTableHeaderRow,
  DataTableHighlight,
  DataTableLoadingBody,
  DataTableRow,
  DataTableRowAction,
  DataTableRunQueryAction,
  DataTableSearchInput,
  DataTableSortDropdown,
  DataTableWithQueryProvider,
  DataTableWrapper,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  IdText,
  MainContent,
  PageContent,
  PageHeader,
  PageHeaderGroup,
  PageMain,
  PageSubtitle,
  PageTitle,
  PageWrapper,
  QueryBar,
  QueryParamPanel,
  SimpleBadge,
  WithEmptyValue,
  WithSheetIcon,
  WithTooltip,
  PageFocus,
  PageFocusToggle,
  PageHeaderAction,
} from '@/ascendra-ui';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  backgroundJobsFieldOptionsFor,
  backgroundJobsQueryDefs,
  backgroundJobsQueryFunctions,
  backgroundJobsQueryIds,
  jobRunColumns,
  type JobRunRow,
} from '@/ascendra-commons-ui/background-jobs.ui/queries';
import { backgroundJobsApi, type JobRun } from '@/ascendra-commons-ui/background-jobs.ui/api';
import { runResultLabel, runResultVariant, triggerLabel } from '@/ascendra-commons-ui/background-jobs.ui/display';
import { backgroundJobsLinks } from '@/ascendra-commons-ui/background-jobs.ui/links';
import { RunSheet } from '../_run-sheet';
import { RunTraceSheet } from './_run-trace-sheet';

/** Every run of every job, newest first — "did last night's payout sweep run, and what failed?". */
export default function BackgroundJobRunsPage() {
  const [selected, setSelected] = useState<JobRun | null>(null);
  const [traceId, setTraceId] = useState<string | null>(null);
  // Same key as the Overview's jobs read — the Job select is every job GET /jobs knows.
  const jobs = useQuery({ queryKey: ['background-jobs-jobs'], queryFn: () => backgroundJobsApi.jobs() });
  const fieldOptions = useMemo(() => backgroundJobsFieldOptionsFor(jobs.data ?? []), [jobs.data]);

  return (
    <>
      <BackLink href={backgroundJobsLinks.overview()} label="Background jobs">Back to overview</BackLink>
      <PageFocus>
        <PageHeader>
          <PageHeaderGroup>
            <PageTitle>Runs</PageTitle>
            <PageSubtitle>Every run of every job — what it found, what it processed, what failed.</PageSubtitle>
          </PageHeaderGroup>
          <PageHeaderAction className="w-fit">
            <PageFocusToggle />
          </PageHeaderAction>
        </PageHeader>
        <PageMain>
          <PageWrapper>
            <PageContent>
              <MainContent>
                <DataTableWithQueryProvider
                  queries={backgroundJobsQueryDefs}
                  fieldOptions={fieldOptions}
                  queryFunctions={backgroundJobsQueryFunctions}
                  columns={jobRunColumns}
                  getRowId={(row) => row.id}
                  tableId="background-job-runs-table"
                >
                  <QueryBar />
                  <QueryParamPanel />
                  <DataTableBar>
                    <DataTableBarContent>
                      <DataTableSearchInput />
                      <DataTableColumnManager />
                      <DataTableSortDropdown />
                      <DataTableFilterDropdown />
                    </DataTableBarContent>
                  </DataTableBar>
                  <DataTableFilterBar />
                  <DataTableWrapper>
                    <DataTable scrollable horizontal>
                      <DataTableHeader>
                        <DataTableHeaderRow>
                          <DataTableHead column="startedAt">Started</DataTableHead>
                          <DataTableHead column="jobName">Job</DataTableHead>
                          <DataTableHead column="trigger">Trigger</DataTableHead>
                          <DataTableHead column="result">Outcome</DataTableHead>
                          <DataTableHead column="itemsDue">Due</DataTableHead>
                          <DataTableHead column="itemsProcessed">Processed</DataTableHead>
                          <DataTableHead column="itemsFailed">Failed</DataTableHead>
                          <DataTableHead column="duration">Took</DataTableHead>
                          <DataTableHead column="correlationId">Correlation</DataTableHead>
                          <DataTableHeadAction />
                        </DataTableHeaderRow>
                      </DataTableHeader>
                      <DataTableBody>
                        {(row: JobRunRow) => (
                          <DataTableRow
                            key={row.id}
                            active={row.id === selected?.id}
                            opensSheet
                            className="cursor-pointer"
                            onClick={() => {
                              setTraceId(null);
                              setSelected(row);
                            }}
                          >
                            <DataTableCell column="startedAt" className="whitespace-nowrap">
                              <DataTableHighlight text={formatDateTime(row.startedAt, { time: true })} item={row} itemKey="startedAt" />
                            </DataTableCell>
                            <DataTableCell column="jobName">
                              <SimpleBadge>
                                <span>
                                  <DataTableHighlight text={row.jobName} item={row} itemKey="jobName" />
                                </span>
                              </SimpleBadge>
                            </DataTableCell>
                            <DataTableCell column="trigger">
                              {row.trigger === 'manual' ? (
                                <SimpleBadge variant="blue">
                                  <span>
                                    <DataTableHighlight text={triggerLabel(row.trigger)} item={row} itemKey="trigger" />
                                  </span>
                                </SimpleBadge>
                              ) : (
                                <span className="text-muted-foreground">
                                  <DataTableHighlight text={triggerLabel(row.trigger)} item={row} itemKey="trigger" />
                                </span>
                              )}
                            </DataTableCell>
                            <DataTableCell column="result">
                              <OutcomeCell row={row} />
                            </DataTableCell>
                            <CountCell row={row} column="itemsDue" />
                            <CountCell row={row} column="itemsProcessed" />
                            <CountCell row={row} column="itemsFailed" />
                            <DataTableCell column="duration" className="text-muted-foreground font-mono whitespace-nowrap tabular-nums">
                              {row.duration}
                            </DataTableCell>
                            <DataTableCell column="correlationId">
                              {/* Only manual runs carry an id — a scheduled one has nothing to open. */}
                              <WithEmptyValue value={row.correlationId}>
                                <button
                                  type="button"
                                  className="cursor-pointer text-left hover:underline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelected(null);
                                    setTraceId(row.correlationId);
                                  }}
                                >
                                  <WithSheetIcon>
                                    <IdText value={row.correlationId ?? ''} size="lg" className="text-muted-foreground" copyable={false} showTooltip={false} />
                                  </WithSheetIcon>
                                </button>
                              </WithEmptyValue>
                            </DataTableCell>
                            <DataTableRowAction>
                              <DropdownMenuLabel>Row actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {/* A fresh Advanced Filter run on this row's value, over the filter's default range. */}
                              <DataTableRunQueryAction title="Filter by job" queryId={backgroundJobsQueryIds.advancedFilter} params={{ jobName: row.jobName }} />
                              <DataTableRunQueryAction
                                title="Filter by outcome"
                                queryId={backgroundJobsQueryIds.advancedFilter}
                                params={outcomeParams(row)}
                              />
                              {row.correlationId && <DataTableCopyValueAction title="Copy correlation ID" value={row.correlationId} icon={<LuCopy />} />}
                            </DataTableRowAction>
                          </DataTableRow>
                        )}
                      </DataTableBody>
                    </DataTable>
                    <DataTableLoadingBody />
                    <DataTableErrorBody />
                    <DataTableEmptyBody title="No runs match" description="Widen the range or clear a filter." />
                    <DataTableFoot />
                  </DataTableWrapper>
                  {selected && <RunSheet run={selected} onClose={() => setSelected(null)} />}
                  {traceId && <RunTraceSheet correlationId={traceId} onClose={() => setTraceId(null)} />}
                </DataTableWithQueryProvider>
              </MainContent>
            </PageContent>
          </PageWrapper>
        </PageMain>
      </PageFocus>
    </>
  );
}

/** The three-way outcome as the API filters it: job failed by outcome; clean / items failed by `hasFailedItems`. */
function outcomeParams(row: JobRunRow) {
  if (row.result === 'job_failed') return { outcome: 'job_failed' };
  return { outcome: 'completed', hasFailedItems: row.result === 'items_failed' ? 'true' : 'false' };
}

/** The outcome badge — a job failure carries the first line of its error on hover. */
function OutcomeCell({ row }: { row: JobRunRow }) {
  const badge = (
    <SimpleBadge variant={runResultVariant(row.result)}>
      <span>
        <DataTableHighlight text={runResultLabel(row.result)} item={row} itemKey="result" />
      </span>
    </SimpleBadge>
  );
  const firstLine = row.error?.split('\n')[0];
  return firstLine ? <WithTooltip tooltip={firstLine}>{badge}</WithTooltip> : badge;
}

/** A count, muted at zero — so a failed run's 0 / 0 / 0 recedes and a real failure count stands out. */
function CountCell({ row, column }: { row: JobRunRow; column: 'itemsDue' | 'itemsProcessed' | 'itemsFailed' }) {
  const value = row[column];
  return (
    <DataTableCell column={column} className={`font-mono tabular-nums ${value === 0 ? 'text-muted-foreground' : ''}`}>
      {formatCount(value)}
    </DataTableCell>
  );
}
