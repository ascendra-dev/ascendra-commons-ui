'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BackLink,
  Card,
  CardHeader,
  CardHeaderSubtitle,
  CardHeaderTitle,
  CardPanel,
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
import { auditLogLinks } from '@/ascendra-commons-ui/audit-logging.ui/links';
import { auditApi, type AuditRetentionStats } from '@/ascendra-commons-ui/audit-logging.ui/api';

const chartConfig: ChartConfig = {
  count: { label: 'Records', color: 'var(--chart-1)' },
};

/** `2026-07` → `Jul 2026`. Mid-month, so no time zone can shift it into a neighbouring month. */
const formatMonth = (month: string) => formatDateTime(`${month}-15`, { style: 'month' });

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

/** The chart's loading-state data (AUI-032): the real chart over a flat placeholder — six recent-looking months. */
const PLACEHOLDER_PER_MONTH = ['01', '02', '03', '04', '05', '06'].map((m) => ({ month: `2026-${m}`, count: 1 }));

/** Static per-tile copy — renders immediately; only the value (and, for one tile, the caption) comes from the query. */
function retentionTiles(stats: AuditRetentionStats | undefined) {
  return [
    {
      key: 'oldest',
      label: 'Oldest record',
      value: stats && (stats.oldestRecordAt ? formatDateTime(stats.oldestRecordAt) : '—'),
      caption:
        stats?.oldestRecordAt != null
          ? formatDateTime(stats.oldestRecordAt, { style: 'relative', relativeFallbackDays: Infinity })
          : 'How far back the log goes',
    },
    { key: 'rows', label: 'Records', value: stats && formatCount(stats.rowCount), caption: 'Rows in the audit store' },
    {
      key: 'size',
      label: 'Table size',
      value: stats && (stats.tableSizeBytes == null ? '—' : formatBytes(stats.tableSizeBytes)),
      caption:
        stats && stats.tableSizeBytes == null
          ? 'Whole-table figure — shown to platform admins'
          : 'On disk, indexes included',
    },
  ];
}

/** Reached via the "Retention & Volume" button on the Audit Log overview — not nav. */
export default function AuditRetentionPage() {
  const retention = useQuery({ queryKey: ['audit-retention'], queryFn: () => auditApi.retention() });
  const stats = retention.data;
  const tiles = retentionTiles(stats);

  return (
    <>
      <BackLink href={auditLogLinks.overview()} label="Audit log">Back to overview</BackLink>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Retention &amp; Volume</PageTitle>
          <PageSubtitle>Read-only health of the audit store itself — how far back it goes, how big it is.</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <DashboardContent>
        {/* Same shell-stays, content-swaps discipline as the Overview (AUI-021/022): one query, one error state. */}
        <WithError>
          <ErrorState if={retention.isError}>
            <Card>
              <CardPanel>
                <ErrorMessage
                  title="Failed to load retention"
                  error={retention.error}
                  onRetry={() => retention.refetch()}
                />
              </CardPanel>
            </Card>
          </ErrorState>
          <NormalState if={!retention.isError}>
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
              {/* Not a query result: audit-logging keeps every record and ships no deletion of any kind. */}
              <Card className="h-full">
                <CardPanel>
                  <KpiTile>
                    <KpiLabel>Retention</KpiLabel>
                    <div className="mt-auto pt-4">
                      <SimpleBadge variant="warning">Kept indefinitely</SimpleBadge>
                    </div>
                    <KpiCaption className="text-muted-foreground/60 mt-1 text-[0.6875rem]">
                      No retention policy — the table only grows
                    </KpiCaption>
                  </KpiTile>
                </CardPanel>
              </Card>
            </div>

            <Card collapseable="expanded" maximizable>
              <CardHeader>
                <CardHeaderTitle>Volume by month</CardHeaderTitle>
                <CardHeaderSubtitle>Records per month since the oldest, UTC</CardHeaderSubtitle>
              </CardHeader>
              <CardPanel>
                <div className="p-5">
                  <WithSkeleton>
                    <SkeletonState if={!stats}>
                      <ChartContainer config={chartConfig} className="h-56 w-full animate-pulse">
                        <BarChart data={PLACEHOLDER_PER_MONTH} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} strokeWidth={0.5} />
                          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={false} />
                          <YAxis tickLine={false} axisLine={false} tick={false} width={40} />
                          <Bar dataKey="count" fill="var(--muted)" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </SkeletonState>
                    <NormalState if={!!stats}>
                      <ChartContainer config={chartConfig} className="h-56 w-full">
                        <BarChart data={stats?.perMonth ?? []} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} strokeWidth={0.5} />
                          <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11 }}
                            tickFormatter={formatMonth}
                          />
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
                                labelFormatter={(month) => formatMonth(String(month))}
                                formatter={(v) => [formatCount(Number(v)), ' Records']}
                              />
                            }
                          />
                          <Bar dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]} />
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
