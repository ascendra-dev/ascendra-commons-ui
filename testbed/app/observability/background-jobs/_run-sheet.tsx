'use client';

import { useQuery } from '@tanstack/react-query';
import {
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
  Skeleton,
} from '@/ascendra-ui';
import { isApiError } from '@/ascendra-ui/lib/api';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import { backgroundJobsApi, type JobRun } from '@/ascendra-commons-ui/background-jobs.ui/api';
import {
  runDuration,
  runResult,
  runResultLabel,
  runResultVariant,
  triggerLabel,
} from '@/ascendra-commons-ui/background-jobs.ui/display';

const timeOfDay = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });

/**
 * One run in full — opened from a row in Runs or the Job screen's recent runs. The row shows at once; the sheet then
 * fetches the run by id, because a list row's `error` is cut short and this is the whole stack. A run pruned since the
 * list loaded is a 404, read as a note. Read-only, no links out — the correlation id only copies (no sheet on a sheet).
 */
export function RunSheet({ run: row, onClose }: { run: JobRun; onClose: () => void }) {
  const full = useQuery({
    queryKey: ['background-jobs-run', row.id],
    queryFn: () => backgroundJobsApi.run(row.id),
    retry: (count, error) => !(isApiError(error) && error.status === 404) && count < 2,
  });
  const run = full.data ?? row;
  const result = runResult(run);
  const gone = isApiError(full.error) && full.error.status === 404;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{run.jobName}</SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            Run {formatCount(Number(run.id), Infinity)} ·{' '}
            <SimpleBadge variant={runResultVariant(result)}>{runResultLabel(result)}</SimpleBadge>
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {gone && <p className="text-muted-foreground text-sm">This run is no longer kept — it was pruned since the list loaded.</p>}
          <SheetSection>
            <SheetProperties>
              <SheetKey>Trigger</SheetKey>
              <SheetValue>
                {run.trigger === 'manual' ? <SimpleBadge variant="blue">manual</SimpleBadge> : triggerLabel(run.trigger)}
              </SheetValue>

              <SheetKey>Started</SheetKey>
              <SheetValue>
                {formatDateTime(run.startedAt, { time: true })} → {timeOfDay(run.finishedAt)}{' '}
                <span className="text-muted-foreground">({runDuration(run)})</span>
              </SheetValue>

              <SheetKey>Items</SheetKey>
              <SheetValue>
                {run.outcome === 'job_failed' ? (
                  <span className="text-muted-foreground">none — the due-items query failed</span>
                ) : (
                  `${formatCount(run.itemsDue)} due · ${formatCount(run.itemsProcessed)} processed · ${formatCount(run.itemsFailed)} failed`
                )}
              </SheetValue>

              <SheetKey>Correlation</SheetKey>
              <SheetValue>
                {run.correlationId ? (
                  <IdText value={run.correlationId} showTooltip={false} />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </SheetValue>
            </SheetProperties>
          </SheetSection>

          {run.failedItemRefs.length > 0 && (
            <SheetSection>
              <SheetSectionHeader>Failed items</SheetSectionHeader>
              <p className="text-muted-foreground mb-2 text-xs">
                Up to 50 — they stay due, so the next run retries them. The job&apos;s own <code>describeItem()</code> label.
              </p>
              <ul className="border-border divide-border divide-y rounded-md border font-mono text-xs">
                {run.failedItemRefs.map((ref, i) => (
                  <li key={`${i}-${ref}`} className="px-3 py-2 break-words">
                    {ref}
                  </li>
                ))}
              </ul>
            </SheetSection>
          )}

          {run.outcome === 'job_failed' && (
            <SheetSection>
              <SheetSectionHeader>Error</SheetSectionHeader>
              {full.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : full.isError && !gone ? (
                <ErrorMessage title="Couldn't load the full error" error={full.error} onRetry={() => full.refetch()} />
              ) : (
                <pre className="border-border bg-muted max-h-96 overflow-auto rounded-md border px-3 py-3 font-mono text-xs whitespace-pre-wrap">
                  {run.error ?? '—'}
                </pre>
              )}
            </SheetSection>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
