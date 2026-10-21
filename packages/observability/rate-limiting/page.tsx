'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LuArrowUpRight } from 'react-icons/lu';
import {
  Button,
  Card,
  CardHeader,
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
  SimpleBadge,
  Skeleton,
  SkeletonState,
  TabList,
  TabTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
  TableWrapper,
  Tabs,
  WithError,
  WithSkeleton,
  useTabs,
  type TriggerParams,
} from '@/ascendra-ui';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/ascendra-ui/shadcn';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import { rateLimitApi, type RejectionVolume } from '@/ascendra-commons-ui/rate-limiting.ui/api';
import { isOverflow, sourceLabel } from '@/ascendra-commons-ui/rate-limiting.ui/display';
import { rateLimitLinks } from '@/ascendra-commons-ui/rate-limiting.ui/links';
import { rateLimitQueryIds } from '@/ascendra-commons-ui/rate-limiting.ui/queries';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** The period picker — the routes, the top sources and the tiles all count over the chosen one. */
const PERIODS = [
  { value: 'hour', label: 'Past hour', ms: HOUR_MS },
  { value: 'day', label: 'Past 24 hours', ms: DAY_MS },
  { value: 'week', label: 'Past 7 days', ms: 7 * DAY_MS },
] as const;
type Period = (typeof PERIODS)[number];

const TOP_SOURCES = 10;
const VOLUME_DAYS = 30;

const chartConfig: ChartConfig = { count: { label: 'Rejections', color: 'var(--chart-1)' } };
const formatDayTick = (day: string) => formatDateTime(day, { style: 'short' });

/** The period's numbers, counted back from when each fetch runs. */
const fetchCatalog = (period: Period) => rateLimitApi.catalog(new Date(Date.now() - period.ms));
const fetchTopSources = (period: Period) =>
  rateLimitApi.topIdentifiers({ since: new Date(Date.now() - period.ms), limit: TOP_SOURCES });

/** The viewer's IANA time zone — the volume chart counts its days in it. */
const viewerTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * The Rejections list, filtered by Advanced Filter to windows that started in `from`–`to`, plus any other of its
 * fields — the range the number clicked was counted over, so the list adds up to that number. A period is rolling,
 * so it passes exact instants ending when the numbers were fetched (a query's `dataUpdatedAt` — never render time,
 * which differs between the server render and hydration). A chart bar is a calendar day in the viewer's zone, so it
 * passes the date itself as both ends, exactly what picking that day in the form does.
 */
function rejectionsLink(from: Date | string, to: Date | string, fields: TriggerParams = {}) {
  return rateLimitLinks.list({ queryId: rateLimitQueryIds.advancedFilter, params: { ...fields, rejectedRange: { from, to } } });
}
const periodLink = (asOf: number, period: Period, fields?: TriggerParams) =>
  rejectionsLink(new Date(asOf - period.ms), new Date(asOf), fields);

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

/** The Rate Limiting module's landing page — rateLimitingNav's one entry points here. */
export default function RateLimitOverviewPage() {
  const router = useRouter();
  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Rate Limiting</PageTitle>
          <PageSubtitle>Which routes are being hammered, and who by — every request a limit turned away.</PageSubtitle>
        </PageHeaderGroup>
        <PageHeaderAction className="flex w-fit gap-2">
          <Button onClick={() => router.push(rateLimitLinks.list())}>Go to Rejections</Button>
        </PageHeaderAction>
      </PageHeader>
      <DashboardContent>
        <Tabs defaultValue="day">
          <TabList>
            {PERIODS.map((period) => (
              <TabTrigger key={period.value} value={period.value}>
                {period.label}
              </TabTrigger>
            ))}
          </TabList>
          <PeriodSections />
        </Tabs>
        <VolumeSection />
      </DashboardContent>
    </>
  );
}

/**
 * The tiles, routes and top sources for the chosen period — two independent queries (catalog, top identifiers), so a
 * slow one never holds back the other. Both are keyed by the period; each fetch counts back from its own "now".
 */
function PeriodSections() {
  const router = useRouter();
  const { active } = useTabs();
  const period = PERIODS.find((p) => p.value === active) ?? PERIODS[1];

  const catalog = useQuery({
    queryKey: ['rate-limit-catalog', period.value],
    queryFn: () => fetchCatalog(period),
  });
  const topSources = useQuery({
    queryKey: ['rate-limit-top-sources', period.value],
    queryFn: () => fetchTopSources(period),
  });

  const routes = catalog.data ?? [];
  const total = routes.reduce((sum, r) => sum + r.count, 0);
  const busiest = routes[0];
  const share = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0);
  const asOf = catalog.dataUpdatedAt;
  const periodLower = period.label.toLowerCase();

  // Linked once the numbers are in — until then there's nothing to open. Routes affected doesn't link: it counts
  // routes, and the list shows windows.
  const tiles = [
    {
      key: 'total',
      label: 'Rejections',
      value: formatCount(total),
      caption: period.label,
      href: catalog.data ? periodLink(asOf, period) : undefined,
    },
    { key: 'routes', label: 'Routes affected', value: formatCount(routes.length), caption: period.label },
    {
      key: 'busiest',
      label: 'Busiest route',
      value: busiest ? busiest.route : '—',
      caption: busiest ? `${share(busiest.count)}% of rejections` : 'No rejections',
      href: busiest ? periodLink(asOf, period, { route: busiest.route }) : undefined,
      mono: true,
    },
  ];

  return (
    <>
      <WithError>
        <ErrorState if={catalog.isError}>
          <Card>
            <CardPanel>
              <ErrorMessage title="Failed to load rejections" error={catalog.error} onRetry={() => catalog.refetch()} />
            </CardPanel>
          </Card>
        </ErrorState>
        <NormalState if={!catalog.isError}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {tiles.map((tile) => {
              const card = (
                <Card className="h-full">
                  <CardPanel>
                    <KpiTile>
                      <KpiLabel className="flex items-center justify-between gap-2">
                        {tile.label}
                        {tile.href && (
                          <LuArrowUpRight className="text-muted-foreground group-hover:text-foreground size-3.5 shrink-0 transition-colors" />
                        )}
                      </KpiLabel>
                      <div className="mt-auto pt-4">
                        <WithSkeleton>
                          <SkeletonState if={!catalog.data}>
                            <Skeleton className="h-8 w-24" />
                          </SkeletonState>
                          <NormalState if={!!catalog.data}>
                            <KpiValue className={tile.mono ? 'truncate font-mono text-xl' : undefined}>{tile.value}</KpiValue>
                          </NormalState>
                        </WithSkeleton>
                      </div>
                      <KpiCaption className="text-muted-foreground/60 mt-1 text-[0.6875rem]">{tile.caption}</KpiCaption>
                    </KpiTile>
                  </CardPanel>
                </Card>
              );
              return tile.href ? (
                <Link
                  key={tile.key}
                  href={tile.href}
                  aria-label={`${tile.label} — open in Rejections`}
                  className="group focus-visible:outline-primary block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {card}
                </Link>
              ) : (
                <div key={tile.key} className="h-full">
                  {card}
                </div>
              );
            })}
          </div>
        </NormalState>
      </WithError>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-6">
          <CardHeader>
            <CardHeaderTitle>Rejections by route</CardHeaderTitle>
            <CardHeaderSubtitle>{period.label} · most first</CardHeaderSubtitle>
          </CardHeader>
          <TableWrapper>
            <Table scrollable horizontal vertical height={300}>
              <TableHeader>
                <TableHeaderRow>
                  <TableHead>Route</TableHead>
                  <TableHead className="text-right">Rejections</TableHead>
                  <TableHead>Share</TableHead>
                </TableHeaderRow>
              </TableHeader>
              {routes.length > 0 && (
                <TableBody>
                  {routes.map((row) => (
                    <TableRow
                      key={row.route}
                      className="cursor-pointer"
                      onClick={() => router.push(periodLink(asOf, period, { route: row.route }))}
                    >
                      <TableCell>
                        <SimpleBadge>{row.route}</SimpleBadge>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatCount(row.count)}</TableCell>
                      <TableCell className="w-40">
                        <div className="flex items-center gap-2">
                          <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                            <div className="h-full rounded-full bg-rose-500/70" style={{ width: `${share(row.count)}%` }} />
                          </div>
                          <span className="text-muted-foreground w-9 text-right text-xs tabular-nums">{share(row.count)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
            <DataTableLoadingBody isLoading={catalog.isLoading} className="h-65" />
            <DataTableErrorBody
              isError={catalog.isError}
              error={catalog.error}
              onRetry={() => catalog.refetch()}
              className="h-65"
            />
            <DataTableEmptyBody
              isLoading={catalog.isLoading}
              isEmpty={!!catalog.data && routes.length === 0}
              title={`No rejections in the ${periodLower}`}
              description="Nothing has hit a rate limit — try a longer period."
              className="h-65"
            />
          </TableWrapper>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <CardHeader>
            <CardHeaderTitle>Top sources</CardHeaderTitle>
            <CardHeaderSubtitle>{period.label} · the {TOP_SOURCES} turned away most</CardHeaderSubtitle>
          </CardHeader>
          <TableWrapper>
            <Table scrollable horizontal vertical height={300}>
              <TableHeader>
                <TableHeaderRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Rejections</TableHead>
                  <TableHead>Routes</TableHead>
                </TableHeaderRow>
              </TableHeader>
              {topSources.data && topSources.data.length > 0 && (
                <TableBody>
                  {topSources.data.map((row) => (
                    <TableRow
                      key={row.identifier}
                      className="cursor-pointer"
                      onClick={() => router.push(periodLink(topSources.dataUpdatedAt, period, { identifier: row.identifier }))}
                    >
                      {/* When it was last turned away, beneath — a third column doesn't fit at half width. */}
                      <TableCell className="whitespace-nowrap">
                        <div className={isOverflow(row.identifier) ? 'text-muted-foreground text-sm' : 'font-mono text-xs'}>
                          {sourceLabel(row.identifier)}
                        </div>
                        <div className="text-muted-foreground mt-0.5 text-xs">
                          seen {formatDateTime(row.lastRejectedAt, { style: 'relative' })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatCount(row.count)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.routes.map((route) => (
                            <SimpleBadge key={route}>{route}</SimpleBadge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
            <DataTableLoadingBody isLoading={topSources.isLoading} className="h-65" />
            <DataTableErrorBody
              isError={topSources.isError}
              error={topSources.error}
              onRetry={() => topSources.refetch()}
              className="h-65"
            />
            <DataTableEmptyBody
              isLoading={topSources.isLoading}
              isEmpty={!!topSources.data && topSources.data.length === 0}
              title={`No rejections in the ${periodLower}`}
              description="No source has hit a rate limit — try a longer period."
              className="h-65"
            />
          </TableWrapper>
        </div>
      </div>
    </>
  );
}

/**
 * Volume & retention — not tied to the period picker: always the past 30 calendar days in the viewer's zone, plus
 * what's stored. Retention is the app's (it prunes with its own cutoff); the oldest window shows the prune is running.
 */
function VolumeSection() {
  const router = useRouter();
  const placeholderPerDay = useMemo(() => buildPlaceholderPerDay(), []);
  const volume = useQuery({ queryKey: ['rate-limit-volume'], queryFn: () => rateLimitApi.volume(viewerTimeZone()) });
  const perDay = volume.data?.perDay ?? [];

  const subtitle = volume.data
    ? `Past 30 days · ${formatDateTime(perDay[0].day)} – ${formatDateTime(perDay[perDay.length - 1].day)}`
    : 'Past 30 days';

  const oldest = volume.data?.oldestWindowAt;
  const tableSize = volume.data?.tableSizeBytes;
  const tiles = [
    {
      key: 'oldest',
      label: 'Oldest window',
      value: oldest ? formatDateTime(oldest) : '—',
      caption: oldest ? formatDateTime(oldest, { style: 'relative', relativeFallbackDays: 400 }) : 'Nothing stored yet',
    },
    { key: 'rows', label: 'Stored windows', value: formatCount(volume.data?.rowCount ?? 0), caption: 'One per source, route and minute' },
    {
      key: 'size',
      label: 'Table size',
      value: tableSize == null ? '—' : formatBytes(tableSize),
      caption: 'Every application sharing the table',
    },
  ];

  return (
    <WithError>
      <ErrorState if={volume.isError}>
        <Card>
          <CardPanel>
            <ErrorMessage title="Failed to load volume" error={volume.error} onRetry={() => volume.refetch()} />
          </CardPanel>
        </Card>
      </ErrorState>
      <NormalState if={!volume.isError}>
        <Card>
          <CardHeader>
            <CardHeaderTitle>Volume &amp; retention</CardHeaderTitle>
            <CardHeaderSubtitle>{subtitle}</CardHeaderSubtitle>
          </CardHeader>
          <CardPanel>
            <div className="p-5">
              <WithSkeleton>
                <SkeletonState if={!volume.data}>
                  <ChartContainer config={chartConfig} className="h-48 w-full animate-pulse">
                    <BarChart data={placeholderPerDay} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} strokeWidth={0.5} />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={4} tickFormatter={formatDayTick} />
                      <YAxis tickLine={false} axisLine={false} tick={false} width={40} />
                      <Bar dataKey="count" fill="var(--muted)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </SkeletonState>
                <NormalState if={!!volume.data}>
                  <ChartContainer config={chartConfig} className="h-48 w-full cursor-pointer">
                    {/* A click anywhere in a day's column (not just its bar) opens that day's rejections. */}
                    <BarChart
                      data={perDay}
                      margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
                      onClick={(state) => {
                        if (state.activeLabel != null) {
                          const day = String(state.activeLabel);
                          router.push(rejectionsLink(day, day));
                        }
                      }}
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
                      <ChartTooltip content={<ChartTooltipContent formatter={(v) => [formatCount(Number(v)), ' Rejections']} />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </NormalState>
              </WithSkeleton>
            </div>
            <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-3">
              {tiles.map((tile) => (
                <KpiTile key={tile.key} className="bg-background rounded-lg p-4">
                  <KpiLabel>{tile.label}</KpiLabel>
                  <div className="pt-2">
                    <WithSkeleton>
                      <SkeletonState if={!volume.data}>
                        <Skeleton className="h-7 w-24" />
                      </SkeletonState>
                      <NormalState if={!!volume.data}>
                        <KpiValue className="text-xl">{tile.value}</KpiValue>
                      </NormalState>
                    </WithSkeleton>
                  </div>
                  <KpiCaption className="text-muted-foreground/60 mt-1 text-[0.6875rem]">{tile.caption}</KpiCaption>
                </KpiTile>
              ))}
            </div>
          </CardPanel>
        </Card>
      </NormalState>
    </WithError>
  );
}
