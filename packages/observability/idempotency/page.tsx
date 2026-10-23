'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { LuArrowUpRight, LuHistory } from 'react-icons/lu';
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
  IdText,
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
import { idempotencyApi, type IdempotencyClaim } from '@/ascendra-commons-ui/idempotency-key.ui/api';
import { ageLabel, routeLabel } from '@/ascendra-commons-ui/idempotency-key.ui/display';
import { idempotencyLinks } from '@/ascendra-commons-ui/idempotency-key.ui/links';
import { idempotencyQueryIds } from '@/ascendra-commons-ui/idempotency-key.ui/queries';
import { ClaimSheet } from './claims/_claim-sheet';

const HOUR_MS = 60 * 60 * 1000;

/** The period picker — tiles and the per-endpoint list count over it. Claims are kept 24 hours, so no longer period. */
const PERIODS = [
  { value: 'hour', label: 'Past hour', ms: HOUR_MS },
  { value: 'day', label: 'Past 24 hours', ms: 24 * HOUR_MS },
] as const;
type Period = (typeof PERIODS)[number];

/** The period's numbers, counted back from when each fetch runs. */
const fetchHealth = (period: Period) => idempotencyApi.health(new Date(Date.now() - period.ms));
const fetchRoutes = (period: Period) => idempotencyApi.routes(new Date(Date.now() - period.ms));

/** In progress shows this many rows, then scrolls; it loads a few more than that. */
const IN_PROGRESS_VISIBLE = 5;
const IN_PROGRESS_LIMIT = 20;
const ENDPOINTS_VISIBLE = 5;

/**
 * An in-progress claim older than this is probably a crashed or hung handler. The API doesn't report the app's
 * `staleAfterSeconds`, so this is a rough line, not the real window.
 */
const LONG_RUNNING_MS = 60_000;

/**
 * The Claims list, filtered by Advanced Filter to claims made in the period, plus any other of its fields — the range
 * the number clicked was counted over, so the list adds up to that number. Exact instants ending when the numbers
 * were fetched (`dataUpdatedAt`), never render time.
 */
const periodLink = (asOf: number, period: Period, fields: TriggerParams = {}) =>
  idempotencyLinks.list({
    queryId: idempotencyQueryIds.advancedFilter,
    params: { ...fields, createdRange: { from: new Date(asOf - period.ms), to: new Date(asOf) } },
  });

type Tone = 'warn' | 'alert' | undefined;

/** The Idempotency module's landing page — idempotencyNav's one entry points here. */
export default function IdempotencyOverviewPage() {
  const [periodValue, setPeriodValue] = useState<Period['value']>('day');
  const [selected, setSelected] = useState<IdempotencyClaim | null>(null);
  const period = PERIODS.find((p) => p.value === periodValue) ?? PERIODS[1];

  // Independent queries, so a slow one never holds back the others. In progress isn't period-bound.
  const health = useQuery({
    queryKey: ['idempotency-health', period.value],
    queryFn: () => fetchHealth(period),
  });
  const routes = useQuery({
    queryKey: ['idempotency-routes', period.value],
    queryFn: () => fetchRoutes(period),
  });
  const inProgress = useQuery({
    queryKey: ['idempotency-in-progress'],
    queryFn: () => idempotencyApi.inProgress(IN_PROGRESS_LIMIT),
  });

  const h = health.data;
  const periodLower = period.label.toLowerCase();

  // Only Claims links: the API can't filter the list to "has duplicates" or "was reclaimed", so those tiles would land
  // on a list that doesn't add up to them.
  const tiles: { key: string; label: string; value: number; caption: string; tone?: Tone; href?: string }[] = h
    ? [
        {
          key: 'claims',
          label: 'Claims',
          value: h.totalCount,
          caption: `${formatCount(h.completedCount)} completed · ${formatCount(h.pendingCount)} in progress`,
          href: periodLink(health.dataUpdatedAt, period),
        },
        {
          key: 'duplicates',
          label: 'Duplicates absorbed',
          value: h.replayTotal + h.conflictTotal,
          caption: `${formatCount(h.replayTotal)} replayed · ${formatCount(h.conflictTotal)} turned away (409)`,
        },
        {
          key: 'reclaimed',
          label: 'Reclaimed',
          value: h.reclaimedCount,
          caption: 'taken over as stale — possibly ran twice',
          tone: h.reclaimedCount > 0 ? 'warn' : undefined,
        },
        {
          key: 'ran-twice',
          label: 'Ran twice',
          value: h.lateCompleteNoOpTotal,
          caption: 'confirmed — a result was discarded',
          tone: h.lateCompleteNoOpTotal > 0 ? 'alert' : undefined,
        },
      ]
    : ['Claims', 'Duplicates absorbed', 'Reclaimed', 'Ran twice'].map((label) => ({ key: label, label, value: 0, caption: '' }));

  const endpoints = routes.data ?? [];
  const maxDuplicates = Math.max(1, ...endpoints.map((r) => r.replays + r.conflicts));
  const endpointRows = endpoints.map((row) => ({
    ...row,
    duplicates: row.replays + row.conflicts,
    share: Math.round(((row.replays + row.conflicts) / maxDuplicates) * 100),
    // A claim made before routes were recorded can't be filtered for — it doesn't link.
    href: row.route ? periodLink(routes.dataUpdatedAt, period, { route: row.route }) : undefined,
  }));
  const pending = inProgress.data?.data ?? [];

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Idempotency</PageTitle>
          <PageSubtitle>The repeats it absorbed, and whether anything ran twice.</PageSubtitle>
        </PageHeaderGroup>
        <PageHeaderAction className="flex w-fit gap-2">
          <Button asChild>
            <Link href={idempotencyLinks.list()}>Go to Claims</Link>
          </Button>
        </PageHeaderAction>
      </PageHeader>
      <DashboardContent>
        {/* The period picker, and how far back the store goes — page-wide, so it sits beside the picker. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentControl segments={PERIODS} value={period.value} onValueChange={(v) => setPeriodValue(v as Period['value'])} />
          {h?.oldestRetainedAt && (
            <WithTooltip tooltip="How far back the store goes — the app deletes claims after 24 hours">
              <SimpleBadge>
                <LuHistory />
                Oldest claim kept · {formatDateTime(h.oldestRetainedAt, { time: true })}
              </SimpleBadge>
            </WithTooltip>
          )}
        </div>

        <WithError>
          <ErrorState if={health.isError}>
            <Card>
              <CardPanel>
                <ErrorMessage title="Failed to load claims" error={health.error} onRetry={() => health.refetch()} />
              </CardPanel>
            </Card>
          </ErrorState>
          <NormalState if={!health.isError}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                            <SkeletonState if={!h}>
                              <Skeleton className="h-8 w-24" />
                            </SkeletonState>
                            <NormalState if={!!h}>
                              <KpiValue
                                className={cn(
                                  tile.tone === 'warn' && 'text-orange-600 dark:text-orange-400',
                                  tile.tone === 'alert' && 'text-negative',
                                )}
                              >
                                {formatCount(tile.value)}
                              </KpiValue>
                            </NormalState>
                          </WithSkeleton>
                        </div>
                        <KpiCaption className="text-muted-foreground/60 mt-1 text-[0.6875rem]">
                          {h ? tile.caption : period.label}
                        </KpiCaption>
                      </KpiTile>
                    </CardPanel>
                  </Card>
                );
                return tile.href ? (
                  <Link
                    key={tile.key}
                    href={tile.href}
                    aria-label={`${tile.label} — open in Claims`}
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
              <Table visibleRows={ENDPOINTS_VISIBLE}>
                {/* The header row carries the list's title, not column labels — each row says what it is. */}
                <TableHeader>
                  <TableHeaderRow size="lg">
                    <TableHead colSpan={3}>
                      <CardHeaderTitle>Duplicates by endpoint</CardHeaderTitle>
                      <CardHeaderSubtitle>{period.label} · replays and 409s, most first</CardHeaderSubtitle>
                    </TableHead>
                  </TableHeaderRow>
                </TableHeader>
                {endpointRows.length > 0 && (
                  <TableBody>
                    {endpointRows.map((row) => (
                      <TableRow key={row.route ?? '(none)'}>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {row.href ? (
                              <TableRowLink href={row.href}>
                                <SimpleBadge>{routeLabel(row.route)}</SimpleBadge>
                              </TableRowLink>
                            ) : (
                              <SimpleBadge>{routeLabel(row.route)}</SimpleBadge>
                            )}
                            {row.lateCompleteNoOps > 0 && <SimpleBadge variant="red">{formatCount(row.lateCompleteNoOps)} ran twice</SimpleBadge>}
                          </div>
                          <div className="text-muted-foreground mt-1 text-xs">{formatCount(row.claims)} claims</div>
                        </TableCell>
                        <TableCell className="text-right align-top font-mono tabular-nums">{formatCount(row.duplicates)}</TableCell>
                        <TableCell className="w-full">
                          <div className="bg-muted h-2 overflow-hidden rounded-full">
                            <div className="h-full rounded-full bg-sky-500/70 transition-all" style={{ width: `${row.share}%` }} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                )}
              </Table>
              <DataTableLoadingBody isLoading={routes.isLoading} className="h-65" />
              <DataTableErrorBody isError={routes.isError} error={routes.error} onRetry={() => routes.refetch()} className="h-65" />
              <DataTableEmptyBody
                isLoading={routes.isLoading}
                isEmpty={!!routes.data && endpointRows.length === 0}
                title={`No claims in the ${periodLower}`}
                description="No request carried an Idempotency-Key — try a longer period."
                className="h-65"
              />
            </TableWrapper>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <TableWrapper>
              <Table visibleRows={IN_PROGRESS_VISIBLE}>
                <TableHeader>
                  <TableHeaderRow size="lg">
                    <TableHead colSpan={2}>
                      <CardHeaderTitle>In progress</CardHeaderTitle>
                      <CardHeaderSubtitle>Requests that haven&apos;t finished · newest first</CardHeaderSubtitle>
                    </TableHead>
                  </TableHeaderRow>
                </TableHeader>
                {pending.length > 0 && (
                  <TableBody>
                    {pending.map((claim) => {
                      const long = inProgress.dataUpdatedAt - Date.parse(claim.createdAt) > LONG_RUNNING_MS;
                      return (
                        <TableRow key={`${claim.scope}/${claim.key}`} className="cursor-pointer" onClick={() => setSelected(claim)}>
                          <TableCell>
                            <IdText value={claim.key} size="lg" copyable={false} showTooltip={false} />
                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                              <SimpleBadge>{routeLabel(claim.route)}</SimpleBadge>
                              <span className="text-muted-foreground text-xs">
                                · {claim.scope}
                                {claim.conflictCount > 0 && ` · ${formatCount(claim.conflictCount)} turned away (409)`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right align-top whitespace-nowrap">
                            {long ? (
                              <SimpleBadge variant="orange">{ageLabel(claim.createdAt, inProgress.dataUpdatedAt)}</SimpleBadge>
                            ) : (
                              <span className="text-muted-foreground text-xs">{ageLabel(claim.createdAt, inProgress.dataUpdatedAt)}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                )}
              </Table>
              <DataTableLoadingBody isLoading={inProgress.isLoading} className="h-65" />
              <DataTableErrorBody isError={inProgress.isError} error={inProgress.error} onRetry={() => inProgress.refetch()} className="h-65" />
              <DataTableEmptyBody
                isLoading={inProgress.isLoading}
                isEmpty={!!inProgress.data && pending.length === 0}
                title="Nothing in progress"
                description="Every claimed request has finished."
                className="h-65"
              />
            </TableWrapper>
          </div>
        </div>
      </DashboardContent>
      {selected && <ClaimSheet claim={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
