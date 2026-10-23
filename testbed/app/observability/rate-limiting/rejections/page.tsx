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
} from '@/ascendra-ui';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  rateLimitFieldOptionsFor,
  rateLimitQueryDefs,
  rateLimitQueryFunctions,
  rateLimitQueryIds,
  rateLimitRejectionColumns,
} from '@/ascendra-commons-ui/rate-limiting.ui/queries';
import { rateLimitApi, type RateLimitRejection } from '@/ascendra-commons-ui/rate-limiting.ui/api';
import { isOverflow, limitLabel, sourceLabel, spanLabel } from '@/ascendra-commons-ui/rate-limiting.ui/display';
import { rateLimitLinks } from '@/ascendra-commons-ui/rate-limiting.ui/links';
import { RateLimitTraceSheet } from './_rate-limit-trace-sheet';

/** The real rate-limiting API (`NEXT_PUBLIC_API_URL` — ascendra-commons-sandbox in the testbed). */
const queryFunctions = rateLimitQueryFunctions;
/** The Route select's options: every route with rejections in the past 90 days (the filter's widest range). */
const fetchRoutes = () => rateLimitApi.catalog(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));

/** The rejection log — one row per route, source, limit and minute, counted. */
export default function RateLimitRejectionsPage() {
  const [traceId, setTraceId] = useState<string | null>(null);
  const routes = useQuery({ queryKey: ['rate-limit-routes'], queryFn: fetchRoutes, staleTime: 5 * 60 * 1000 });
  const fieldOptions = useMemo(() => rateLimitFieldOptionsFor(routes.data ?? []), [routes.data]);

  return (
    <>
      <BackLink href={rateLimitLinks.overview()} label="Rate limiting">Back to overview</BackLink>
      <PageHeader>
        <PageHeaderGroup>
          <PageTitle>Rejections</PageTitle>
          <PageSubtitle>Every request a rate limit turned away — counted per source, per minute.</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <PageMain>
        <PageWrapper>
          <PageContent>
            <MainContent>
              <DataTableWithQueryProvider
                queries={rateLimitQueryDefs}
                fieldOptions={fieldOptions}
                queryFunctions={queryFunctions}
                columns={rateLimitRejectionColumns}
                getRowId={(row) => row.id}
                tableId="rate-limit-rejections-table"
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
                  <DataTable scrollable horizontal height={480}>
                    <DataTableHeader>
                      <DataTableHeaderRow>
                        <DataTableHead column="windowStart">Minute</DataTableHead>
                        <DataTableHead column="route">Route</DataTableHead>
                        <DataTableHead column="identifier">Source</DataTableHead>
                        <DataTableHead column="count">Rejections</DataTableHead>
                        <DataTableHead column="lastRejectedAt">Span</DataTableHead>
                        <DataTableHead column="limit">Limit</DataTableHead>
                        <DataTableHead column="correlationId">Correlation</DataTableHead>
                        <DataTableHeadAction />
                      </DataTableHeaderRow>
                    </DataTableHeader>
                    <DataTableBody>
                      {(row: RateLimitRejection) => (
                        <DataTableRow key={row.id}>
                          <DataTableCell column="windowStart" className="whitespace-nowrap">
                            <DataTableHighlight
                              text={formatDateTime(row.windowStart, { time: true })}
                              item={row}
                              itemKey="windowStart"
                            />
                          </DataTableCell>
                          <DataTableCell column="route">
                            <SimpleBadge>
                              <span>
                                <DataTableHighlight text={row.route} item={row} itemKey="route" />
                              </span>
                            </SimpleBadge>
                          </DataTableCell>
                          <DataTableCell column="identifier">
                            <SourceCell row={row} />
                          </DataTableCell>
                          <DataTableCell column="count" className="font-mono tabular-nums">
                            {formatCount(row.count)}
                          </DataTableCell>
                          <DataTableCell column="lastRejectedAt" className="text-muted-foreground tabular-nums">
                            <DataTableHighlight text={spanLabel(row)} item={row} itemKey="lastRejectedAt" />
                          </DataTableCell>
                          <DataTableCell column="limit" className="text-muted-foreground whitespace-nowrap">
                            <DataTableHighlight text={limitLabel(row)} item={row} itemKey="limit" />
                          </DataTableCell>
                          <DataTableCell column="correlationId">
                            {/* Only a well-behaved caller sends one — then it opens the trace; otherwise there's nothing to open. */}
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
                            <DataTableRunQueryAction
                              title="Filter by source"
                              queryId={rateLimitQueryIds.advancedFilter}
                              params={{ identifier: row.identifier }}
                            />
                            <DataTableRunQueryAction
                              title="Filter by route"
                              queryId={rateLimitQueryIds.advancedFilter}
                              params={{ route: row.route }}
                            />
                            {/* `(overflow)` is a label, not an address — nothing to copy. */}
                            {!isOverflow(row.identifier) && (
                              <DataTableCopyValueAction title="Copy source" value={row.identifier} icon={<LuCopy />} />
                            )}
                          </DataTableRowAction>
                        </DataTableRow>
                      )}
                    </DataTableBody>
                  </DataTable>
                  <DataTableLoadingBody />
                  <DataTableErrorBody />
                  <DataTableEmptyBody
                    title="No rejections match"
                    description="Nothing was rate-limited for these filters — widen the range or clear a filter."
                  />
                  <DataTableFoot />
                </DataTableWrapper>
                {traceId && <RateLimitTraceSheet correlationId={traceId} onClose={() => setTraceId(null)} />}
              </DataTableWithQueryProvider>
            </MainContent>
          </PageContent>
        </PageWrapper>
      </PageMain>
    </>
  );
}

/** The source — an address reads as code; the overflow label as plain words. Filtering by it is a row action. */
function SourceCell({ row }: { row: RateLimitRejection }) {
  const textClass = isOverflow(row.identifier) ? 'text-muted-foreground text-sm' : 'font-mono text-xs';
  return (
    <span className={`whitespace-nowrap ${textClass}`}>
      <DataTableHighlight text={sourceLabel(row.identifier)} item={row} itemKey="identifier" />
    </span>
  );
}
