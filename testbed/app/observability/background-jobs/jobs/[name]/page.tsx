'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LuList, LuLoaderCircle, LuPlay } from 'react-icons/lu';
import {
  BackLink,
  Button,
  Card,
  CardHeaderSubtitle,
  CardHeaderTitle,
  CardPanel,
  DashboardContent,
  DataTableEmptyBody,
  DataTableErrorBody,
  DataTableLoadingBody,
  ErrorMessage,
  KpiCaption,
  KpiLabel,
  KpiTile,
  KpiValue,
  NormalState,
  PageHeader,
  PageHeaderAction,
  PageHeaderGroup,
  PageSubtitle,
  PageTitle,
  SimpleBadge,
  Skeleton,
  SkeletonState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
  TableWrapper,
  WithSkeleton,
  WithTooltip,
  toast,
} from '@/ascendra-ui';
import { cn } from '@/ascendra-ui/shadcn';
import { isApiError } from '@/ascendra-ui/lib/api';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import { backgroundJobsApi, type JobRun, type JobStatus, type JobTriggerResult } from '@/ascendra-commons-ui/background-jobs.ui/api';
import {
  ALERT_CONSECUTIVE_FAILURES,
  STREAK_WINDOW,
  runDuration,
  runResult,
  runResultLabel,
  runResultVariant,
  streakLabel,
} from '@/ascendra-commons-ui/background-jobs.ui/display';
import { backgroundJobsLinks } from '@/ascendra-commons-ui/background-jobs.ui/links';
import { backgroundJobsQueryIds } from '@/ascendra-commons-ui/background-jobs.ui/queries';
import { useSession } from '../../../auth/use-session';
import { RunSheet } from '../../_run-sheet';

/** Recent runs shows this many, then scrolls. */
const RECENT_RUNS = 20;
const ROWS_VISIBLE = 5;

type Tone = 'warn' | 'alert' | undefined;

const timeOfDay = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** One job — is it healthy, what keeps failing, and run it now. Opened from either Overview list. */
export default function BackgroundJobPage() {
  const name = decodeURIComponent(useParams<{ name: string }>().name);
  const router = useRouter();
  const [selected, setSelected] = useState<JobRun | null>(null);

  // Same key as the Overview — one read of GET /jobs serves both; this screen is its one row.
  const jobs = useQuery({ queryKey: ['background-jobs-jobs'], queryFn: () => backgroundJobsApi.jobs() });
  const failedItems = useQuery({ queryKey: ['background-jobs-failed-items', name], queryFn: () => backgroundJobsApi.failedItems(name) });
  const recent = useQuery({ queryKey: ['background-jobs-recent-runs', name], queryFn: () => backgroundJobsApi.recentRuns(name, RECENT_RUNS) });
  const locks = useQuery({ queryKey: ['background-jobs-locks'], queryFn: () => backgroundJobsApi.locks() });

  const job = jobs.data?.find((j) => j.name === name);
  const unknown = !!jobs.data && !job;
  const leftBehind = locks.data?.locks.some((lock) => lock.jobName === name && lock.state === 'expired');

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <BackLink href={backgroundJobsLinks.overview()}>Back to overview</BackLink>
          <PageTitle>{name}</PageTitle>
          <PageSubtitle>Is it healthy, what keeps failing — and run it now.</PageSubtitle>
        </PageHeaderGroup>
        <PageHeaderAction className="flex w-fit gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              router.push(backgroundJobsLinks.list({ queryId: backgroundJobsQueryIds.advancedFilter, params: { jobName: name } }))
            }
          >
            <LuList />
            All runs of this job
          </Button>
          {job && <RunNowButton job={job} />}
        </PageHeaderAction>
      </PageHeader>
      <DashboardContent>
        {jobs.isError && (
          <Card>
            <CardPanel>
              <ErrorMessage title="Failed to load the job" error={jobs.error} onRetry={() => jobs.refetch()} />
            </CardPanel>
          </Card>
        )}
        {unknown ? (
          <Card>
            <CardPanel>
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium">No job &ldquo;{name}&rdquo;</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  It hasn&apos;t run in the history kept, declares no cadence, and can&apos;t be run now.
                </p>
              </div>
            </CardPanel>
          </Card>
        ) : (
          !jobs.isError && (
            <>
              {job && !job.triggerable && (
                <p className="text-muted-foreground text-xs">
                  Nothing in the app can run this job — it isn&apos;t registered for triggering (<code>jobs: […]</code>), so
                  there&apos;s no Run now.
                </p>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {jobTiles(job, leftBehind).map((tile) => (
                  <Card key={tile.key} className="h-full">
                    <CardPanel>
                      <KpiTile>
                        <KpiLabel>{tile.label}</KpiLabel>
                        <div className="mt-auto pt-4">
                          <WithSkeleton>
                            <SkeletonState if={!job}>
                              <Skeleton className="h-8 w-24" />
                            </SkeletonState>
                            <NormalState if={!!job}>
                              <KpiValue
                                className={cn(tile.tone === 'warn' && 'text-orange-600 dark:text-orange-400', tile.tone === 'alert' && 'text-negative')}
                              >
                                {tile.value}
                              </KpiValue>
                            </NormalState>
                          </WithSkeleton>
                        </div>
                        <KpiCaption className="text-muted-foreground/60 mt-1 text-[0.6875rem]">{tile.caption}</KpiCaption>
                      </KpiTile>
                    </CardPanel>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 lg:col-span-6">
                  <FailedItemsCard query={failedItems} />
                </div>
                <div className="col-span-12 lg:col-span-6">
                  <RecentRunsCard query={recent} onOpen={setSelected} />
                </div>
              </div>
            </>
          )
        )}
        {selected && <RunSheet run={selected} onClose={() => setSelected(null)} />}
      </DashboardContent>
    </>
  );
}

/** Last run, last clean run, the failing streak and the cadence — the job's health at a glance. */
function jobTiles(job: JobStatus | undefined, leftBehind: boolean | undefined) {
  const last = job?.lastRun;
  const streak = job?.consecutiveFailures ?? 0;
  const tiles: { key: string; label: string; value: React.ReactNode; caption: React.ReactNode; tone?: Tone }[] = [
    {
      key: 'last-run',
      label: 'Last run',
      value: last ? formatDateTime(last.startedAt, { style: 'short' }) : '—',
      caption: last ? `${timeOfDay(last.startedAt)} · ${last.trigger} · ${runResultLabel(runResult(last))}` : 'never run',
    },
    {
      key: 'last-clean',
      label: 'Last clean run',
      value: job?.lastSuccessAt ? formatDateTime(job.lastSuccessAt, { style: 'short' }) : '—',
      caption: job?.lastSuccessAt
        ? `${timeOfDay(job.lastSuccessAt)} · ${formatDateTime(job.lastSuccessAt, { style: 'relative', relativeFallbackDays: Infinity })}`
        : 'none in the history kept',
    },
    {
      key: 'streak',
      label: 'Failing in a row',
      value: streakLabel(streak),
      caption:
        streak >= STREAK_WINDOW
          ? `every one of its last ${STREAK_WINDOW} runs`
          : streak === 0
            ? 'its last run was clean'
            : 'runs failed or with failed items',
      tone: streak >= ALERT_CONSECUTIVE_FAILURES ? 'alert' : streak > 0 ? 'warn' : undefined,
    },
    {
      key: 'cadence',
      label: 'Cadence',
      value: job?.cadence ? job.cadence.label : '—',
      caption: cadenceCaption(job, leftBehind),
      tone: job?.overdue ? 'warn' : undefined,
    },
  ];
  return tiles;
}

function cadenceCaption(job: JobStatus | undefined, leftBehind: boolean | undefined): React.ReactNode {
  if (!job) return '';
  if (!job.cadence) return 'none declared, none inferred — manual only';
  const source = job.cadence.source;
  const state = job.overdue ? (job.lastRun ? `overdue by ${job.overdueBy}` : 'overdue — never run') : 'on time';
  return (
    <>
      {source} · {state}
      {leftBehind && (
        <>
          {' · '}
          <Link href={backgroundJobsLinks.locks()} className="hover:text-foreground underline">
            a dead holder&apos;s lock
          </Link>
        </>
      )}
    </>
  );
}

/**
 * Run now — waits for the run (a spinner), then toasts the result and refreshes everything that counts runs. "Retry"
 * is the same thing: the job looks for its due items afresh, so the failed ones run again. A 409 is the lock doing its
 * job. Disabled, with the reason on hover, without `job.run`; absent for a job the app can't trigger.
 */
function RunNowButton({ job }: { job: JobStatus }) {
  const queryClient = useQueryClient();
  const canRun = useSession().data?.allowedActions.includes('job.run') ?? false;
  const runNow = useMutation({
    mutationFn: () => backgroundJobsApi.runNow(job.name),
    onSuccess: (result) => toastResult(job.name, result),
    onError: (error) => {
      if (isApiError(error) && error.status === 409) {
        toast.warning(`${job.name} is running now — try again when it finishes`);
      } else {
        toast.error(`Couldn't run ${job.name}`, { description: error instanceof Error ? error.message : undefined });
      }
    },
    onSettled: () => {
      for (const key of ['background-jobs-jobs', 'background-jobs-failed-items', 'background-jobs-recent-runs', 'background-jobs-summary', 'background-jobs-locks']) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });

  if (!job.triggerable) return null;
  const button = (
    <Button disabled={!canRun || runNow.isPending} onClick={() => runNow.mutate()}>
      {runNow.isPending ? <LuLoaderCircle className="animate-spin" /> : <LuPlay />}
      Run now
    </Button>
  );
  return canRun ? button : <WithTooltip tooltip="You don't have permission to run jobs">{button}</WithTooltip>;
}

function toastResult(name: string, result: JobTriggerResult) {
  if (result.status === 'job_failed') {
    toast.error(`${name} couldn't find its work — see the run`, { description: result.error.split('\n')[0] });
  } else if (result.itemsFailed > 0) {
    toast.warning(`${name} ran — ${formatCount(result.itemsDue)} due, ${formatCount(result.itemsProcessed)} processed, ${formatCount(result.itemsFailed)} failed`);
  } else {
    toast.success(`${name} ran — ${formatCount(result.itemsDue)} due, ${formatCount(result.itemsProcessed)} processed`);
  }
}

type ListQuery<T> = { data?: T; isLoading: boolean; isError: boolean; error: Error | null; refetch: () => unknown };

/** Items failing in 2+ of the job's last 50 runs — matched by its `describeItem()` label, so best-effort. */
function FailedItemsCard({ query }: { query: ListQuery<Awaited<ReturnType<typeof backgroundJobsApi.failedItems>>> }) {
  const items = query.data ?? [];
  return (
    <TableWrapper>
      <Table visibleRows={ROWS_VISIBLE}>
        <TableHeader>
          <TableHeaderRow size="lg">
            <TableHead colSpan={3}>
              <CardHeaderTitle>Failed items</CardHeaderTitle>
              <CardHeaderSubtitle>Failing in 2+ of its last {STREAK_WINDOW} runs · matched by label, best-effort</CardHeaderSubtitle>
            </TableHead>
          </TableHeaderRow>
          {items.length > 0 && (
            <TableHeaderRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right whitespace-nowrap">Runs failed in</TableHead>
              <TableHead>Last failed</TableHead>
            </TableHeaderRow>
          )}
        </TableHeader>
        {items.length > 0 && (
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.itemRef}>
                <TableCell className="w-full font-mono text-xs break-words whitespace-normal">{item.itemRef}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{formatCount(item.failureCount)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDateTime(item.lastFailedAt, { style: 'short', time: true })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>
      <DataTableLoadingBody isLoading={query.isLoading} className="h-65" />
      <DataTableErrorBody isError={query.isError} error={query.error} onRetry={() => query.refetch()} className="h-65" />
      <DataTableEmptyBody
        isLoading={query.isLoading}
        isEmpty={!!query.data && items.length === 0}
        title="No item keeps failing"
        description="No item failed in more than one of its recent runs."
        className="h-65"
      />
    </TableWrapper>
  );
}

/** The job's latest runs, newest first — a row opens the Run sheet. */
function RecentRunsCard({
  query,
  onOpen,
}: {
  query: ListQuery<Awaited<ReturnType<typeof backgroundJobsApi.recentRuns>>>;
  onOpen: (run: JobRun) => void;
}) {
  const runs = query.data?.data ?? [];
  return (
    <TableWrapper>
      <Table visibleRows={ROWS_VISIBLE}>
        <TableHeader>
          <TableHeaderRow size="lg">
            <TableHead colSpan={2}>
              <CardHeaderTitle>Recent runs</CardHeaderTitle>
              <CardHeaderSubtitle>Its latest {RECENT_RUNS}, newest first</CardHeaderSubtitle>
            </TableHead>
          </TableHeaderRow>
        </TableHeader>
        {runs.length > 0 && (
          <TableBody>
            {runs.map((run) => {
              const result = runResult(run);
              return (
                <TableRow key={run.id} className="cursor-pointer" onClick={() => onOpen(run)}>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(run.startedAt, { style: 'short', time: true })}{' '}
                    <span className="text-muted-foreground">· {run.trigger}</span>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {run.outcome === 'job_failed' ? 'nothing processed' : `${formatCount(run.itemsDue)} due`} · {runDuration(run)}
                    </div>
                  </TableCell>
                  <TableCell className="w-px text-right align-top whitespace-nowrap">
                    <SimpleBadge variant={runResultVariant(result)}>
                      {result === 'items_failed' ? `${formatCount(run.itemsFailed)} failed` : runResultLabel(result)}
                    </SimpleBadge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        )}
      </Table>
      <DataTableLoadingBody isLoading={query.isLoading} className="h-65" />
      <DataTableErrorBody isError={query.isError} error={query.error} onRetry={() => query.refetch()} className="h-65" />
      <DataTableEmptyBody
        isLoading={query.isLoading}
        isEmpty={!!query.data && runs.length === 0}
        title="Never run"
        description="No run of this job is in the history kept."
        className="h-65"
      />
    </TableWrapper>
  );
}
