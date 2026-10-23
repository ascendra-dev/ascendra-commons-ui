'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
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
  SimpleBadge,
  Skeleton,
  SkeletonState,
  WithError,
  WithSkeleton,
} from '@/ascendra-ui';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/ascendra-ui/shadcn';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import { rateLimitApi, type RejectionVolume } from '@/ascendra-commons-ui/rate-limiting.ui/api';
import { rateLimitLinks } from '@/ascendra-commons-ui/rate-limiting.ui/links';
import { rateLimitQueryIds } from '@/ascendra-commons-ui/rate-limiting.ui/queries';

const VOLUME_DAYS = 30;

const chartConfig: ChartConfig = { count: { label: 'Rejections', color: 'var(--chart-1)' } };
const formatDayTick = (day: string) => formatDateTime(day, { style: 'short' });

/** The viewer's IANA time zone — the chart counts its days in it. */
const viewerTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const fetchVolume = () => rateLimitApi.volume(viewerTimeZone());

/** One chart day (`YYYY-MM-DD`, the viewer's calendar) in the Rejections list — the date as both ends, exactly what
 *  picking that day in the form does. */
const dayLink = (day: string) =>
  rateLimitLinks.list({ queryId: rateLimitQueryIds.advancedFilter, params: { rejectedRange: { from: day, to: day } } });

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

/** The chart's loading-state data (AUI-032): the real chart over a flat placeholder — the 30 days are knowable now. */
function buildPlaceholderPerDay(): RejectionVolume['perDay'] {
  const today = new Date();
  return Array.from({ length: VOLUME_DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (VOLUME_DAYS - 1 - i));
    return { day: format(d, 'yyyy-MM-dd'), count: 1 };
  });
}

/** Static per-tile copy — renders immediately; only the value (and the oldest window's caption) comes from the query. */
function volumeTiles(volume: RejectionVolume | undefined) {
  const oldest = volume?.oldestWindowAt;
  return [
    {
      key: 'oldest',
      label: 'Oldest window',
      value: volume && (oldest ? formatDateTime(oldest) : '—'),
      caption: oldest ? formatDateTime(oldest, { style: 'relative', relativeFallbackDays: Infinity }) : 'How far back the log goes',
    },
    {
      key: 'rows',
      label: 'Stored windows',
      value: volume && formatCount(volume.rowCount),
      caption: 'One per source, route and minute',
    },
    {
      key: 'size',
      label: 'Table size',
      value: volume && (volume.tableSizeBytes == null ? '—' : formatBytes(volume.tableSizeBytes)),
      caption: 'On disk, every application sharing it',
    },
  ];
}

/** Reached via the "Volume & Retention" button on the Rate Limiting overview — not nav. Audit's Retention & Volume, for
 *  rate limits. */
export default function RateLimitRetentionPage() {
  const placeholderPerDay = useMemo(() => buildPlaceholderPerDay(), []);
  const volume = useQuery({ queryKey: ['rate-limit-volume'], queryFn: fetchVolume });
  const stats = volume.data;
  const tiles = volumeTiles(stats);
  const perDay = stats?.perDay ?? [];
  const subtitle = stats
    ? `Past 30 days · ${formatDateTime(perDay[0].day)} – ${formatDateTime(perDay[perDay.length - 1].day)}, your time zone`
    : 'Past 30 days, your time zone';

  return (
    <>
      <BackLink href={rateLimitLinks.overview()}>Back to overview</BackLink>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Volume &amp; Retention</PageTitle>
          <PageSubtitle>The trend behind the rejections, and the health of the log itself — how far back, how big.</PageSubtitle>
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
              {/* Not a query result: the module never prunes; the app calls pruneRejections() on its own schedule. */}
              <Card className="h-full">
                <CardPanel>
                  <KpiTile>
                    <KpiLabel>Retention</KpiLabel>
                    <div className="mt-auto pt-4">
                      <SimpleBadge variant="info">Set by the app</SimpleBadge>
                    </div>
                    <KpiCaption className="text-muted-foreground/60 mt-1 text-[0.6875rem]">
                      Pruned on the app&apos;s schedule — the oldest window shows it&apos;s running
                    </KpiCaption>
                  </KpiTile>
                </CardPanel>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardHeaderTitle>Rejections per day</CardHeaderTitle>
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
                          <Bar dataKey="count" fill="var(--muted)" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </SkeletonState>
                    <NormalState if={!!stats}>
                      <ChartContainer config={chartConfig} className="h-56 w-full">
                        {/* Each day's column is a link (ChartBarLink on the top bar) — anywhere in it, not just its bar — to that day's rejections. */}
                        <BarChart
                          data={perDay}
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
                                formatter={(v) => [formatCount(Number(v)), ' Rejections']}
                              />
                            }
                          />
                          <Bar
                            dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]}
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
