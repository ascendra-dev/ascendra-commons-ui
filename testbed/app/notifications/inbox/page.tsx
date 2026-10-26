'use client';

import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { LuLoaderCircle } from 'react-icons/lu';
import {
  Button,
  Card,
  CardList,
  CardListItem,
  CardPanel,
  DashboardContent,
  DataTableEmptyBody,
  DataTableErrorBody,
  DataTableLoadingBody,
  PageHeader,
  PageHeaderAction,
  PageHeaderGroup,
  PageSubtitle,
  PageTitle,
  SegmentControl,
} from '@/ascendra-ui';
import { cn } from '@/ascendra-ui/shadcn';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import { notificationApi } from '@/ascendra-commons-ui/notification.ui';
import { useInvalidateInbox } from '@/ascendra-commons-ui/notification.ui/bell';

const PAGE_SIZE = 20;
const VIEWS = [
  { value: 'unread', label: 'Unread' },
  { value: 'all', label: 'All' },
] as const;
type View = (typeof VIEWS)[number]['value'];

/** The signed-in user's own in-app messages, newest first — the bell's "See all". Clicking one marks it read. */
export default function MyInboxPage() {
  const [view, setView] = useState<View>('unread');
  const invalidate = useInvalidateInbox();
  const unread = useQuery({ queryKey: ['notification-unread'], queryFn: () => notificationApi.unreadCount() });
  const inbox = useInfiniteQuery({
    queryKey: ['notification-inbox', view],
    queryFn: ({ pageParam }) => notificationApi.inbox({ unread: view === 'unread', limit: PAGE_SIZE, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.meta.nextCursor,
  });
  const markRead = useMutation({ mutationFn: (id: string) => notificationApi.markRead(id), onSuccess: invalidate });
  const markAll = useMutation({ mutationFn: () => notificationApi.markAllRead(), onSuccess: invalidate });
  const items = inbox.data?.pages.flatMap((p) => p.data) ?? [];
  const count = unread.data?.unread ?? 0;

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>My inbox</PageTitle>
          <PageSubtitle>What the app told you in-app — {count ? `${count} unread` : 'all read'}.</PageSubtitle>
        </PageHeaderGroup>
        {count > 0 && (
          <PageHeaderAction className="w-fit">
            <Button variant="secondary" disabled={markAll.isPending} onClick={() => markAll.mutate()}>
              Mark all read
            </Button>
          </PageHeaderAction>
        )}
      </PageHeader>
      <DashboardContent>
        <SegmentControl segments={VIEWS} value={view} onValueChange={(v) => setView(v as View)} />
        <Card>
          <CardPanel>
            {items.length > 0 && (
              <CardList columns="auto minmax(0,1fr) auto">
                {items.map((item) => (
                  <CardListItem
                    key={item.id}
                    className={cn(!item.readAt && 'cursor-pointer')}
                    onClick={() => !item.readAt && markRead.mutate(item.id)}
                  >
                    <span className={cn('mt-1.5 size-2 self-start rounded-full', item.readAt ? 'bg-transparent' : 'bg-primary')} />
                    <div className="min-w-0">
                      <div className={cn(!item.readAt && 'font-medium')}>{item.title ?? item.notificationType}</div>
                      <div className="text-muted-foreground mt-0.5 text-sm">{item.body}</div>
                    </div>
                    <div className="text-muted-foreground self-start text-right text-xs whitespace-nowrap">
                      {formatDateTime(item.createdAt, { style: 'relative' })}
                      {item.readAt && <div>read</div>}
                    </div>
                  </CardListItem>
                ))}
              </CardList>
            )}
            <DataTableLoadingBody isLoading={inbox.isLoading} className="h-48" />
            <DataTableErrorBody isError={inbox.isError} error={inbox.error} onRetry={() => inbox.refetch()} className="h-48" />
            <DataTableEmptyBody
              isLoading={inbox.isLoading}
              isEmpty={!!inbox.data && items.length === 0}
              title={view === 'unread' ? 'You’re all caught up' : 'Nothing yet'}
              description={view === 'unread' ? 'Nothing unread — All has what you’ve read.' : 'Messages the app sends you in-app land here.'}
              className="h-48"
            />
            {inbox.hasNextPage && (
              <div className="p-3">
                <Button variant="secondary" size="sm" disabled={inbox.isFetchingNextPage} onClick={() => inbox.fetchNextPage()}>
                  {inbox.isFetchingNextPage && <LuLoaderCircle className="animate-spin" />}
                  Load more
                </Button>
              </div>
            )}
          </CardPanel>
        </Card>
      </DashboardContent>
    </>
  );
}
