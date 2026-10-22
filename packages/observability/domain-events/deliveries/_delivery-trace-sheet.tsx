'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { LuLoaderCircle } from 'react-icons/lu';
import {
  Button,
  ErrorState,
  IdText,
  NormalState,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SimpleBadge,
  Skeleton,
  SkeletonState,
  StatusDot,
  WithSkeleton,
  WithState,
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import { domainEventsApi, type EventDelivery } from '@/ascendra-commons-ui/domain-events.ui/api';
import { listenersLabel, statusLabel, statusVariant } from '@/ascendra-commons-ui/domain-events.ui/display';

const PAGE_SIZE = 50;
const SKELETON_ITEMS = 2;

/**
 * Every event one request or job raised, oldest first — opened from a delivery's correlation id in the Deliveries list.
 * A checkout shows its two events; most traces are one. Read-only: no links out — the id only copies — so no sheet ever
 * opens on top of it. The id comes from a row, so the trace always has deliveries: an empty first page means it's gone
 * (pruned since), which shows as the error state. Later deliveries load a page at a time by cursor.
 */
export function DeliveryTraceSheet({ correlationId, onClose }: { correlationId: string; onClose: () => void }) {
  const { data, isError, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage, isFetchNextPageError } =
    useInfiniteQuery({
      queryKey: ['domain-events-trace-sheet', correlationId],
      queryFn: async ({ pageParam }) => {
        const page = await domainEventsApi.trace(correlationId, { limit: PAGE_SIZE, cursor: pageParam });
        if (!pageParam && page.data.length === 0) throw new Error('No deliveries were found for this trace.');
        return page;
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.meta.nextCursor,
    });

  const deliveries = data?.pages.flatMap((page) => page.data) ?? [];
  // While later deliveries remain, the line runs on past the last loaded one, into "Load more".
  const lastHasLine = !!hasNextPage;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Request trace</SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
            Correlation: <IdText value={correlationId} showTooltip={false} />
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <WithState>
            <ErrorState if={isError && !data} title="Couldn't load this trace" error={error} onRetry={() => refetch()} />
            <NormalState if={!isError || !!data}>
              <WithSkeleton>
                <SkeletonState if={!data}>
                  <ol className="flex flex-col">
                    {Array.from({ length: SKELETON_ITEMS }, (_, i) => (
                      <TimelineItem key={i} hasLine={i < SKELETON_ITEMS - 1} dot={<Skeleton className="size-2 rounded-full" />}>
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="mt-1.5 h-4 w-32" />
                      </TimelineItem>
                    ))}
                  </ol>
                </SkeletonState>
                <NormalState if={!!data}>
                  <ol className="flex flex-col">
                    {deliveries.map((delivery, i) => (
                      <TimelineItem
                        key={delivery.id}
                        hasLine={i < deliveries.length - 1 || lastHasLine}
                        dot={<StatusDot variant={delivery.status === 'delivered' ? 'emerald' : delivery.status === 'no_listeners' ? 'amber' : 'red'} />}
                      >
                        <TraceDelivery delivery={delivery} />
                      </TimelineItem>
                    ))}
                  </ol>
                  {hasNextPage && (
                    <div className="flex items-center gap-3 pl-5">
                      <Button variant="secondary" size="sm" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
                        {isFetchingNextPage && <LuLoaderCircle className="animate-spin" />}
                        {isFetchNextPageError ? 'Retry' : 'Load more'}
                      </Button>
                      {isFetchNextPageError && <span className="text-destructive text-xs">Couldn&apos;t load more deliveries.</span>}
                    </div>
                  )}
                </NormalState>
              </WithSkeleton>
            </NormalState>
          </WithState>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

/** A dot with the line down to the next item — none after the last, so the trail doesn't run on into nothing. */
function TimelineItem({ dot, hasLine, children }: { dot: React.ReactNode; hasLine: boolean; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <div className="flex w-2 flex-col items-center">
        <div className="mt-1.5 flex">{dot}</div>
        {hasLine && <div className="bg-border mt-1 w-px flex-1" />}
      </div>
      <div className="min-w-0 flex-1 pb-5">{children}</div>
    </li>
  );
}

function TraceDelivery({ delivery }: { delivery: EventDelivery }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-foreground text-xs font-medium tabular-nums">{formatDateTime(delivery.occurredAt, { time: true })}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        <SimpleBadge>{delivery.eventName}</SimpleBadge>
        {delivery.method === 'emitCritical' && <SimpleBadge variant="blue">critical</SimpleBadge>}
        <SimpleBadge variant={statusVariant(delivery.status)}>{statusLabel(delivery.status)}</SimpleBadge>
      </div>
      <span className="text-muted-foreground text-xs">
        {listenersLabel(delivery.listenerCount)}
        {delivery.reason && ` · ${delivery.reason}`}
      </span>
    </div>
  );
}
