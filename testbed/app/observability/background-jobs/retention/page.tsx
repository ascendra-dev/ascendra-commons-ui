'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BackLink,
  Card,
  CardHeader,
  CardHeaderSubtitle,
  CardHeaderTitle,
  CardPanel,
  ChartBarLink,
  DashboardContent,
  ErrorMessage,
  ErrorState,
  KpiCaption,
  KpiLabel,
  KpiTile,
  KpiValue,
  NormalState,
  PageHeader,
  PageHeaderGroup,
  PageSubtitle,
  PageTitle,
  Skeleton,
  SkeletonState,
  WithError,
  WithSkeleton,
  useBackTo,
} from '@/ascendra-ui';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/ascendra-ui/shadcn';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import { backgroundJobsApi, type RunVolume } from '@/ascendra-commons-ui/background-jobs.ui/api';
import { formatBytes } from '@/ascendra-commons-ui/background-jobs.ui/display';
import { backgroundJobsLinks } from '@/ascendra-commons-ui/background-jobs.ui/links';
import { MAX_RANGE_DAYS, backgroundJobsQueryIds } from '@/ascendra-commons-ui/background-jobs.ui/queries';

const VOLUME_DAYS = 30;

/** The pruner the module ships — the Retention tile opens its Job screen. */
const PRUNER_JOB = 'job-run-pruner';

/** Stacked: the clean runs, and the two kinds of failing run on top. */
const chartConfig: ChartConfig = {
  clean: { label: 'Clean', color: 'var(--chart-1)' },
  withFailedItems: { label: 'With failed items', color: 'var(--color-orange-400)' },
  jobFailed: { label: 'Job failed', color: 'var(--color-red-500)' },
};
const formatDayTick = (day: string) => formatDateTime(day, { style: 'short' });

/** The viewer's IANA time zone — the chart counts its days in it. */
const viewerTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const fetchVolume = () => backgroundJobsApi.volume(viewerTimeZone());

/** One chart day (`YYYY-MM-DD`, the viewer's calendar) in Runs — the date as both ends, exactly what picking that day
 *  in the form does. */
const dayLink = (day: string) =>
  backgroundJobsLinks.list({ queryId: backgroundJobsQueryIds.advancedFilter, params: { startedRange: { from: day, to: day } } });

/** A day's bar segments — clean is what's left of the runs after the two kinds of failing run. */
const chartRows = (perDay: RunVolume['perDay']) =>
  perDay.map((d) => ({
    day: d.day,
    clean: d.runs - d.withFailedItems - d.jobFailed,
    withFailedItems: d.withFailedItems,
    jobFailed: d.jobFailed,
  }));

/** The chart's loading-state data (AUI-032): the real chart over a flat placeholder — the 30 days are knowable now. */
function buildPlaceholderPerDay(): Array<{ day: string; clean: number }> {
  const today = new Date();
  return Array.from({ length: VOLUME_DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (VOLUME_DAYS - 1 - i));
    return { day: format(d, 'yyyy-MM-dd'), clean: 1 };
  });
}

/** Static per-tile copy — renders immediately; only the value (and the oldest window's caption) comes from the query. */
function volumeTiles(volume: RunVolume | undefined) {
  const oldest = volume?.oldestStartedAt;
  return [
    {
      key: 'oldest',
      label: 'Oldest run',
      value: volume && (oldest ? formatDateTime(oldest) : '—'),
      caption: oldest ? formatDateTime(oldest, { style: 'relative', relativeFallbackDays: Infinity }) : 'How far back the history goes',
    },
    {
      key: 'rows',
      label: 'Stored runs',
      value: volume && formatCount(volume.rowCount),
      caption: 'One per run that took its lock, this application',
    },
    {
      key: 'size',
      label: 'Table size',
      value: volume && (volume.tableSizeBytes == null ? '—' : formatBytes(volume.tableSizeBytes)),
      caption: 'On disk, every application sharing it',
    },
  ];
}

/** Reached via the "Volume & Retention" button on the Background Jobs overview — not nav. Domain events', for runs. */
export default function BackgroundJobRetentionPage() {
  const backTo = useBackTo('retention');
  const placeholderPerDay = useMemo(() => buildPlaceholderPerDay(), []);
  // Same key as the Overview's oldest-run footnote — one read serves both.
  const volume = useQuery({ queryKey: ['background-jobs-volume'], queryFn: fetchVolume });
  const stats = volume.data;
  const tiles = volumeTiles(stats);
  const perDay = stats?.perDay ?? [];
  const rows = useMemo(() => chartRows(stats?.perDay ?? []), [stats]);
  const subtitle = stats
    ? `Past 30 days · ${formatDateTime(perDay[0].day)} – ${formatDateTime(perDay[perDay.length - 1].day)}, your time zone`
    : 'Past 30 days, your time zone';

  return (
    <>
      <BackLink href={backgroundJobsLinks.overview()}>Back to overview</BackLink>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Volume &amp; Retention</PageTitle>
          <PageSubtitle>The trend behind the runs, and the health of the history itself — how far back, how big.</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <DashboardContent>
        {/* Same shell-stays, content-swaps discipline as the Overview (AUI-021/022): one query, one error state. */}
        <WithError>
          <ErrorState if={volume.isError}>
            <Card>
              <CardPanel>
                <ErrorMessage title="Failed to load volume" error={volume.error} onRetry={() => volume.refetch()} />
              </CardPanel>
            </Card>
          </ErrorState>
          <NormalState if={!volume.isError}>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {tiles.map((tile) => (
                <Card key={tile.key} className="h-full">
                  <CardPanel>
                    <KpiTile>
                      <KpiLabel>{tile.label}</KpiLabel>
                      <div className="mt-auto pt-4">
                        <WithSkeleton>
                          <SkeletonState if={!stats}>
                            <Skeleton className="h-8 w-24" />
                          </SkeletonState>
                          <NormalState if={!!stats}>
                            <KpiValue>{tile.value}</KpiValue>
                          </NormalState>
                        </WithSkeleton>
                      </div>
                      <KpiCaption className="text-muted-foreground/60 mt-1 text-[0.6875rem]">{tile.caption}</KpiCaption>
                    </KpiTile>
                  </CardPanel>
                </Card>
              ))}
              {/* Not a query result: the module ships JobRunPrunerJob, but it runs only if the app schedules it — this
                  console assumes the 90 days its Runs filter stops at. The oldest run shows whether it's running. */}
              <Card className="h-full">
                <CardPanel>
                  <KpiTile>
                    <KpiLabel>Retention</KpiLabel>
                    <div className="mt-auto pt-4">
                      <KpiValue>{MAX_RANGE_DAYS} days</KpiValue>
                    </div>
                    <KpiCaption className="text-muted-foreground/60 mt-1 text-[0.6875rem]">
                      <Link href={backTo(backgroundJobsLinks.job(PRUNER_JOB))} className="hover:text-foreground underline">
                        {PRUNER_JOB}
                      </Link>{' '}
                      — a job like any other
                    </KpiCaption>
                  </KpiTile>
                </CardPanel>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardHeaderTitle>Runs per day</CardHeaderTitle>
                <CardHeaderSubtitle>{subtitle}</CardHeaderSubtitle>
              </CardHeader>
              <CardPanel>
                <div className="p-5">
                  <WithSkeleton>
                    <SkeletonState if={!stats}>
                      <ChartContainer config={chartConfig} className="h-56 w-full animate-pulse">
                        <BarChart data={placeholderPerDay} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} strokeWidth={0.5} />
                          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={4} tickFormatter={formatDayTick} />
                          <YAxis tickLine={false} axisLine={false} tick={false} width={40} />
                          <Bar dataKey="clean" fill="var(--muted)" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </SkeletonState>
                    <NormalState if={!!stats}>
                      <ChartContainer config={chartConfig} className="h-56 w-full">
                        {/* Each day's column is a link (ChartBarLink on the top bar) — anywhere in it, not just its bar — to that day's runs. */}
                        <BarChart
                          data={rows}
                          margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} strokeWidth={0.5} />
                          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={4} tickFormatter={formatDayTick} />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11 }}
                            width={40}
                            allowDecimals={false}
                            tickFormatter={(v: number) => formatCount(v)}
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                labelFormatter={(day) => formatDateTime(String(day))}
                                formatter={(v, name) => [formatCount(Number(v)), ` ${chartConfig[String(name)]?.label ?? name}`]}
                              />
                            }
                          />
                          <Bar dataKey="clean" stackId="day" fill="var(--color-clean)" />
                          <Bar dataKey="withFailedItems" stackId="day" fill="var(--color-withFailedItems)" />
                          <Bar
                            dataKey="jobFailed" stackId="day" fill="var(--color-jobFailed)" radius={[3, 3, 0, 0]}
                            shape={<ChartBarLink href={(row: { day: string }) => dayLink(row.day)} />}
                          />
                        </BarChart>
                      </ChartContainer>
                    </NormalState>
                  </WithSkeleton>
                </div>
              </CardPanel>
            </Card>
          </NormalState>
        </WithError>
      </DashboardContent>
    </>
  );
}
