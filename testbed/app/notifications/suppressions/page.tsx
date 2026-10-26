'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  DataTable,
  DataTableBar,
  DataTableBarContent,
  DataTableBody,
  DataTableCell,
  DataTableEmptyBody,
  DataTableErrorBody,
  DataTableFoot,
  DataTableHead,
  DataTableHeader,
  DataTableHeaderRow,
  DataTableHighlight,
  DataTableLoadingBody,
  DataTableRow,
  DataTableSearchInput,
  DataTableWithQueryProvider,
  DataTableWrapper,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  MainContent,
  PageContent,
  PageHeader,
  PageHeaderGroup,
  PageMain,
  PageSubtitle,
  PageTitle,
  PageWrapper,
  SimpleBadge,
  toast,
} from '@/ascendra-ui';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  channelLabel,
  notificationApi,
  notificationLinks,
  notificationQueryIds,
  suppressionColumns,
  suppressionQueryDefs,
  suppressionQueryFunctions,
  type Suppression,
} from '@/ascendra-commons-ui/notification.ui';
import { useNotificationScope } from '../_scope';
import { tenantName } from '../tenants';

/**
 * Recipients a channel stopped sending to — a hard bounce or a spam complaint the provider reported. Every send to them
 * is skipped until someone removes the entry (the mailbox fixed, the number re-verified). An entry applies to the whole
 * app, so a tenant sees every one that skips its sends; it removes only those its own tenant's bounce filed.
 */
export default function NotificationSuppressionsPage() {
  const { can } = useNotificationScope();
  const manage = can('notification.manage_config');
  const [removing, setRemoving] = useState<Suppression | null>(null);
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: (s: Suppression) => notificationApi.removeSuppression(s.id),
    onSuccess: async (_v, s) => {
      toast.success('Removed from the suppression list', { description: `${channelLabel(s.channel)} sends to ${s.recipientName ?? 'this address'} go out again.` });
      setRemoving(null);
      await queryClient.invalidateQueries({ queryKey: ['data-table'] });
    },
    onError: (error) => toast.error("Couldn't remove it", { description: error instanceof Error ? error.message : undefined }),
  });
  const queries = useMemo(() => suppressionQueryDefs, []);

  return (
    <>
      <PageHeader>
        <PageHeaderGroup>
          <PageTitle>Suppressions</PageTitle>
          <PageSubtitle>
            Recipients a channel stopped sending to — a hard bounce or a spam complaint. Their sends are skipped until the entry is removed.
          </PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <PageMain>
        <PageWrapper>
          <PageContent>
            <MainContent>
              <DataTableWithQueryProvider
                queries={queries}
                queryFunctions={suppressionQueryFunctions}
                columns={suppressionColumns}
                getRowId={(row) => row.id}
                tableId="notification-suppressions-table"
              >
                <DataTableBar>
                  <DataTableBarContent>
                    <DataTableSearchInput />
                  </DataTableBarContent>
                </DataTableBar>
                <DataTableWrapper>
                  <DataTable scrollable horizontal>
                    <DataTableHeader>
                      <DataTableHeaderRow>
                        <DataTableHead column="recipientName">Recipient</DataTableHead>
                        <DataTableHead column="channel">Channel</DataTableHead>
                        <DataTableHead column="reason">Why</DataTableHead>
                        <DataTableHead column="firstAt">Since</DataTableHead>
                        <DataTableHead column="eventCount">Bounces</DataTableHead>
                        <DataTableHead column="tenantId">Filed by</DataTableHead>
                        <DataTableHead column="id" />
                      </DataTableHeaderRow>
                    </DataTableHeader>
                    <DataTableBody>
                      {(row: Suppression) => (
                        <DataTableRow key={row.id}>
                          <DataTableCell column="recipientName">
                            <DataTableHighlight text={row.recipientName ?? 'Guest'} item={row} itemKey="recipientName" />
                            <div className="text-muted-foreground text-xs">
                              {row.recipientName ? '' : 'address hidden · '}
                              <Link
                                className="text-primary underline-offset-2 hover:underline"
                                href={notificationLinks.deliveries({
                                  queryId: notificationQueryIds.advancedFilter,
                                  params: { recipientKey: row.recipientKey, channel: row.channel, attemptedRange: { from: '-89d', to: 'today' } },
                                })}
                              >
                                sends to it
                              </Link>
                            </div>
                          </DataTableCell>
                          <DataTableCell column="channel">
                            <SimpleBadge>{channelLabel(row.channel)}</SimpleBadge>
                          </DataTableCell>
                          <DataTableCell column="reason">
                            {row.reason}
                            {row.detail && <div className="text-muted-foreground text-xs">{row.detail}</div>}
                          </DataTableCell>
                          <DataTableCell column="firstAt" className="whitespace-nowrap">
                            {formatDateTime(row.firstAt)}
                            <div className="text-muted-foreground text-xs">last {formatDateTime(row.lastAt, { style: 'relative' })}</div>
                          </DataTableCell>
                          <DataTableCell column="eventCount" className="text-right font-mono tabular-nums">
                            {formatCount(row.eventCount)}
                          </DataTableCell>
                          <DataTableCell column="tenantId">
                            {tenantName(row.tenantId)}
                            {manage && !row.removable && <div className="text-muted-foreground text-xs">a platform admin removes it</div>}
                          </DataTableCell>
                          <DataTableCell column="id" className="text-right whitespace-nowrap">
                            {manage && row.removable && (
                              <Button size="sm" variant="secondary" onClick={() => setRemoving(row)}>
                                Remove
                              </Button>
                            )}
                          </DataTableCell>
                        </DataTableRow>
                      )}
                    </DataTableBody>
                  </DataTable>
                  <DataTableLoadingBody />
                  <DataTableErrorBody />
                  <DataTableEmptyBody title="Nobody is suppressed" description="No channel has had a hard bounce or a complaint it's still holding." />
                  <DataTableFoot />
                </DataTableWrapper>
              </DataTableWithQueryProvider>
            </MainContent>
          </PageContent>
        </PageWrapper>
      </PageMain>
      {removing && (
        <Dialog open onOpenChange={(open) => !open && setRemoving(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send to them again?</DialogTitle>
              <DialogDescription>
                {channelLabel(removing.channel)} sends to {removing.recipientName ?? 'this address'} go out again — for every tenant. Only remove it once
                the mailbox is fixed or the number re-verified: another hard bounce files it again. Audited.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button disabled={remove.isPending} onClick={() => remove.mutate(removing)}>
                {remove.isPending ? 'Removing…' : 'Remove'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
