'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LuArrowUpRight, LuDatabase, LuHistory, LuNetwork } from 'react-icons/lu';
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
  TableWrapper,
  WithError,
  WithSkeleton,
  WithTooltip,
  type TriggerParams,
} from '@/ascendra-ui';
import { cn } from '@/ascendra-ui/shadcn';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import { domainEventsApi } from '@/ascendra-commons-ui/domain-events.ui/api';
import { listenersLabel } from '@/ascendra-commons-ui/domain-events.ui/display';
import { domainEventsLinks } from '@/ascendra-commons-ui/domain-events.ui/links';
import { domainEventsQueryIds } from '@/ascendra-commons-ui/domain-events.ui/queries';
import { wiringRows, type WiringRow } from '@/ascendra-commons-ui/domain-events.ui/wiring';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** The period picker — the tiles, the busiest events and the wiring problems (but never-fires) count over it. */
const PERIODS = [
  { value: 'day', label: 'Past 24 hours', ms: DAY_MS },
  { value: 'week', label: 'Past 7 days', ms: 7 * DAY_MS },
  { value: 'month', label: 'Past 30 days', ms: 30 * DAY_MS },
] as const;
type Period = (typeof PERIODS)[number];

/** Busiest events shows this many rows, then scrolls. */
const EVENTS_VISIBLE = 5;

/** The period's numbers, counted back from when each fetch runs. */
const since = (period: Period) => new Date(Date.now() - period.ms);

/**
 * Deliveries, filtered by Advanced Filter to events that occurred in the period, plus any other of its fields — the
 * range the number clicked was counted over, so the list adds up to that number. Exact instants ending when the numbers
 * were fetched (`dataUpdatedAt`), never render time.
 */
const periodLink = (asOf: number, period: Period, fields: TriggerParams = {}) =>
  domainEventsLinks.list({
    queryId: domainEventsQueryIds.advancedFilter,
    params: { ...fields, occurredRange: { from: new Date(asOf - period.ms), to: new Date(asOf) } },
  });

type Tone = 'warn' | 'alert' | undefined;

/** The Domain Events module's landing page — domainEventsNav's one entry points here. */
export default function DomainEventsOverviewPage() {
  const router = useRouter();
  const [periodValue, setPeriodValue] = useState<Period['value']>('week');
  const period = PERIODS.find((p) => p.value === periodValue) ?? PERIODS[1];

  // Independent queries, so a slow one never holds back the others. Never-fires is judged on everything retained (a
  // quiet week isn't dead code), so it reads the catalog unbounded; the listener catalogue isn't period-bound at all.
  const summary = useQuery({ queryKey: ['domain-events-summary', period.value], queryFn: () => domainEventsApi.summary(since(period)) });
  const catalog = useQuery({ queryKey: ['domain-events-catalog', period.value], queryFn: () => domainEventsApi.catalog(since(period)) });
  const retained = useQuery({ queryKey: ['domain-events-catalog', 'retained'], queryFn: () => domainEventsApi.catalog() });
  const listeners = useQuery({ queryKey: ['domain-events-listeners'], queryFn: () => domainEventsApi.listeners() });

  const s = summary.data;
  const asOf = summary.dataUpdatedAt;
  const periodLower = period.label.toLowerCase();

  const tiles: { key: string; label: string; value: number; caption: string; tone?: Tone; href?: string }[] = s
    ? [
        {
          key: 'deliveries',
          label: 'Deliveries',
          value: s.total,
          caption: `${formatCount(s.eventNames)} event ${s.eventNames === 1 ? 'name' : 'names'}`,
          href: periodLink(asOf, period),
        },
        {
          key: 'no-listeners',
          label: 'No listeners',
          value: s.noListeners,
          caption: 'fired into nothing — a wiring gap',
          tone: s.noListeners > 0 ? 'warn' : undefined,
          href: periodLink(asOf, period, { status: 'no_listeners' }),
        },
        {
          key: 'dispatch-failed',
          label: 'Dispatch failed',
          value: s.dispatchFailed,
          caption: 'the transport itself broke',
          tone: s.dispatchFailed > 0 ? 'alert' : undefined,
          href: periodLink(asOf, period, { status: 'dispatch_failed' }),
        },
        {
          key: 'critical',
          label: 'Critical',
          value: s.critical,
          caption: 'raised with emitCritical()',
          href: periodLink(asOf, period, { method: 'emitCritical' }),
        },
      ]
    : ['Deliveries', 'No listeners', 'Dispatch failed', 'Critical'].map((label) => ({ key: label, label, value: 0, caption: '' }));

  const events = catalog.data ?? [];
  const busiest = Math.max(1, ...events.map((e) => e.total));
  const eventRows = events.map((e) => ({
    ...e,
    share: Math.round((e.total / busiest) * 100),
    critical: e.emitCriticalCount > 0,
    href: periodLink(catalog.dataUpdatedAt, period, { eventName: e.eventName }),
  }));

  // The three checks: the period's catalog for the two about what fired, everything retained for never-fires.
  const problems =
    catalog.data && retained.data && listeners.data
      ? wiringProblems(wiringRows(catalog.data, listeners.data), wiringRows(retained.data, listeners.data))
      : null;
  const problemsError = catalog.isError ? catalog : retained.isError ? retained : listeners.isError ? listeners : null;

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Domain Events</PageTitle>
          <PageSubtitle>What fired, who was listening — and whether the wiring is sound.</PageSubtitle>
        </PageHeaderGroup>
        <PageHeaderAction className="flex w-fit gap-2">
          <Button variant="secondary" onClick={() => router.push(domainEventsLinks.retention())}>
            <LuDatabase />
            Volume &amp; Retention
          </Button>
          <Button variant="secondary" onClick={() => router.push(domainEventsLinks.wiring())}>
            <LuNetwork />
            Wiring
          </Button>
          <Button onClick={() => router.push(domainEventsLinks.list())}>Go to Deliveries</Button>
        </PageHeaderAction>
      </PageHeader>
      <DashboardContent>
        {/* The period picker, and how far back the log goes — page-wide, so it sits beside the picker. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentControl segments={PERIODS} value={period.value} onValueChange={(v) => setPeriodValue(v as Period['value'])} />
          <OldestKept />
        </div>

        <WithError>
          <ErrorState if={summary.isError}>
            <Card>
              <CardPanel>
                <ErrorMessage title="Failed to load deliveries" error={summary.error} onRetry={() => summary.refetch()} />
              </CardPanel>
            </Card>
          </ErrorState>
          <NormalState if={!summary.isError}>
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
                            <SkeletonState if={!s}>
                              <Skeleton className="h-8 w-24" />
                            </SkeletonState>
                            <NormalState if={!!s}>
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
                          {s ? tile.caption : period.label}
                        </KpiCaption>
                      </KpiTile>
                    </CardPanel>
                  </Card>
                );
                return tile.href ? (
                  <Link
                    key={tile.key}
                    href={tile.href}
                    aria-label={`${tile.label} — open in Deliveries`}
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
              <Table visibleRows={EVENTS_VISIBLE}>
                {/* The header row carries the list's title, not column labels — each row says what it is. */}
                <TableHeader>
                  <TableHeaderRow size="lg">
                    <TableHead colSpan={3}>
                      <CardHeaderTitle>Busiest events</CardHeaderTitle>
                      <CardHeaderSubtitle>{period.label} · most deliveries first</CardHeaderSubtitle>
                    </TableHead>
                  </TableHeaderRow>
                </TableHeader>
                {eventRows.length > 0 && (
                  <TableBody>
                    {eventRows.map((row) => (
                      <TableRow key={row.eventName} className="cursor-pointer" onClick={() => router.push(row.href)}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <SimpleBadge>{row.eventName}</SimpleBadge>
                            {row.critical && <SimpleBadge variant="blue">critical</SimpleBadge>}
                            {row.noListenerCount > 0 && <SimpleBadge variant="orange">no listeners</SimpleBadge>}
                          </div>
                          <div className="text-muted-foreground mt-1 text-xs">
                            {listenersLabel(row.lastListenerCount)} · last {formatDateTime(row.lastOccurredAt, { style: 'relative' })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right align-top font-mono tabular-nums">{formatCount(row.total)}</TableCell>
                        {/* A fixed share of the row, so the bar never squeezes the event name and its caption. */}
                        <TableCell className="w-2/5">
                          <div className="bg-muted h-2 overflow-hidden rounded-full">
                            <div className="h-full rounded-full bg-sky-500/70 transition-all" style={{ width: `${row.share}%` }} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                )}
              </Table>
              <DataTableLoadingBody isLoading={catalog.isLoading} className="h-65" />
              <DataTableErrorBody isError={catalog.isError} error={catalog.error} onRetry={() => catalog.refetch()} className="h-65" />
              <DataTableEmptyBody
                isLoading={catalog.isLoading}
                isEmpty={!!catalog.data && eventRows.length === 0}
                title={`No events in the ${periodLower}`}
                description="Nothing was emitted — try a longer period."
                className="h-65"
              />
            </TableWrapper>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableHeaderRow size="lg">
                    <TableHead colSpan={2}>
                      <CardHeaderTitle>Wiring problems</CardHeaderTitle>
                      <CardHeaderSubtitle>{period.label} · never-fires over everything retained</CardHeaderSubtitle>
                    </TableHead>
                  </TableHeaderRow>
                </TableHeader>
                {problems && problems.some((p) => p.rows.length > 0) && (
                  <TableBody>
                    {problems
                      .filter((p) => p.rows.length > 0)
                      .map((p) => (
                        <TableRow key={p.key} className="cursor-pointer" onClick={() => router.push(domainEventsLinks.wiring())}>
                          <TableCell>
                            <div className="text-sm">{p.title}</div>
                            <div className="text-muted-foreground mt-1 flex flex-col gap-0.5 text-xs">
                              {p.rows.map((row) => (
                                <span key={row.eventName}>
                                  <span className="text-foreground font-mono">{row.eventName}</span>
                                  {p.detail(row, periodLower)}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right align-top">
                            <SimpleBadge variant={p.variant}>{p.count(p.rows.length)}</SimpleBadge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                )}
              </Table>
              <DataTableLoadingBody isLoading={!problems && !problemsError} className="h-65" />
              <DataTableErrorBody
                isError={!!problemsError}
                error={problemsError?.error}
                onRetry={() => problemsError?.refetch()}
                className="h-65"
              />
              <DataTableEmptyBody
                isLoading={!problems}
                isEmpty={!!problems && problems.every((p) => p.rows.length === 0)}
                title="The wiring is sound"
                description="Every event that fired had a listener, critical listeners are raised with emitCritical(), and every listener's event fires."
                className="h-65"
              />
            </TableWrapper>
          </div>
        </div>
      </DashboardContent>
    </>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The Wiring screen's three checks, as the Overview counts them — worst first. */
function wiringProblems(period: WiringRow[], retained: WiringRow[]) {
  const listenerNames = (row: WiringRow) =>
    row.listeners.map((l) => `${l.listenerClass}.${l.listenerMethod}`).join(', ');
  return [
    {
      key: 'critical-via-emit',
      title: 'Critical listener, raised with emit()',
      rows: period.filter((r) => r.criticalViaEmit),
      variant: 'red' as const,
      count: (n: number) => plural(n, 'event', 'events'),
      detail: (row: WiringRow) => ` → ${listenerNames(row)} — its failures are swallowed`,
    },
    {
      key: 'fires-into-nothing',
      title: 'Fired into nothing',
      rows: period.filter((r) => r.firesIntoNothing),
      variant: 'orange' as const,
      count: (n: number) => plural(n, 'event', 'events'),
      detail: (row: WiringRow, periodLower: string) => ` · ${formatCount(row.fired?.total ?? 0)} times in the ${periodLower}`,
    },
    {
      key: 'never-fires',
      title: 'Listener never fires',
      rows: retained.filter((r) => r.neverFires),
      variant: 'blue' as const,
      count: (n: number) => plural(n, 'event', 'events'),
      detail: (row: WiringRow) => ` → ${listenerNames(row)} — nothing raised it while deliveries were kept`,
    },
  ];
}

/** How far back the log goes — from the volume read, so it shows the prune is running. */
function OldestKept() {
  const volume = useQuery({ queryKey: ['domain-events-volume'], queryFn: () => domainEventsApi.volume(Intl.DateTimeFormat().resolvedOptions().timeZone) });
  if (!volume.data?.oldestOccurredAt) return null;
  return (
    <WithTooltip tooltip="How far back the log goes — the app prunes on its own schedule">
      <SimpleBadge>
        <LuHistory />
        Oldest delivery kept · {formatDateTime(volume.data.oldestOccurredAt, { time: true })}
      </SimpleBadge>
    </WithTooltip>
  );
}
