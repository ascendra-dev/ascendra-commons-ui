'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LuLoaderCircle } from 'react-icons/lu';
import {
  Button,
  ErrorMessage,
  IdText,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetKey,
  SheetProperties,
  SheetSection,
  SheetSectionHeader,
  SheetTitle,
  SheetValue,
  SimpleBadge,
} from '@/ascendra-ui';
import { isApiError } from '@/ascendra-ui/lib/api';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import { idempotencyApi, type IdempotencyClaim } from '@/ascendra-commons-ui/idempotency-key.ui/api';
import {
  claimStatusLabel,
  claimStatusVariant,
  formatBytes,
  routeLabel,
} from '@/ascendra-commons-ui/idempotency-key.ui/display';

/**
 * Everything known about one claim — opened from a key in Claims or a row in the Overview's In progress list. The
 * claim comes from that row, so nothing loads up front. The saved response body is fetched only when asked for
 * (Show), and only with `idempotency.view-response`: it can hold personal data, so a 403 reads as a note, not an
 * error. The correlation id only copies — no sheet opens on top of this one.
 */
export function ClaimSheet({ claim, onClose }: { claim: IdempotencyClaim; onClose: () => void }) {
  const duplicates = claim.replayCount + claim.conflictCount;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Claim</SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
            <IdText value={claim.key} showTooltip={false} /> · scope {claim.scope}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <SheetSection>
            <SheetProperties>
              <SheetKey>Route</SheetKey>
              <SheetValue>
                <SimpleBadge>{routeLabel(claim.route)}</SimpleBadge>
              </SheetValue>

              <SheetKey>Status</SheetKey>
              <SheetValue>
                <SimpleBadge variant={claimStatusVariant(claim)}>{claimStatusLabel(claim)}</SimpleBadge>
              </SheetValue>

              <SheetKey>Created</SheetKey>
              <SheetValue>{formatDateTime(claim.createdAt, { time: true })}</SheetValue>

              <SheetKey>Duplicates</SheetKey>
              <SheetValue>
                {duplicates === 0 ? (
                  <span className="text-muted-foreground">None</span>
                ) : (
                  <>
                    {formatCount(claim.replayCount)} replayed · {formatCount(claim.conflictCount)} turned away
                    {claim.lastDuplicateAt && (
                      <span className="text-muted-foreground"> · last {formatDateTime(claim.lastDuplicateAt, { time: true })}</span>
                    )}
                  </>
                )}
              </SheetValue>

              {claim.reclaimCount > 0 && (
                <>
                  <SheetKey>Reclaimed</SheetKey>
                  <SheetValue>
                    <SimpleBadge variant="orange">{formatCount(claim.reclaimCount)}</SimpleBadge>{' '}
                    <span className="text-muted-foreground">taken over as stale</span>
                  </SheetValue>
                </>
              )}

              {claim.lateCompleteNoOpCount > 0 && (
                <>
                  <SheetKey>Ran twice</SheetKey>
                  <SheetValue>
                    <SimpleBadge variant="red">{formatCount(claim.lateCompleteNoOpCount)}</SimpleBadge>{' '}
                    <span className="text-muted-foreground">a result was discarded</span>
                  </SheetValue>
                </>
              )}

              <SheetKey>Correlation</SheetKey>
              <SheetValue>
                {claim.correlationId ? (
                  <IdText value={claim.correlationId} showTooltip={false} />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </SheetValue>
            </SheetProperties>
          </SheetSection>

          <SheetSection>
            <SheetSectionHeader>Saved response</SheetSectionHeader>
            <SavedResponseBlock claim={claim} />
          </SheetSection>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

/** The saved body, on request. A pending claim has none yet. */
function SavedResponseBlock({ claim }: { claim: IdempotencyClaim }) {
  const [shown, setShown] = useState(false);
  const response = useQuery({
    queryKey: ['idempotency-saved-response', claim.scope, claim.key],
    queryFn: () => idempotencyApi.savedResponse(claim),
    enabled: shown,
    // 403 (no view-response) and 404 (cleaned up since the list loaded) are answers, not failures — no retry.
    retry: (count, error) => !(isApiError(error) && (error.status === 403 || error.status === 404)) && count < 2,
  });

  if (claim.status === 'pending') {
    return (
      <p className="text-muted-foreground text-sm">
        Still running — started {formatDateTime(claim.createdAt, { style: 'relative' })}. Nothing is saved until it finishes.
      </p>
    );
  }

  const forbidden = isApiError(response.error) && response.error.status === 403;
  const size = claim.responseBytes == null ? null : formatBytes(claim.responseBytes);

  return (
    <div className="border-border overflow-hidden rounded-md border">
      <div className="bg-muted flex items-center justify-between gap-3 px-3 py-2 text-xs">
        <span className="text-secondary-foreground">
          {claim.statusCode ?? '—'}
          {size && <span className="text-muted-foreground"> · {size}</span>}
        </span>
        <Button variant="secondary" size="sm" onClick={() => setShown((s) => !s)} disabled={shown && response.isFetching}>
          {shown && response.isFetching && <LuLoaderCircle className="animate-spin" />}
          {shown ? 'Hide' : 'Show'}
        </Button>
      </div>
      {shown && forbidden && (
        <p className="text-muted-foreground px-3 py-3 text-xs">
          You need <code className="text-foreground">idempotency.view-response</code> to see a saved response — it can
          hold personal data.
        </p>
      )}
      {shown && response.isError && !forbidden && (
        <div className="px-3 py-3">
          <ErrorMessage title="Couldn't load the saved response" error={response.error} onRetry={() => response.refetch()} />
        </div>
      )}
      {shown && response.data && (
        <pre className="max-h-80 overflow-auto px-3 py-3 font-mono text-xs">{JSON.stringify(response.data.body, null, 2)}</pre>
      )}
    </div>
  );
}
