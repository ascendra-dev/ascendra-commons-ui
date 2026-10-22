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
import { idempotencyApi, type IdempotencyClaim } from '@/ascendra-commons-ui/idempotency-key.ui/api';
import { claimStatusLabel, claimStatusVariant, routeLabel } from '@/ascendra-commons-ui/idempotency-key.ui/display';

const PAGE_SIZE = 50;
const SKELETON_ITEMS = 2;

/**
 * Every claim raised under one correlation id — usually one (one request makes one claim), two for a checkout that
 * paid and then sent its invoice. Opened from a claim's correlation id in the list. Read-only:
 * no links out — the id only copies — so no sheet ever opens on top of it. The id comes from a claim, so the trace
 * always has one: an empty first page means it's gone (cleaned up since), which shows as the error state. Older
 * claims load a page at a time by cursor.
 */
export function ClaimTraceSheet({ correlationId, onClose }: { correlationId: string; onClose: () => void }) {
  const { data, isError, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage, isFetchNextPageError } =
    useInfiniteQuery({
      queryKey: ['idempotency-trace-sheet', correlationId],
      queryFn: async ({ pageParam }) => {
        const page = await idempotencyApi.trace(correlationId, { limit: PAGE_SIZE, cursor: pageParam });
        if (!pageParam && page.data.length === 0) throw new Error('No claims were found for this trace.');
        return page;
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.meta.nextCursor,
    });

  const claims = data?.pages.flatMap((page) => page.data) ?? [];
  // While older claims remain, the line runs on past the last loaded one, into "Load older".
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
                    {claims.map((claim, i) => (
                      <TimelineItem
                        key={`${claim.scope}/${claim.key}`}
                        hasLine={i < claims.length - 1 || lastHasLine}
                        dot={<StatusDot variant={claim.status === 'pending' ? 'sky' : 'emerald'} />}
                      >
                        <TraceClaim claim={claim} />
                      </TimelineItem>
                    ))}
                  </ol>
                  {hasNextPage && (
                    <div className="flex items-center gap-3 pl-5">
                      <Button variant="secondary" size="sm" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
                        {isFetchingNextPage && <LuLoaderCircle className="animate-spin" />}
                        {isFetchNextPageError ? 'Retry' : 'Load older'}
                      </Button>
                      {isFetchNextPageError && <span className="text-destructive text-xs">Couldn&apos;t load older claims.</span>}
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

function TraceClaim({ claim }: { claim: IdempotencyClaim }) {
  const facts = [
    claim.scope,
    claim.replayCount > 0 && `${formatCount(claim.replayCount)} replayed`,
    claim.conflictCount > 0 && `${formatCount(claim.conflictCount)} turned away`,
    claim.reclaimCount > 0 && `reclaimed ${formatCount(claim.reclaimCount)}`,
    claim.lateCompleteNoOpCount > 0 && 'ran twice',
  ].filter(Boolean);
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-foreground text-xs font-medium tabular-nums">{formatDateTime(claim.createdAt, { time: true })}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        <SimpleBadge>{routeLabel(claim.route)}</SimpleBadge>
        <SimpleBadge variant={claimStatusVariant(claim)}>{claimStatusLabel(claim)}</SimpleBadge>
      </div>
      <IdText value={claim.key} size="lg" className="text-muted-foreground" showTooltip={false} />
      <span className="text-muted-foreground text-xs">{facts.join(' · ')}</span>
    </div>
  );
}
