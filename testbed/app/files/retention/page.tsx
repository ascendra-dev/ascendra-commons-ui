'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LuArrowUpRight } from 'react-icons/lu';
import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardHeaderSubtitle,
  CardHeaderTitle,
  CardList,
  CardListItem,
  CardPanel,
  DashboardContent,
  DataTableLoadingBody,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorMessage,
  ErrorState,
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
  WithError,
  WithSkeleton,
  toast,
} from '@/ascendra-ui';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import { backgroundJobsApi, backgroundJobsLinks } from '@/ascendra-commons-ui/background-jobs.ui';
import { fileStorageApi, fileStorageLinks, fileStorageQueryIds, formatBytes, type RetentionRunResult } from '@/ascendra-commons-ui/file-storage.ui';
import { TenantPicker, useFileScope } from '../_scope';
import { tenantName } from '../tenants';

/** The app's retention job — its name in background-jobs (ascendra-commons-sandbox schedules it daily). */
const RETENTION_JOB = 'file-retention';

const TRIGGERS = { scheduled: 'scheduled', bootstrap: 'at start-up', manual: 'run now' } as const;

/** What the nightly retention run is working on — files reaching their date, what's held back, and how long the logs keep rows. */
export default function FileRetentionPage() {
  const { platform, tenantId, can } = useFileScope();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const volume = useQuery({ queryKey: ['file-retention', tenantId ?? null], queryFn: () => fileStorageApi.retention(tenantId) });
  // The run's history is background-jobs' — read only when the app has it and the viewer may see it.
  const jobs = useQuery({ queryKey: ['jobs'], queryFn: () => backgroundJobsApi.jobs(), enabled: can('job.view') });
  const job = jobs.data?.find((j) => j.name === RETENTION_JOB);
  const v = volume.data;
  const heldLink = fileStorageLinks.files({ queryId: fileStorageQueryIds.held, params: tenantId ? { tenantId } : {} });

  const run = useMutation({
    mutationFn: () => fileStorageApi.runRetention(),
    onSuccess: async (r: RetentionRunResult) => {
      toast.success('Retention ran', { description: runSummary(r) });
      setConfirming(false);
      await queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith('file') || q.queryKey[0] === 'jobs' || q.queryKey[0] === 'data-table' });
    },
    onError: (e) => toast.error("Couldn't run retention", { description: e instanceof Error ? e.message : undefined }),
  });

  const tiles: Array<{ key: string; label: string; value: number | undefined; caption: string; href?: string }> = [
    {
      key: 'files',
      label: 'Files',
      value: v?.files.count,
      caption: v ? `${formatBytes(v.files.totalBytes)}${v.files.oldestCreatedAt ? ` · oldest ${formatDateTime(v.files.oldestCreatedAt)}` : ''}` : '',
    },
    { key: 'expiring', label: 'Expiring in 30 days', value: v?.files.expiringWithin30Days, caption: 'deleted on their date' },
    { key: 'past', label: 'Past their date', value: v?.files.pastRetention, caption: 'the next run deletes these' },
    { key: 'indefinite', label: 'Kept indefinitely', value: v?.files.indefinite, caption: 'types without a retention' },
    { key: 'held', label: 'On legal hold', value: v?.files.held, caption: 'skipped by retention', href: heldLink },
  ];

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Volume &amp; retention</PageTitle>
          <PageSubtitle>
            What the retention run is working on{tenantId ? ` for ${tenantName(tenantId)}` : ''} — files reaching their date, what&apos;s held back, and how long the logs
            keep their rows.
          </PageSubtitle>
        </PageHeaderGroup>
        {platform && (
          <PageHeaderAction className="flex w-fit gap-2">
            <TenantPicker />
          </PageHeaderAction>
        )}
      </PageHeader>
      <DashboardContent>
        <WithError>
          <ErrorState if={volume.isError}>
            <Card>
              <CardPanel>
                <ErrorMessage title="Failed to load retention" error={volume.error} onRetry={() => volume.refetch()} />
              </CardPanel>
            </Card>
          </ErrorState>
          <NormalState if={!volume.isError}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {tiles.map(({ key, ...tile }) => (
                <Tile key={key} {...tile} />
              ))}
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-6">
                <Card className="h-full">
                  <CardHeader>
                    <CardHeaderTitle>Logs</CardHeaderTitle>
                    <CardHeaderSubtitle>Rows the run trims</CardHeaderSubtitle>
                  </CardHeader>
                  <CardPanel>
                    {v ? (
                      <CardList columns="minmax(0,1fr) auto">
                        <CardListItem>
                          <div>
                            Access log — who opened what
                            <div className="text-muted-foreground mt-1 text-xs">
                              kept {formatCount(v.policy.accessLogDays)} days{v.accessLog.oldestAt ? ` · oldest ${formatDateTime(v.accessLog.oldestAt)}` : ''}
                            </div>
                          </div>
                          <div className="self-start text-right tabular-nums">{formatCount(v.accessLog.rows)} rows</div>
                        </CardListItem>
                        <CardListItem>
                          <div>
                            <Link href={fileStorageLinks.rejections()} className="hover:underline underline-offset-2">
                              Refused uploads
                            </Link>
                            <div className="text-muted-foreground mt-1 text-xs">
                              kept {formatCount(v.policy.rejectionLogDays)} days — they carry filenames
                              {v.rejections.oldestAt ? ` · oldest ${formatDateTime(v.rejections.oldestAt)}` : ''}
                            </div>
                          </div>
                          <div className="self-start text-right tabular-nums">{formatCount(v.rejections.rows)} rows</div>
                        </CardListItem>
                      </CardList>
                    ) : (
                      <DataTableLoadingBody isLoading className="h-32" />
                    )}
                  </CardPanel>
                </Card>
              </div>
              <div className="col-span-12 lg:col-span-6">
                <Card className="h-full">
                  <CardHeader>
                    <CardHeaderTitle>The retention run</CardHeaderTitle>
                    <CardHeaderSubtitle>
                      Deletes files past their date (not held), trims both logs, drops abandoned uploads — <span className="font-mono">{RETENTION_JOB}</span>
                      {job?.cadence ? `, every ${job.cadence.label}` : ''}
                    </CardHeaderSubtitle>
                  </CardHeader>
                  <CardPanel>
                    {!can('job.view') ? (
                      <p className="text-muted-foreground p-5">Its runs are in Background jobs, which takes job.view.</p>
                    ) : !jobs.data ? (
                      <DataTableLoadingBody isLoading className="h-32" />
                    ) : !job ? (
                      <p className="text-muted-foreground p-5">The app doesn&apos;t schedule {RETENTION_JOB} — run it from its own scheduler, or below.</p>
                    ) : (
                      <CardList columns="minmax(0,1fr) auto">
                        <CardListItem>
                          <div>
                            Last run
                            <div className="text-muted-foreground mt-1 text-xs">
                              {job.lastRun
                                ? `${TRIGGERS[job.lastRun.trigger]} · ${formatCount(job.lastRun.itemsProcessed)} of ${formatCount(job.lastRun.itemsDue)} due handled`
                                : 'never run'}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 self-start text-right">
                            {job.lastRun && <span className="tabular-nums">{formatDateTime(job.lastRun.startedAt, { style: 'relative' })}</span>}
                            {job.lastRun && (
                              <SimpleBadge variant={job.lastRun.outcome === 'completed' ? 'green' : 'red'}>{job.lastRun.outcome.replaceAll('_', ' ')}</SimpleBadge>
                            )}
                          </div>
                        </CardListItem>
                        {job.overdue && (
                          <CardListItem>
                            <div className="text-orange-600 dark:text-orange-400">Overdue{job.overdueBy ? ` by ${job.overdueBy}` : ''}</div>
                            <div />
                          </CardListItem>
                        )}
                      </CardList>
                    )}
                  </CardPanel>
                  <CardFooter className="flex flex-wrap items-center gap-3">
                    {platform && can('file.delete') && (
                      <Button variant="secondary" onClick={() => setConfirming(true)}>
                        Run now
                      </Button>
                    )}
                    {can('job.view') && job && (
                      <Link href={backgroundJobsLinks.job(RETENTION_JOB)} className="text-primary text-xs underline-offset-2 hover:underline">
                        Its runs in Background jobs
                      </Link>
                    )}
                  </CardFooter>
                </Card>
              </div>
            </div>
          </NormalState>
        </WithError>
      </DashboardContent>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run retention now?</DialogTitle>
            <DialogDescription>
              One pass, the same as the scheduled one, across every tenant: files past their date go (held files stay), log rows past their keep go, abandoned
              uploads are dropped.{v && v.files.pastRetention > 0 ? ` ${formatCount(v.files.pastRetention)} ${v.files.pastRetention === 1 ? 'file is' : 'files are'} past their date${tenantId ? ` in ${tenantName(tenantId)}` : ''}.` : ''}{' '}
              Each delete is audited.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button disabled={run.isPending} onClick={() => run.mutate()}>
              {run.isPending ? 'Running…' : 'Run now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function runSummary(r: RetentionRunResult): string {
  const parts = [
    `${formatCount(r.filesDeleted)} ${r.filesDeleted === 1 ? 'file' : 'files'} deleted (${formatBytes(r.bytesFreed)})`,
    `${formatCount(r.accessLogRowsDeleted + r.rejectionRowsDeleted)} log rows trimmed`,
  ];
  if (r.expiredUploadsDropped) parts.push(`${formatCount(r.expiredUploadsDropped)} abandoned ${r.expiredUploadsDropped === 1 ? 'upload' : 'uploads'} dropped`);
  if (r.blobDeleteFailures) parts.push(`${formatCount(r.blobDeleteFailures)} left bytes behind — see Stray blobs`);
  return parts.join(' · ');
}

function Tile({ label, value, caption, href }: { label: string; value: number | undefined; caption: string; href?: string }) {
  const card = (
    <Card className="h-full">
      <CardPanel>
        <KpiTile>
          <KpiLabel className="flex items-center justify-between gap-2">
            {label}
            {href && <LuArrowUpRight className="text-muted-foreground group-hover:text-foreground size-3.5 shrink-0 transition-colors" />}
          </KpiLabel>
          <div className="pt-4">
            <WithSkeleton>
              <SkeletonState if={value === undefined}>
                <Skeleton className="h-8 w-24" />
              </SkeletonState>
              <NormalState if={value !== undefined}>
                <KpiValue>{formatCount(value ?? 0)}</KpiValue>
              </NormalState>
            </WithSkeleton>
          </div>
          <KpiCaption className="text-muted-foreground/60 mt-1 text-[0.6875rem]">{caption}</KpiCaption>
        </KpiTile>
      </CardPanel>
    </Card>
  );
  return href ? (
    <Link href={href} aria-label={`${label} — open the list`} className="group focus-visible:outline-primary block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2">
      {card}
    </Link>
  ) : (
    <div className="h-full">{card}</div>
  );
}
