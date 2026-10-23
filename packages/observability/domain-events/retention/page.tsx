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
import { domainEventsApi, type DeliveryVolume } from '@/ascendra-commons-ui/domain-events.ui/api';
import { formatBytes } from '@/ascendra-commons-ui/domain-events.ui/display';
import { domainEventsLinks } from '@/ascendra-commons-ui/domain-events.ui/links';
import { domainEventsQueryIds } from '@/ascendra-commons-ui/domain-events.ui/queries';

const VOLUME_DAYS = 30;

/** Stacked: what was delivered, and the two kinds of trouble on top. */
const chartConfig: ChartConfig = {
  delivered: { label: 'Delivered', color: 'var(--chart-1)' },
  noListeners: { label: 'No listeners', color: 'var(--color-orange-400)' },
  dispatchFailed: { label: 'Dispatch failed', color: 'var(--color-red-500)' },
};
const formatDayTick = (day: string) => formatDateTime(day, { style: 'short' });

/** The viewer's IANA time zone — the chart counts its days in it. */
const viewerTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const fetchVolume = () => domainEventsApi.volume(viewerTimeZone());

/** One chart day (`YYYY-MM-DD`, the viewer's calendar) in Deliveries — the date as both ends, exactly what picking that
 *  day in the form does. */
const dayLink = (day: string) =>
  domainEventsLinks.list({ queryId: domainEventsQueryIds.advancedFilter, params: { occurredRange: { from: day, to: day } } });

/** A day's bar segments — delivered is what's left of the count after the two kinds of trouble. */
const chartRows = (perDay: DeliveryVolume['perDay']) =>
  perDay.map((d) => ({
    day: d.day,
    delivered: d.count - d.noListenerCount - d.dispatchFailedCount,
    noListeners: d.noListenerCount,
    dispatchFailed: d.dispatchFailedCount,
  }));

/** The chart's loading-state data (AUI-032): the real chart over a flat placeholder — the 30 days are knowable now. */
function buildPlaceholderPerDay(): Array<{ day: string; delivered: number }> {
  const today = new Date();
  return Array.from({ length: VOLUME_DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (VOLUME_DAYS - 1 - i));
    return { day: format(d, 'yyyy-MM-dd'), delivered: 1 };
  });
}

/** Static per-tile copy — renders immediately; only the value (and the oldest window's caption) comes from the query. */
function volumeTiles(volume: DeliveryVolume | undefined) {
  const oldest = volume?.oldestOccurredAt;
  return [
    {
      key: 'oldest',
      label: 'Oldest delivery',
      value: volume && (oldest ? formatDateTime(oldest) : '—'),
      caption: oldest ? formatDateTime(oldest, { style: 'relative', relativeFallbackDays: Infinity }) : 'How far back the log goes',
    },
    {
      key: 'rows',
      label: 'Stored deliveries',
      value: volume && formatCount(volume.rowCount),
      caption: 'One per emit, this application',
    },
    {
      key: 'size',
      label: 'Table size',
      value: volume && (volume.tableSizeBytes == null ? '—' : formatBytes(volume.tableSizeBytes)),
      caption: 'On disk, every application sharing it',
    },
  ];
}

/** Reached via the "Volume & Retention" button on the Domain Events overview — not nav. Rate limiting's, for deliveries. */
export default function DomainEventRetentionPage() {
  const placeholderPerDay = useMemo(() => buildPlaceholderPerDay(), []);
  // Same key as the Overview's oldest-delivery footnote — one read serves both.
  const volume = useQuery({ queryKey: ['domain-events-volume'], queryFn: fetchVolume });
  const stats = volume.data;
  const tiles = volumeTiles(stats);
  const perDay = stats?.perDay ?? [];
  const rows = useMemo(() => chartRows(stats?.perDay ?? []), [stats]);
  const subtitle = stats
    ? `Past 30 days · ${formatDateTime(perDay[0].day)} – ${formatDateTime(perDay[perDay.length - 1].day)}, your time zone`
    : 'Past 30 days, your time zone';

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <BackLink href={domainEventsLinks.overview()}>Back to overview</BackLink>
          <PageTitle>Volume &amp; Retention</PageTitle>
          <PageSubtitle>The trend behind the deliveries, and the health of the log itself — how far back, how big.</PageSubtitle>
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
              {/* Not a query result: the module never prunes; the app calls pruneDeliveries() on its own schedule. */}
              <Card className="h-full">
                <CardPanel>
                  <KpiTile>
                    <KpiLabel>Retention</KpiLabel>
                    <div className="mt-auto pt-4">
                      <SimpleBadge variant="info">Set by the app</SimpleBadge>
                    </div>
                    <KpiCaption className="text-muted-foreground/60 mt-1 text-[0.6875rem]">
                      Pruned on the app&apos;s schedule — the oldest delivery shows it&apos;s running
                    </KpiCaption>
                  </KpiTile>
                </CardPanel>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardHeaderTitle>Deliveries per day</CardHeaderTitle>
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
                          <Bar dataKey="delivered" fill="var(--muted)" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </SkeletonState>
                    <NormalState if={!!stats}>
                      <ChartContainer config={chartConfig} className="h-56 w-full">
                        {/* Each day's column is a link (ChartBarLink on the top bar) — anywhere in it, not just its bar — to that day's deliveries. */}
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
                          <Bar dataKey="delivered" stackId="day" fill="var(--color-delivered)" />
                          <Bar dataKey="noListeners" stackId="day" fill="var(--color-noListeners)" />
                          <Bar
                            dataKey="dispatchFailed" stackId="day" fill="var(--color-dispatchFailed)" radius={[3, 3, 0, 0]}
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
