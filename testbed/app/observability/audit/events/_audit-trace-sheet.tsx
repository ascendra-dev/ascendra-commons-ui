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
import { mockTrace } from '@/ascendra-commons-ui/audit-logging.ui/mocks';
import type { AuditEvent } from '@/ascendra-commons-ui/audit-logging.ui/api';
import { dotVariantForAction } from '@/ascendra-commons-ui/shared/timeline';

/** testbed has no live backend — using the mock fetcher (see page.tsx's own comment upstream). */
const fetchTrace = mockTrace;

const PAGE_SIZE = 50;
const SKELETON_ITEMS = 4;

/**
 * Every audit event recorded under one correlation id — one request or job,
 * across whichever entities it touched — opened from a correlation id in the
 * Audit Log list. Events come in the order the API returns them. Read-only:
 * no links out — the ids only copy — so no sheet ever opens on top of it.
 * The correlation id comes from a record, so the trace always has events: an
 * empty first page means it can't be found (or isn't visible), which shows as
 * the error state. Older events load a page at a time by cursor — no count query.
 */
export function AuditTraceSheet({ correlationId, onClose }: { correlationId: string; onClose: () => void }) {
  const { data, isError, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage, isFetchNextPageError } =
    useInfiniteQuery({
      queryKey: ['audit-trace-sheet', correlationId],
      queryFn: async ({ pageParam }) => {
        const page = await fetchTrace(correlationId, { limit: PAGE_SIZE, cursor: pageParam });
        if (!pageParam && page.data.length === 0) throw new Error('No events were found for this trace.');
        return page;
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.meta.nextCursor,
    });

  const events = data?.pages.flatMap((page) => page.data) ?? [];
  // While older events remain, the line runs on past the last loaded one, into "Load older".
  const lastHasLine = !!hasNextPage;

  return (
    // The page behind keeps scrolling; an outside click only closes the sheet.
    <Sheet open lockScroll={false} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Request / job trace</SheetTitle>
          {/* Shared by every event below, so it shows once here — click to copy. */}
          <SheetDescription className="flex items-center gap-1">
            Correlation: <IdText value={correlationId} showTooltip={false} />
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <WithState>
            <ErrorState
              if={isError && !data}
              title="Couldn't load this trace"
              error={error}
              onRetry={() => refetch()}
            />
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
                    {events.map((row, i) => (
                      <TimelineItem
                        key={row.id}
                        hasLine={i < events.length - 1 || lastHasLine}
                        dot={<StatusDot variant={dotVariantForAction(row.action)} />}
                      >
                        <TraceEvent row={row} />
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
                        <span className="text-destructive text-xs">Couldn&apos;t load older events.</span>
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

function TraceEvent({ row }: { row: AuditEvent }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-foreground text-xs font-medium tabular-nums">
        {formatDateTime(row.occurredAt, { time: true })}
      </span>
      <SimpleBadge>{row.action}</SimpleBadge>
      {/* A trace spans entities — each event names its own. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <SimpleBadge variant="secondary">{row.entityType}</SimpleBadge>
        <IdText value={row.entityId} showTooltip={false} className="text-muted-foreground text-xs" />
      </div>
      <span className="text-muted-foreground text-sm">{row.actor}</span>
      {row.reason && <span className="text-muted-foreground text-xs">Reason: {row.reason}</span>}
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
        <span>Tenant: {row.tenantId ?? 'platform'}</span>
        <span>·</span>
        <span>Application: {row.application}</span>
      </div>
      {/* Different on every row — click to copy. */}
      <span className="text-muted-foreground flex items-center gap-1 text-xs">
        Record: <IdText value={row.id} showTooltip={false} />
      </span>
    </div>
  );
}
