'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { LuArrowUpRight, LuDatabase, LuHistory, LuLock } from 'react-icons/lu';
import {
  Button,
  Card,
  CardFooter,
  CardFooterIcon,
  CardHeaderSubtitle,
  CardHeaderTitle,
  CardPanel,
  DashboardContent,
  DataTableEmptyBody,
  DataTableErrorBody,
  DataTableLoadingBody,
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
  SegmentControl,
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
  TableRowLink,
  TableWrapper,
  WithError,
  WithSkeleton,
  WithTooltip,
  type TriggerParams,
} from '@/ascendra-ui';
import { cn } from '@/ascendra-ui/shadcn';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import { backgroundJobsApi, type JobStatus } from '@/ascendra-commons-ui/background-jobs.ui/api';
import {
  cadenceLabel,
  jobHealth,
  needsAttention,
  runResult,
  runResultLabel,
} from '@/ascendra-commons-ui/background-jobs.ui/display';
import { backgroundJobsLinks } from '@/ascendra-commons-ui/background-jobs.ui/links';
import { backgroundJobsQueryIds } from '@/ascendra-commons-ui/background-jobs.ui/queries';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** The period picker — the tiles count over it; the jobs lists are always "now". */
const PERIODS = [
  { value: 'day', label: 'Past 24 hours', ms: DAY_MS },
  { value: 'week', label: 'Past 7 days', ms: 7 * DAY_MS },
  { value: 'month', label: 'Past 30 days', ms: 30 * DAY_MS },
] as const;
type Period = (typeof PERIODS)[number];

/** Each jobs list shows this many rows, then scrolls. */
const JOBS_VISIBLE = 5;

/** The period's numbers, counted back from when each fetch runs. */
const since = (period: Period) => new Date(Date.now() - period.ms);

/**
 * Runs, filtered by Advanced Filter to runs that started in the period, plus any other of its fields — the range the
 * number clicked was counted over, so the list adds up to that number. Exact instants ending when the numbers were
 * fetched (`dataUpdatedAt`), never render time.
 */
const periodLink = (asOf: number, period: Period, fields: TriggerParams = {}) =>
  backgroundJobsLinks.list({
    queryId: backgroundJobsQueryIds.advancedFilter,
    params: { ...fields, startedRange: { from: new Date(asOf - period.ms), to: new Date(asOf) } },
  });

type Tone = 'warn' | 'alert' | undefined;

const plural = (n: number, one: string, many: string) => `${formatCount(n)} ${n === 1 ? one : many}`;

/** The Background Jobs module's landing page — backgroundJobsNav's one entry points here. */
export default function BackgroundJobsOverviewPage() {
  const [periodValue, setPeriodValue] = useState<Period['value']>('day');
  const period = PERIODS.find((p) => p.value === periodValue) ?? PERIODS[0];

  // Independent queries, so a slow one never holds back the other. The jobs read isn't period-bound.
  const summary = useQuery({ queryKey: ['background-jobs-summary', period.value], queryFn: () => backgroundJobsApi.summary(since(period)) });
  const jobs = useQuery({ queryKey: ['background-jobs-jobs'], queryFn: () => backgroundJobsApi.jobs() });

  const s = summary.data;
  const asOf = summary.dataUpdatedAt;
  const attention = sortByUrgency((jobs.data ?? []).filter(needsAttention));
  const rest = (jobs.data ?? []).filter((job) => !needsAttention(job));

  const tiles: { key: string; label: string; value: number; caption: string; tone?: Tone; href?: string }[] = [
    {
      key: 'runs',
      label: 'Runs',
      value: s?.runs ?? 0,
      caption: s ? `${plural(s.jobs, 'job', 'jobs')} · ${formatCount(s.manual)} run by hand` : period.label,
      href: s && periodLink(asOf, period),
    },
    {
      key: 'with-failed-items',
      label: 'With failed items',
      value: s?.withFailedItems ?? 0,
      caption: s ? `${plural(s.itemsFailed, 'item', 'items')} failed — they retry next run` : period.label,
      tone: s && s.withFailedItems > 0 ? 'warn' : undefined,
      href: s && periodLink(asOf, period, { hasFailedItems: 'true' }),
    },
    {
      key: 'job-failures',
      label: 'Job failures',
      value: s?.jobFailed ?? 0,
      caption: s ? "couldn't even find its work" : period.label,
      tone: s && s.jobFailed > 0 ? 'alert' : undefined,
      href: s && periodLink(asOf, period, { outcome: 'job_failed' }),
    },
  ];

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Background Jobs</PageTitle>
          <PageSubtitle>Is any job broken, stuck or stalled — a scheduled job fails quietly, nobody is waiting on it.</PageSubtitle>
        </PageHeaderGroup>
        <PageHeaderAction className="flex w-fit gap-2">
          <Button variant="secondary" asChild>
            <Link href={backgroundJobsLinks.retention()}>
              <LuDatabase />
              Volume &amp; Retention
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href={backgroundJobsLinks.locks()}>
              <LuLock />
              Locks
            </Link>
          </Button>
          <Button asChild>
            <Link href={backgroundJobsLinks.list()}>Go to Runs</Link>
          </Button>
        </PageHeaderAction>
      </PageHeader>
      <DashboardContent>
        {/* The period picker, and how far back the history goes — page-wide, so it sits beside the picker. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentControl segments={PERIODS} value={period.value} onValueChange={(v) => setPeriodValue(v as Period['value'])} />
          <OldestKept />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <WithError>
            <ErrorState if={summary.isError}>
              <Card className="sm:col-span-2 lg:col-span-3">
                <CardPanel>
                  <ErrorMessage title="Failed to load runs" error={summary.error} onRetry={() => summary.refetch()} />
                </CardPanel>
              </Card>
            </ErrorState>
            <NormalState if={!summary.isError}>
              {tiles.map(({ key, ...tile }) => (
                <Tile key={key} {...tile} loading={!s} />
              ))}
            </NormalState>
          </WithError>
          {/* Not a count of runs — a count of jobs, now — so it doesn't open the list: its panel is the breakdown. */}
          <Tile
            label="Needs attention"
            value={jobs.isError ? null : attention.length}
            caption={jobs.isError ? "Couldn't load jobs" : 'jobs failing or overdue — now'}
            tone={attention.length > 0 ? 'alert' : undefined}
            loading={!jobs.data && !jobs.isError}
          />
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-6">
            <JobsCard
              title="Needs attention"
              subtitle="Failing 2+ runs in a row, or overdue — worst first"
              jobs={attention}
              query={jobs}
              emptyTitle="Nothing needs attention"
              emptyDescription="Every job ran clean on its last run and none is overdue."
              href={backgroundJobsLinks.job}
              renderMeta={attentionMeta}
            />
          </div>
          <div className="col-span-12 lg:col-span-6">
            <JobsCard
              title="Jobs"
              subtitle="Everything else, by name"
              jobs={rest}
              query={jobs}
              emptyTitle={jobs.data?.length ? 'Every job needs attention' : 'No job runs recorded'}
              emptyDescription={
                jobs.data?.length
                  ? 'See the list beside this one.'
                  : "No job has run and none declares a cadence — or the run recorder isn't wired (jobRunRecorderToken)."
              }
              href={backgroundJobsLinks.job}
              renderMeta={jobMeta}
              note={
                jobs.data?.length
                  ? `${plural(jobs.data.length, 'job', 'jobs')} in all, both lists — every job that ran, declares a cadence, or can be run now.`
                  : undefined
              }
            />
          </div>
        </div>
      </DashboardContent>
    </>
  );
}

/** Failing before overdue / never run; then by name. */
function sortByUrgency(jobs: JobStatus[]): JobStatus[] {
  const rank = (job: JobStatus) => (jobHealth(job).variant === 'red' ? 0 : 1);
  return [...jobs].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

const lastRunLabel = (job: JobStatus) =>
  job.lastRun
    ? `last ${formatDateTime(job.lastRun.startedAt, { style: 'short', time: true })} · ${runResultLabel(runResult(job.lastRun))}`
    : 'never run';

/** What's wrong, in a line: the last error or failed item, the overdue job's cadence, or why it can't run. */
function attentionMeta(job: JobStatus): string {
  const last = job.lastRun;
  if (job.consecutiveFailures >= 2 && last) {
    const why = last.outcome === 'job_failed' ? firstLine(last.error) : last.failedItemRefs[0];
    return `${lastRunLabel(job)}${why ? ` · ${why}` : ''}`;
  }
  if (!last) {
    return `${cadenceLabel(job.cadence)} · ${job.triggerable ? 'nothing has scheduled it yet' : "nothing schedules it, and it can't be run from here"}`;
  }
  return `${cadenceLabel(job.cadence)} · ${lastRunLabel(job)}`;
}

const jobMeta = (job: JobStatus) => `${cadenceLabel(job.cadence)} · ${lastRunLabel(job)}`;

const firstLine = (text: string | null) => text?.split('\n')[0];

function Tile({
  label,
  value,
  caption,
  tone,
  href,
  loading,
}: {
  label: string;
  /** `null` when its read failed — a dash, never a confident 0. */
  value: number | null;
  caption: string;
  tone?: Tone;
  href?: string;
  loading: boolean;
}) {
  const card = (
    <Card className="h-full">
      <CardPanel>
        <KpiTile>
          <KpiLabel className="flex items-center justify-between gap-2">
            {label}
            {href && <LuArrowUpRight className="text-muted-foreground group-hover:text-foreground size-3.5 shrink-0 transition-colors" />}
          </KpiLabel>
          <div className="mt-auto pt-4">
            <WithSkeleton>
              <SkeletonState if={loading}>
                <Skeleton className="h-8 w-24" />
              </SkeletonState>
              <NormalState if={!loading}>
                <KpiValue className={cn(tone === 'warn' && 'text-orange-600 dark:text-orange-400', tone === 'alert' && 'text-negative')}>
                  {value == null ? '—' : formatCount(value)}
                </KpiValue>
              </NormalState>
            </WithSkeleton>
          </div>
          <KpiCaption className="text-muted-foreground/60 mt-1 text-[0.6875rem]">{caption}</KpiCaption>
        </KpiTile>
      </CardPanel>
    </Card>
  );
  return href ? (
    <Link
      href={href}
      aria-label={`${label} — open in Runs`}
      className="group focus-visible:outline-primary block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {card}
    </Link>
  ) : (
    <div className="h-full">{card}</div>
  );
}

/** A jobs list card — its title in the lg header row, a row per job opening the Job screen. */
function JobsCard({
  title,
  subtitle,
  jobs,
  query,
  emptyTitle,
  emptyDescription,
  href,
  renderMeta,
  note,
}: {
  title: string;
  subtitle: string;
  jobs: JobStatus[];
  query: { isLoading: boolean; isError: boolean; error: Error | null; data?: unknown; refetch: () => unknown };
  emptyTitle: string;
  emptyDescription: string;
  /** The Job screen a row opens. */
  href: (name: string) => string;
  renderMeta: (job: JobStatus) => string;
  /** What the rows don't say on their own, under the card. */
  note?: string;
}) {
  return (
    <TableWrapper>
      <Table visibleRows={JOBS_VISIBLE}>
        {/* The header row carries the list's title, not column labels — each row says what it is. */}
        <TableHeader>
          <TableHeaderRow size="lg">
            <TableHead>
              <CardHeaderTitle>{title}</CardHeaderTitle>
              <CardHeaderSubtitle>{subtitle}</CardHeaderSubtitle>
            </TableHead>
          </TableHeaderRow>
        </TableHeader>
        {jobs.length > 0 && (
          <TableBody>
            {jobs.map((job) => {
              const health = jobHealth(job);
              return (
                <TableRow key={job.name}>
                  {/* One cell: the name and its health on a line, the detail below at the row's full width. */}
                  <TableCell className="max-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <TableRowLink href={href(job.name)}>
                        <SimpleBadge>{job.name}</SimpleBadge>
                      </TableRowLink>
                      <SimpleBadge variant={health.variant}>{health.label}</SimpleBadge>
                    </div>
                    <div className="text-muted-foreground mt-1 truncate text-xs" title={renderMeta(job)}>
                      {renderMeta(job)}
                    </div>
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
        isEmpty={!!query.data && jobs.length === 0}
        title={emptyTitle}
        description={emptyDescription}
        className="h-65"
      />
      {note && (
        <CardFooter>
          <CardFooterIcon />
          <span>{note}</span>
        </CardFooter>
      )}
    </TableWrapper>
  );
}

/** How far back the history goes — from the volume read, so it shows the prune is running. */
function OldestKept() {
  const volume = useQuery({
    queryKey: ['background-jobs-volume'],
    queryFn: () => backgroundJobsApi.volume(Intl.DateTimeFormat().resolvedOptions().timeZone),
  });
  if (!volume.data?.oldestStartedAt) return null;
  return (
    <WithTooltip tooltip="How far back the run history goes — the app prunes on its own schedule">
      <SimpleBadge>
        <LuHistory />
        Oldest run kept · {formatDateTime(volume.data.oldestStartedAt, { time: true })}
      </SimpleBadge>
    </WithTooltip>
  );
}
