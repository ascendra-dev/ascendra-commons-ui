'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LuCopy } from 'react-icons/lu';
import {
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
  DataTableWithQueryProvider,
  DataTableWrapper,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  IdText,
  MainContent,
  PageContent,
  PageFocus,
  PageFocusToggle,
  PageHeader,
  PageHeaderAction,
  PageHeaderGroup,
  PageMain,
  PageSubtitle,
  PageTitle,
  PageWrapper,
  QueryBar,
  QueryParamPanel,
  SimpleBadge,
  WithEmptyValue,
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  channelLabel,
  deliveryColumns,
  deliveryFieldOptions,
  deliveryQueryDefs,
  deliveryQueryFunctions,
  deliveryStatusVariant,
  isGuest,
  notificationApi,
  notificationQueryIds,
  reasonLabel,
  recipientFilter,
  recipientLabel,
  recipientUserId,
  type Delivery,
} from '@/ascendra-commons-ui/notification.ui';
import { useNotificationScope } from '../_scope';
import { NOTIFICATION_TENANTS, tenantName } from '../tenants';
import { DeliverySheet } from './_delivery-sheet';

/** Every send attempt, one row per channel — "did the invoice email reach Northwind, and if not, why". */
export default function NotificationDeliveriesPage() {
  const { platform } = useNotificationScope();
  const [selected, setSelected] = useState<Delivery | null>(null);
  const types = useQuery({ queryKey: ['notification-types'], queryFn: () => notificationApi.types(), staleTime: 5 * 60_000 });
  const fieldOptions = useMemo(() => deliveryFieldOptions(types.data ?? [], NOTIFICATION_TENANTS), [types.data]);
  const queries = useMemo(() => deliveryQueryDefs(platform), [platform]);
  // A tenant admin's rows are all its own tenant's — no Tenant column.
  const columns = useMemo(() => (platform ? deliveryColumns : deliveryColumns.filter((c) => c.key !== 'tenantId')), [platform]);

  return (
    <PageFocus>
      <PageHeader>
        <PageHeaderGroup>
          <PageTitle>Deliveries</PageTitle>
          <PageSubtitle>Every send attempt, one row per channel — whether it reached them, and if not, why.</PageSubtitle>
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
                queries={queries}
                fieldOptions={fieldOptions}
                queryFunctions={deliveryQueryFunctions}
                columns={columns}
                getRowId={(row) => row.id}
                tableId="notification-deliveries-table"
              >
                <QueryBar />
                <QueryParamPanel />
                <DataTableBar>
                  <DataTableBarContent>
                    <DataTableSearchInput />
                    <DataTableColumnManager />
                  </DataTableBarContent>
                </DataTableBar>
                <DataTableFilterBar />
                <DataTableWrapper>
                  <DataTable scrollable horizontal>
                    <DataTableHeader>
                      <DataTableHeaderRow>
                        <DataTableHead column="attemptedAt">Attempted</DataTableHead>
                        <DataTableHead column="notificationType">Type</DataTableHead>
                        <DataTableHead column="channel">Channel</DataTableHead>
                        <DataTableHead column="recipientName">Recipient</DataTableHead>
                        {platform && <DataTableHead column="tenantId">Tenant</DataTableHead>}
                        <DataTableHead column="status">Status</DataTableHead>
                        <DataTableHead column="correlationId">Correlation</DataTableHead>
                        <DataTableHeadAction />
                      </DataTableHeaderRow>
                    </DataTableHeader>
                    <DataTableBody>
                      {(row: Delivery) => {
                        const recipient = recipientFilter(row);
                        return (
                          <DataTableRow key={row.id} active={row.id === selected?.id} opensSheet className="cursor-pointer" onClick={() => setSelected(row)}>
                            <DataTableCell column="attemptedAt" className="whitespace-nowrap">
                              <DataTableHighlight text={formatDateTime(row.attemptedAt, { time: true })} item={row} itemKey="attemptedAt" />
                            </DataTableCell>
                            <DataTableCell column="notificationType" className="whitespace-nowrap">
                              <DataTableHighlight text={row.notificationType} item={row} itemKey="notificationType" />
                              {row.isTest && <SimpleBadge variant="violet" className="ml-1.5">Test</SimpleBadge>}
                            </DataTableCell>
                            <DataTableCell column="channel">
                              <SimpleBadge>
                                <span>
                                  <DataTableHighlight text={channelLabel(row.channel)} item={row} itemKey="channel" />
                                </span>
                              </SimpleBadge>
                            </DataTableCell>
                            <DataTableCell column="recipientName" className="whitespace-nowrap">
                              <DataTableHighlight text={recipientLabel(row)} item={row} itemKey="recipientName" />
                              <div className="text-muted-foreground text-xs">{isGuest(row) ? 'address hidden' : recipientUserId(row)}</div>
                            </DataTableCell>
                            {platform && (
                              <DataTableCell column="tenantId" className="whitespace-nowrap">
                                {row.tenantId ? tenantName(row.tenantId) : <SimpleBadge variant="secondary">no tenant</SimpleBadge>}
                              </DataTableCell>
                            )}
                            <DataTableCell column="status" className="min-w-56">
                              <StatusCell row={row} />
                            </DataTableCell>
                            <DataTableCell column="correlationId">
                              <WithEmptyValue value={row.correlationId}>
                                <IdText value={row.correlationId ?? ''} size="lg" className="text-muted-foreground" copyable={false} showTooltip={false} />
                              </WithEmptyValue>
                            </DataTableCell>
                            <DataTableRowAction>
                              <DropdownMenuLabel>Row actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {recipient && (
                                <DataTableRunQueryAction title={`Everything to ${recipientLabel(row)}`} queryId={notificationQueryIds.advancedFilter} params={recipient} />
                              )}
                              <DataTableRunQueryAction title="Filter by type" queryId={notificationQueryIds.advancedFilter} params={{ notificationType: row.notificationType }} />
                              <DataTableRunQueryAction title="Filter by status" queryId={notificationQueryIds.advancedFilter} params={{ status: row.status }} />
                              {row.correlationId && <DataTableCopyValueAction title="Copy correlation ID" value={row.correlationId} icon={<LuCopy />} />}
                            </DataTableRowAction>
                          </DataTableRow>
                        );
                      }}
                    </DataTableBody>
                  </DataTable>
                  <DataTableLoadingBody />
                  <DataTableErrorBody />
                  <DataTableEmptyBody title="No deliveries match" description="Widen the range or clear a filter." />
                  <DataTableFoot />
                </DataTableWrapper>
                {selected && <DeliverySheet delivery={selected} onClose={() => setSelected(null)} />}
              </DataTableWithQueryProvider>
            </MainContent>
          </PageContent>
        </PageWrapper>
      </PageMain>
    </PageFocus>
  );
}

/** The status, the reason in plain words beside it — and "retried" when a later delivery retries it. */
function StatusCell({ row }: { row: Delivery }) {
  const reason = reasonLabel(row.reason);
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      <SimpleBadge variant={deliveryStatusVariant(row.status)}>
        <span>
          <DataTableHighlight text={row.status} item={row} itemKey="status" />
        </span>
      </SimpleBadge>
      {reason && <span className="text-muted-foreground">{reason}</span>}
      {row.retriedBy && <SimpleBadge variant="blue">retried</SimpleBadge>}
    </div>
  );
}
