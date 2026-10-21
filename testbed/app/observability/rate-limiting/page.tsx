'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LuArrowUpRight, LuDatabase } from 'react-icons/lu';
import {
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
  SegmentedControl,
  SegmentedControlItem,
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
  WithError,
  WithSkeleton,
  type TriggerParams,
} from '@/ascendra-ui';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import { rateLimitApi } from '@/ascendra-commons-ui/rate-limiting.ui/api';
import {
  isOverflow,
  sourceLabel,
} from '@/ascendra-commons-ui/rate-limiting.ui/display';
import { rateLimitLinks } from '@/ascendra-commons-ui/rate-limiting.ui/links';
import { rateLimitQueryIds } from '@/ascendra-commons-ui/rate-limiting.ui/queries';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** The period picker — the tiles, the routes and the top sources all count over the chosen one. */
const PERIODS = [
  { value: 'hour', label: 'Past hour', ms: HOUR_MS },
  { value: 'day', label: 'Past 24 hours', ms: DAY_MS },
  { value: 'week', label: 'Past 7 days', ms: 7 * DAY_MS },
] as const;
type Period = (typeof PERIODS)[number];

const TOP_SOURCES = 10;
/** Top sources shows this many rows, then scrolls. */
const TOP_SOURCES_VISIBLE = 5;

/** The period's numbers, counted back from when each fetch runs. */
const fetchCatalog = (period: Period) =>
  rateLimitApi.catalog(new Date(Date.now() - period.ms));
const fetchTopSources = (period: Period) =>
  rateLimitApi.topIdentifiers({
    since: new Date(Date.now() - period.ms),
    limit: TOP_SOURCES,
  });

/**
 * The Rejections list, filtered by Advanced Filter to windows that started in the period, plus any other of its fields —
 * the range the number clicked was counted over, so the list adds up to that number. A period is rolling, so it passes
 * exact instants ending when the numbers were fetched (a query's `dataUpdatedAt` — never render time, which differs
 * between the server render and hydration).
 */
const periodLink = (asOf: number, period: Period, fields: TriggerParams = {}) =>
  rateLimitLinks.list({
    queryId: rateLimitQueryIds.advancedFilter,
    params: {
      ...fields,
      rejectedRange: { from: new Date(asOf - period.ms), to: new Date(asOf) },
    },
  });

/** The Rate Limiting module's landing page — rateLimitingNav's one entry points here. */
export default function RateLimitOverviewPage() {
  const router = useRouter();
  const [periodValue, setPeriodValue] = useState<Period['value']>('day');
  const period = PERIODS.find((p) => p.value === periodValue) ?? PERIODS[1];

  // Two independent queries, each keyed by the period, so a slow one never holds back the other.
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
  const share = (count: number) =>
    total > 0 ? Math.round((count / total) * 100) : 0;
  const busiest = routes[0];
  const asOf = catalog.dataUpdatedAt;
  const periodLower = period.label.toLowerCase();

  // Linked once the numbers are in. Routes affected doesn't link: it counts routes, and the list shows windows.
  const tiles = [
    {
      key: 'total',
      label: 'Rejections',
      value: formatCount(total),
      caption: period.label,
      href: catalog.data ? periodLink(asOf, period) : undefined,
    },
    {
      key: 'routes',
      label: 'Routes affected',
      value: formatCount(routes.length),
      caption: period.label,
    },
    {
      key: 'busiest',
      label: 'Busiest route',
      value: busiest ? busiest.route : '—',
      caption: busiest
        ? `${share(busiest.count)}% of rejections`
        : 'No rejections',
      href: busiest
        ? periodLink(asOf, period, { route: busiest.route })
        : undefined,
      mono: true,
    },
  ];

  const routeRows = routes.map((row) => ({
    ...row,
    share: share(row.count),
    href: periodLink(asOf, period, { route: row.route }),
  }));
  const sourceRows = (topSources.data ?? []).map((row) => ({
    ...row,
    label: sourceLabel(row.identifier),
    labelClass: isOverflow(row.identifier)
      ? 'text-muted-foreground text-sm'
      : 'font-mono text-xs',
    seen: formatDateTime(row.lastRejectedAt, { style: 'relative' }),
    href: periodLink(topSources.dataUpdatedAt, period, {
      identifier: row.identifier,
    }),
  }));
  const routesEmpty = !!catalog.data && routes.length === 0;
  const sourcesEmpty = !!topSources.data && sourceRows.length === 0;

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Rate Limiting</PageTitle>
          <PageSubtitle>
            Which routes are being hammered, and who by — every request a limit
            turned away.
          </PageSubtitle>
        </PageHeaderGroup>
        <PageHeaderAction className="flex w-fit gap-2">
          <Button
            variant="secondary"
            onClick={() => router.push(rateLimitLinks.retention())}
          >
            <LuDatabase />
            Volume &amp; Retention
          </Button>
          <Button onClick={() => router.push(rateLimitLinks.list())}>
            Go to Rejections
          </Button>
        </PageHeaderAction>
      </PageHeader>
      <DashboardContent>
        <SegmentedControl
          aria-label="Period"
          value={period.value}
          onValueChange={(v) => setPeriodValue(v as Period['value'])}
        >
          {PERIODS.map((p) => (
            <SegmentedControlItem key={p.value} value={p.value}>
              {p.label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>

        <WithError>
          <ErrorState if={catalog.isError}>
            <Card>
              <CardPanel>
                <ErrorMessage
                  title="Failed to load rejections"
                  error={catalog.error}
                  onRetry={() => catalog.refetch()}
                />
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
                              <KpiValue
                                className={
                                  tile.mono
                                    ? 'truncate font-mono text-xl'
                                    : undefined
                                }
                              >
                                {tile.value}
                              </KpiValue>
                            </NormalState>
                          </WithSkeleton>
                        </div>
                        <KpiCaption className="text-muted-foreground/60 mt-1 text-[0.6875rem]">
                          {tile.caption}
                        </KpiCaption>
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
            <TableWrapper>
              <Table horizontal>
                {/* The header row carries the list's title, not column labels — each row says what it is. */}
                <TableHeader>
                  <TableHeaderRow size="lg">
                    <TableHead colSpan={3}>
                      <CardHeaderTitle>Rejections by route</CardHeaderTitle>
                      <CardHeaderSubtitle>
                        {period.label} · most first
                      </CardHeaderSubtitle>
                    </TableHead>
                  </TableHeaderRow>
                </TableHeader>
                {routeRows.length > 0 && (
                  <TableBody>
                    {routeRows.map((row) => (
                      <TableRow
                        key={row.route}
                        className="cursor-pointer"
                        onClick={() => router.push(row.href)}
                      >
                        <TableCell>
                          <SimpleBadge>{row.route}</SimpleBadge>
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatCount(row.count)}
                        </TableCell>
                        <TableCell className="w-full">
                          <ShareBar share={row.share} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                )}
              </Table>
              <DataTableLoadingBody
                isLoading={catalog.isLoading}
                className="h-65"
              />
              <DataTableErrorBody
                isError={catalog.isError}
                error={catalog.error}
                onRetry={() => catalog.refetch()}
                className="h-65"
              />
              <DataTableEmptyBody
                isLoading={catalog.isLoading}
                isEmpty={routesEmpty}
                title={`No rejections in the ${periodLower}`}
                description="Nothing has hit a rate limit — try a longer period."
                className="h-65"
              />
            </TableWrapper>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <TableWrapper>
              <Table visibleRows={TOP_SOURCES_VISIBLE}>
                <TableHeader>
                  <TableHeaderRow size="lg">
                    <TableHead colSpan={2}>
                      <CardHeaderTitle>Top sources</CardHeaderTitle>
                      <CardHeaderSubtitle>
                        {period.label} · the {TOP_SOURCES} turned away most
                      </CardHeaderSubtitle>
                    </TableHead>
                  </TableHeaderRow>
                </TableHeader>
                {sourceRows.length > 0 && (
                  <TableBody>
                    {sourceRows.map((row) => (
                      <TableRow
                        key={row.identifier}
                        className="cursor-pointer"
                        onClick={() => router.push(row.href)}
                      >
                        <TableCell>
                          <div className={row.labelClass}>{row.label}</div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1">
                            {row.routes.map((route) => (
                              <SimpleBadge key={route}>{route}</SimpleBadge>
                            ))}
                            <span className="text-muted-foreground text-xs">
                              · seen {row.seen}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right align-top font-mono tabular-nums">
                          {formatCount(row.count)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                )}
              </Table>
              <DataTableLoadingBody
                isLoading={topSources.isLoading}
                className="h-65"
              />
              <DataTableErrorBody
                isError={topSources.isError}
                error={topSources.error}
                onRetry={() => topSources.refetch()}
                className="h-65"
              />
              <DataTableEmptyBody
                isLoading={topSources.isLoading}
                isEmpty={sourcesEmpty}
                title={`No rejections in the ${periodLower}`}
                description="No source has hit a rate limit — try a longer period."
                className="h-65"
              />
            </TableWrapper>
          </div>
        </div>
      </DashboardContent>
    </>
  );
}

/** A route's share of the period's rejections — the inline bar and percentage of the showcase's Sales Rep Performance. */
function ShareBar({ share }: { share: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-orange-400 transition-all"
          style={{ width: `${share}%` }}
        />
      </div>
      <span className="w-12 text-right text-xs font-semibold tabular-nums text-orange-600 dark:text-orange-400">
        {share}%
      </span>
    </div>
  );
}
