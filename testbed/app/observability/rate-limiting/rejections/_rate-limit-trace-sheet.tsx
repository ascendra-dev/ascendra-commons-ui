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
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import { rateLimitApi, type RateLimitRejection } from '@/ascendra-commons-ui/rate-limiting.ui/api';
import { limitLabel, sourceLabel, spanLabel } from '@/ascendra-commons-ui/rate-limiting.ui/display';

/** The real rate-limiting API (`NEXT_PUBLIC_API_URL` — ascendra-commons-sandbox in the testbed). */
const fetchTrace = rateLimitApi.trace;

const PAGE_SIZE = 50;
const SKELETON_ITEMS = 2;

/**
 * Every rejection window recorded under one correlation id — one request, and any retry of it that was turned away
 * again — opened from a row's correlation id in the Rejections list. Usually one item: rejected callers rarely send a
 * correlation id, so only a well-behaved client's rows have one. Read-only: no links out — the id only copies — so no
 * sheet ever opens on top of it. The id comes from a row, so the trace always has windows: an empty first page means
 * it can't be found (pruned since), which shows as the error state. Older windows load a page at a time by cursor.
 */
export function RateLimitTraceSheet({ correlationId, onClose }: { correlationId: string; onClose: () => void }) {
  const { data, isError, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage, isFetchNextPageError } =
    useInfiniteQuery({
      queryKey: ['rate-limit-trace-sheet', correlationId],
      queryFn: async ({ pageParam }) => {
        const page = await fetchTrace(correlationId, { limit: PAGE_SIZE, cursor: pageParam });
        if (!pageParam && page.data.length === 0) throw new Error('No rejections were found for this trace.');
        return page;
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.meta.nextCursor,
    });

  const windows = data?.pages.flatMap((page) => page.data) ?? [];
  // While older windows remain, the line runs on past the last loaded one, into "Load older".
  const lastHasLine = !!hasNextPage;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Request trace</SheetTitle>
          {/* Shared by every window below, so it shows once here — click to copy. */}
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
                    {windows.map((row, i) => (
                      <TimelineItem
                        key={row.id}
                        hasLine={i < windows.length - 1 || lastHasLine}
                        // Every item is a rejection — one color, the "turned away" one.
                        dot={<StatusDot variant="rose" />}
                      >
                        <TraceWindow row={row} />
                      </TimelineItem>
                    ))}
                  </ol>
                  {hasNextPage && (
                    <div className="flex items-center gap-3 pl-5">
                      <Button variant="secondary" size="sm" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
                        {isFetchingNextPage && <LuLoaderCircle className="animate-spin" />}
                        {isFetchNextPageError ? 'Retry' : 'Load older'}
                      </Button>
                      {isFetchNextPageError && (
                        <span className="text-destructive text-xs">Couldn&apos;t load older rejections.</span>
                      )}
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

function TraceWindow({ row }: { row: RateLimitRejection }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-foreground text-xs font-medium tabular-nums">
        {formatDateTime(row.windowStart, { time: true })}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        <SimpleBadge variant="red">
          {formatCount(row.count)} {row.count === 1 ? 'rejection' : 'rejections'}
        </SimpleBadge>
        <SimpleBadge>{row.route}</SimpleBadge>
      </div>
      <span className="text-muted-foreground font-mono text-xs">{sourceLabel(row.identifier)}</span>
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
        <span>Limit {limitLabel(row)}</span>
        <span>·</span>
        <span>Span {spanLabel(row)}</span>
      </div>
    </div>
  );
}
