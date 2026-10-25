'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  BackLink,
  Card,
  CardFooter,
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
  SimpleAlert,
  Skeleton,
  SkeletonState,
  WithError,
  WithSkeleton,
} from '@/ascendra-ui';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/ascendra-ui/shadcn';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  formatBytes,
  notificationApi,
  notificationLinks,
  notificationQueryIds,
  type DeliveryVolume,
} from '@/ascendra-commons-ui/notification.ui';
import { useNotificationScope } from '../_scope';

/**
 * What this app's retention keeps — its own job's settings (ascendra-commons-sandbox's `notification-retention`, run
 * daily), so a vertical writes its own here.
 */
const RETENTION_NOTE = 'Kept: the message 30 days, rows 90 days, inbox items 90 days, dedupe keys until they expire — the daily notification-retention job.';

const chartConfig: ChartConfig = {
  ok: { label: 'Not failed', color: 'var(--chart-1)' },
  failed: { label: 'Failed or bounced', color: 'var(--color-red-500)' },
};

const viewerTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** One chart day in Deliveries — the date as both ends, exactly what picking that day in the form does. */
const dayLink = (day: string) =>
  notificationLinks.deliveries({ queryId: notificationQueryIds.advancedFilter, params: { attemptedRange: { from: day, to: day }, test: 'both' } });

function volumeTiles(v: DeliveryVolume | undefined) {
  return [
    {
      key: 'rows',
      label: 'Rows',
      value: v && formatCount(v.rowCount),
      caption: v?.oldestAttemptedAt ? `oldest ${formatDateTime(v.oldestAttemptedAt)}` : 'every delivery, test sends too',
    },
    {
      key: 'content',
      label: 'Holding the message',
      value: v && formatCount(v.contentRowCount),
      caption: v?.oldestContentAt ? `oldest ${formatDateTime(v.oldestContentAt)} — cleared sooner than the row` : 'the rendered text or a failed send’s variables',
    },
    {
      key: 'size',
      label: 'Table size',
      value: v && (v.tableSizeBytes == null ? '—' : formatBytes(v.tableSizeBytes)),
      caption: 'on disk, every application sharing it',
    },
  ];
}

/** How big the delivery log is, how far back it goes, and how much message text it still holds. Platform admins. */
export default function NotificationRetentionPage() {
  const { platform } = useNotificationScope();
  const volume = useQuery({ queryKey: ['notification-volume'], queryFn: () => notificationApi.volume(viewerTimeZone()), enabled: platform });
  const v = volume.data;
  const tiles = volumeTiles(v);
  const rows = useMemo(() => (v?.perDay ?? []).map((d) => ({ day: d.day, ok: d.deliveries - d.failed, failed: d.failed})), [v]);
  const first = v?.perDay[0]?.day;
  const last = v?.perDay[v.perDay.length - 1]?.day;

  return (
    <>
      <BackLink href={notificationLinks.overview()} label="Notifications">Back to overview</BackLink>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Volume &amp; Retention</PageTitle>
          <PageSubtitle>How big the delivery log is, how far back it goes — and how much message text it still holds.</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <DashboardContent>
        {!platform ? (
          <SimpleAlert variant="primary">The log holds every tenant&apos;s rows — its size is for platform admins.</SimpleAlert>
        ) : (
          <WithError>
            <ErrorState if={volume.isError}>
              <Card>
                <CardPanel>
                  <ErrorMessage title="Failed to load volume" error={volume.error} onRetry={() => volume.refetch()} />
                </CardPanel>
              </Card>
            </ErrorState>
            <NormalState if={!volume.isError}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {tiles.map((tile) => (
                  <Card key={tile.key} className="h-full">
                    <CardPanel>
                      <KpiTile>
                        <KpiLabel>{tile.label}</KpiLabel>
                        <div className="mt-auto pt-4">
                          <WithSkeleton>
                            <SkeletonState if={!v}>
                              <Skeleton className="h-8 w-24" />
                            </SkeletonState>
                            <NormalState if={!!v}>
                              <KpiValue>{tile.value}</KpiValue>
                            </NormalState>
                          </WithSkeleton>
                        </div>
                        <KpiCaption className="text-muted-foreground/60 mt-1 text-[0.6875rem]">{tile.caption}</KpiCaption>
                      </KpiTile>
                    </CardPanel>
                  </Card>
                ))}
              </div>

              <Card collapseable="expanded" maximizable>
                <CardHeader>
                  <CardHeaderTitle>Rows per day</CardHeaderTitle>
                  <CardHeaderSubtitle>
                    Past 30 days{first && last ? ` · ${formatDateTime(first)} – ${formatDateTime(last)}` : ''}, your time zone — failed on top
                  </CardHeaderSubtitle>
                </CardHeader>
                <CardPanel>
                  <div className="p-5">
                    <WithSkeleton>
                      <SkeletonState if={!v}>
                        <Skeleton className="h-56 w-full" />
                      </SkeletonState>
                      <NormalState if={!!v}>
                        <ChartContainer config={chartConfig} className="h-56 w-full">
                          <BarChart data={rows} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} strokeWidth={0.5} />
                            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={4} tickFormatter={(d: string) => formatDateTime(d, { style: 'short' })} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={40} allowDecimals={false} tickFormatter={(n: number) => formatCount(n)} />
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  labelFormatter={(day) => formatDateTime(String(day))}
                                  formatter={(value, name) => [formatCount(Number(value)), ` ${chartConfig[String(name)]?.label ?? name}`]}
                                />
                              }
                            />
                            <Bar dataKey="ok" stackId="day" fill="var(--color-ok)" />
                            <Bar
                              dataKey="failed"
                              stackId="day"
                              fill="var(--color-failed)"
                              radius={[3, 3, 0, 0]}
                              shape={<ChartBarLink href={(row: { day: string }) => dayLink(row.day)} />}
                            />
                          </BarChart>
                        </ChartContainer>
                      </NormalState>
                    </WithSkeleton>
                  </div>
                </CardPanel>
                <CardFooter className="text-muted-foreground text-xs">{RETENTION_NOTE}</CardFooter>
              </Card>
            </NormalState>
          </WithError>
        )}
      </DashboardContent>
    </>
  );
}
