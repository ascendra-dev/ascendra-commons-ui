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
  MAX_RANGE_DAYS,
  domainEventDeliveryColumns,
  domainEventsFieldOptionsFor,
  domainEventsQueryDefs,
  domainEventsQueryFunctions,
  domainEventsQueryIds,
} from '@/ascendra-commons-ui/domain-events.ui/queries';
import { domainEventsApi, type EventDelivery } from '@/ascendra-commons-ui/domain-events.ui/api';
import { methodLabel, statusLabel, statusVariant } from '@/ascendra-commons-ui/domain-events.ui/display';
import { domainEventsLinks } from '@/ascendra-commons-ui/domain-events.ui/links';
import { DeliveryTraceSheet } from './_delivery-trace-sheet';

/** The Event select's options: every event that fired within the filter's widest range. */
const fetchEvents = () => domainEventsApi.catalog(new Date(Date.now() - MAX_RANGE_DAYS * 24 * 60 * 60 * 1000));

/** Every emit, newest first — "did payment.captured fire for this checkout, and was anyone listening?". */
export default function DomainEventDeliveriesPage() {
  const [traceId, setTraceId] = useState<string | null>(null);
  const events = useQuery({ queryKey: ['domain-events-event-names'], queryFn: fetchEvents, staleTime: 5 * 60 * 1000 });
  const fieldOptions = useMemo(() => domainEventsFieldOptionsFor(events.data ?? []), [events.data]);

  return (
    <>
      <BackLink href={domainEventsLinks.overview()} label="Domain events">Back to overview</BackLink>
      <PageFocus>
        <PageHeader>
          <PageHeaderGroup>
            <PageTitle>Deliveries</PageTitle>
            <PageSubtitle>Every event raised — whether anyone was listening, never what they then did.</PageSubtitle>
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
                  queries={domainEventsQueryDefs}
                  fieldOptions={fieldOptions}
                  queryFunctions={domainEventsQueryFunctions}
                  columns={domainEventDeliveryColumns}
                  getRowId={(row) => row.id}
                  tableId="domain-event-deliveries-table"
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
                          <DataTableHead column="occurredAt">Occurred</DataTableHead>
                          <DataTableHead column="eventName">Event</DataTableHead>
                          <DataTableHead column="method">Raised with</DataTableHead>
                          <DataTableHead column="listenerCount">Listeners</DataTableHead>
                          <DataTableHead column="status">Status</DataTableHead>
                          <DataTableHead column="correlationId">Correlation</DataTableHead>
                          <DataTableHeadAction />
                        </DataTableHeaderRow>
                      </DataTableHeader>
                      <DataTableBody>
                        {(row: EventDelivery) => (
                          <DataTableRow key={row.id}>
                            <DataTableCell column="occurredAt" className="whitespace-nowrap">
                              <DataTableHighlight text={formatDateTime(row.occurredAt, { time: true })} item={row} itemKey="occurredAt" />
                            </DataTableCell>
                            <DataTableCell column="eventName">
                              <SimpleBadge>
                                <span>
                                  <DataTableHighlight text={row.eventName} item={row} itemKey="eventName" />
                                </span>
                              </SimpleBadge>
                            </DataTableCell>
                            <DataTableCell column="method">
                              {row.method === 'emitCritical' ? (
                                <SimpleBadge variant="blue">
                                  <span>
                                    <DataTableHighlight text={methodLabel(row.method)} item={row} itemKey="method" />
                                  </span>
                                </SimpleBadge>
                              ) : (
                                <span className="text-muted-foreground">
                                  <DataTableHighlight text={methodLabel(row.method)} item={row} itemKey="method" />
                                </span>
                              )}
                            </DataTableCell>
                            <DataTableCell
                              column="listenerCount"
                              className={`font-mono tabular-nums ${row.listenerCount === 0 ? 'text-muted-foreground' : ''}`}
                            >
                              {formatCount(row.listenerCount)}
                            </DataTableCell>
                            <DataTableCell column="status">
                              <StatusCell row={row} />
                            </DataTableCell>
                            <DataTableCell column="correlationId">
                              {/* A delivery raised outside any request or job, without an id, has none — nothing to open. */}
                              <WithEmptyValue value={row.correlationId}>
                                <button type="button" className="cursor-pointer text-left hover:underline" onClick={() => setTraceId(row.correlationId)}>
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
                              <DataTableRunQueryAction title="Filter by event" queryId={domainEventsQueryIds.advancedFilter} params={{ eventName: row.eventName }} />
                              <DataTableRunQueryAction title="Filter by status" queryId={domainEventsQueryIds.advancedFilter} params={{ status: row.status }} />
                              {row.correlationId && <DataTableCopyValueAction title="Copy correlation ID" value={row.correlationId} icon={<LuCopy />} />}
                            </DataTableRowAction>
                          </DataTableRow>
                        )}
                      </DataTableBody>
                    </DataTable>
                    <DataTableLoadingBody />
                    <DataTableErrorBody />
                    <DataTableEmptyBody title="No deliveries match" description="Widen the range or clear a filter." />
                    <DataTableFoot />
                  </DataTableWrapper>
                  {traceId && <DeliveryTraceSheet correlationId={traceId} onClose={() => setTraceId(null)} />}
                </DataTableWithQueryProvider>
              </MainContent>
            </PageContent>
          </PageWrapper>
        </PageMain>
      </PageFocus>
    </>
  );
}

/** The status badge — a dispatch failure carries the transport's reason on hover. */
function StatusCell({ row }: { row: EventDelivery }) {
  const badge = (
    <SimpleBadge variant={statusVariant(row.status)}>
      <span>
        <DataTableHighlight text={statusLabel(row.status)} item={row} itemKey="status" />
      </span>
    </SimpleBadge>
  );
  return row.reason ? <WithTooltip tooltip={row.reason}>{badge}</WithTooltip> : badge;
}
