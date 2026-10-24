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
  PageFocus,
  PageFocusToggle,
  PageHeaderAction,
} from '@/ascendra-ui';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  idempotencyClaimColumns,
  idempotencyFieldOptionsFor,
  idempotencyQueryDefs,
  idempotencyQueryFunctions,
  idempotencyQueryIds,
} from '@/ascendra-commons-ui/idempotency-key.ui/queries';
import { idempotencyApi, type IdempotencyClaim } from '@/ascendra-commons-ui/idempotency-key.ui/api';
import { claimStatusLabel, claimStatusVariant, routeLabel } from '@/ascendra-commons-ui/idempotency-key.ui/display';
import { idempotencyLinks } from '@/ascendra-commons-ui/idempotency-key.ui/links';
import { ClaimSheet } from './_claim-sheet';
import { ClaimTraceSheet } from './_claim-trace-sheet';

/** The Route select's options: every route with claims the store still holds. */
const fetchRoutes = () => idempotencyApi.routes();

/** Every claim, newest first — the support lookup: "was I charged twice?". */
export default function IdempotencyClaimsPage() {
  const [selected, setSelected] = useState<IdempotencyClaim | null>(null);
  const [traceId, setTraceId] = useState<string | null>(null);
  const routes = useQuery({ queryKey: ['idempotency-routes'], queryFn: fetchRoutes, staleTime: 5 * 60 * 1000 });
  const fieldOptions = useMemo(() => idempotencyFieldOptionsFor(routes.data ?? []), [routes.data]);

  return (
    <>
      <BackLink href={idempotencyLinks.overview()} label="Idempotency">Back to overview</BackLink>
      <PageFocus>
        <PageHeader>
          <PageHeaderGroup>
            <PageTitle>Claims</PageTitle>
            <PageSubtitle>Every request that carried an idempotency key — and the repeats it absorbed.</PageSubtitle>
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
                  queries={idempotencyQueryDefs}
                  fieldOptions={fieldOptions}
                  queryFunctions={idempotencyQueryFunctions}
                  columns={idempotencyClaimColumns}
                  getRowId={(row) => `${row.scope}/${row.key}`}
                  tableId="idempotency-claims-table"
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
                          <DataTableHead column="createdAt">Created</DataTableHead>
                          <DataTableHead column="route">Route</DataTableHead>
                          <DataTableHead column="key">Key</DataTableHead>
                          <DataTableHead column="scope">Scope</DataTableHead>
                          <DataTableHead column="status">Status</DataTableHead>
                          <DataTableHead column="replayCount">Replayed</DataTableHead>
                          <DataTableHead column="conflictCount">409s</DataTableHead>
                          <DataTableHead column="lateCompleteNoOpCount">Safety</DataTableHead>
                          <DataTableHead column="correlationId">Correlation</DataTableHead>
                          <DataTableHeadAction />
                        </DataTableHeaderRow>
                      </DataTableHeader>
                      <DataTableBody>
                        {(row: IdempotencyClaim) => (
                          <DataTableRow key={`${row.scope}/${row.key}`}>
                            <DataTableCell column="createdAt" className="whitespace-nowrap">
                              <DataTableHighlight text={formatDateTime(row.createdAt, { time: true })} item={row} itemKey="createdAt" />
                            </DataTableCell>
                            <DataTableCell column="route">
                              <SimpleBadge>
                                <span>
                                  <DataTableHighlight text={routeLabel(row.route)} item={row} itemKey="route" />
                                </span>
                              </SimpleBadge>
                            </DataTableCell>
                            <DataTableCell column="key">
                              <button type="button" className="cursor-pointer text-left hover:underline" onClick={() => setSelected(row)}>
                                <WithSheetIcon>
                                  <IdText value={row.key} size="lg" copyable={false} showTooltip={false} />
                                </WithSheetIcon>
                              </button>
                            </DataTableCell>
                            <DataTableCell column="scope" className="whitespace-nowrap">
                              <DataTableHighlight text={row.scope} item={row} itemKey="scope" />
                            </DataTableCell>
                            <DataTableCell column="status">
                              <SimpleBadge variant={claimStatusVariant(row)}>
                                <span>
                                  <DataTableHighlight text={claimStatusLabel(row)} item={row} itemKey="status" />
                                </span>
                              </SimpleBadge>
                            </DataTableCell>
                            <DataTableCell column="replayCount" className={countClass(row.replayCount)}>
                              {formatCount(row.replayCount)}
                            </DataTableCell>
                            <DataTableCell column="conflictCount" className={countClass(row.conflictCount)}>
                              {formatCount(row.conflictCount)}
                            </DataTableCell>
                            <DataTableCell column="lateCompleteNoOpCount">
                              <SafetyCell row={row} />
                            </DataTableCell>
                            <DataTableCell column="correlationId">
                              <WithEmptyValue value={row.correlationId}>
                                <button
                                  type="button"
                                  className="cursor-pointer text-left hover:underline"
                                  onClick={() => setTraceId(row.correlationId)}
                                >
                                  <WithSheetIcon>
                                    <IdText
                                      value={row.correlationId ?? ''}
                                      size="lg"
                                      className="text-muted-foreground"
                                      copyable={false}
                                      showTooltip={false}
                                    />
                                  </WithSheetIcon>
                                </button>
                              </WithEmptyValue>
                            </DataTableCell>
                            <DataTableRowAction>
                              <DropdownMenuLabel>Row actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {/* A fresh Advanced Filter run on this row's value, over the filter's default range. */}
                              {row.route && (
                                <DataTableRunQueryAction
                                  title="Filter by route"
                                  queryId={idempotencyQueryIds.advancedFilter}
                                  params={{ route: row.route }}
                                />
                              )}
                              <DataTableRunQueryAction
                                title="Filter by scope"
                                queryId={idempotencyQueryIds.advancedFilter}
                                params={{ scope: row.scope }}
                              />
                              <DataTableCopyValueAction title="Copy key" value={row.key} icon={<LuCopy />} />
                            </DataTableRowAction>
                          </DataTableRow>
                        )}
                      </DataTableBody>
                    </DataTable>
                    <DataTableLoadingBody />
                    <DataTableErrorBody />
                    <DataTableEmptyBody title="No claims match" description="Widen the range or clear a filter." />
                    <DataTableFoot />
                  </DataTableWrapper>
                  {selected && <ClaimSheet claim={selected} onClose={() => setSelected(null)} />}
                  {traceId && <ClaimTraceSheet correlationId={traceId} onClose={() => setTraceId(null)} />}
                </DataTableWithQueryProvider>
              </MainContent>
            </PageContent>
          </PageWrapper>
        </PageMain>
      </PageFocus>
    </>
  );
}

/** A count reads muted at zero — the common case. */
const countClass = (n: number) => `font-mono tabular-nums ${n === 0 ? 'text-muted-foreground' : ''}`;

/** Only when something went wrong: taken over (possible) and ran twice (confirmed). Empty otherwise. */
function SafetyCell({ row }: { row: IdempotencyClaim }) {
  if (row.reclaimCount === 0 && row.lateCompleteNoOpCount === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {row.reclaimCount > 0 && <SimpleBadge variant="orange">reclaimed {formatCount(row.reclaimCount)}</SimpleBadge>}
      {row.lateCompleteNoOpCount > 0 && <SimpleBadge variant="red">ran twice</SimpleBadge>}
    </div>
  );
}
