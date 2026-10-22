'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  BackLink,
  CardHeaderSubtitle,
  CardHeaderTitle,
  DashboardContent,
  DataTableEmptyBody,
  DataTableErrorBody,
  DataTableLoadingBody,
  PageHeader,
  PageHeaderGroup,
  PageSubtitle,
  PageTitle,
  SegmentControl,
  SimpleBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
  TableWrapper,
} from '@/ascendra-ui';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import { domainEventsApi } from '@/ascendra-commons-ui/domain-events.ui/api';
import { domainEventsLinks } from '@/ascendra-commons-ui/domain-events.ui/links';
import { MAX_RANGE_DAYS, domainEventsQueryIds } from '@/ascendra-commons-ui/domain-events.ui/queries';
import { wiringRows, type WiringRow } from '@/ascendra-commons-ui/domain-events.ui/wiring';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * What "fired" counts over. All retained is the default: never-fires is only trustworthy over the whole log — a quiet
 * week isn't dead code. Its list link uses the filter's widest range, which is what the app keeps.
 */
const PERIODS = [
  { value: 'week', label: 'Past 7 days', ms: 7 * DAY_MS },
  { value: 'month', label: 'Past 30 days', ms: 30 * DAY_MS },
  { value: 'retained', label: 'All retained', ms: null },
] as const;
type Period = (typeof PERIODS)[number];

const SHOW = [
  { value: 'all', label: 'All events' },
  { value: 'problems', label: 'Problems only' },
] as const;

/** The delivery catalog over the period, counted back from when the fetch runs — everything retained has no bound. */
const fetchCatalog = (period: Period) =>
  domainEventsApi.catalog(period.ms === null ? undefined : new Date(Date.now() - period.ms));

/** Deliveries for one event over the period (all retained → the filter's widest range), ending when the numbers were fetched. */
const eventLink = (asOf: number, period: Period, eventName: string) =>
  domainEventsLinks.list({
    queryId: domainEventsQueryIds.advancedFilter,
    params: {
      eventName,
      occurredRange: { from: new Date(asOf - (period.ms ?? MAX_RANGE_DAYS * DAY_MS)), to: new Date(asOf) },
    },
  });

/**
 * What fired, against what the code says should listen — one row per event name in either. Two reads joined here: the
 * delivery catalog over the period and the listener catalogue (a live read of this process's decorators). Reached from
 * the Overview's header and its Wiring problems card — not nav.
 */
export default function DomainEventWiringPage() {
  const router = useRouter();
  const [periodValue, setPeriodValue] = useState<Period['value']>('retained');
  const [show, setShow] = useState<(typeof SHOW)[number]['value']>('all');
  const period = PERIODS.find((p) => p.value === periodValue) ?? PERIODS[2];

  const catalog = useQuery({
    queryKey: ['domain-events-catalog', period.ms === null ? 'retained' : period.value],
    queryFn: () => fetchCatalog(period),
  });
  const listeners = useQuery({ queryKey: ['domain-events-listeners'], queryFn: () => domainEventsApi.listeners() });

  const all = catalog.data && listeners.data ? wiringRows(catalog.data, listeners.data) : null;
  const rows = all ? (show === 'problems' ? all.filter((r) => r.problem) : all) : [];
  const failed = catalog.isError ? catalog : listeners.isError ? listeners : null;
  const problemCount = all?.filter((r) => r.problem).length ?? 0;

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <BackLink href={domainEventsLinks.overview()}>Back to overview</BackLink>
          <PageTitle>Wiring</PageTitle>
          <PageSubtitle>What fired, against what the code says should listen — and the three ways they disagree.</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <DashboardContent>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentControl segments={PERIODS} value={period.value} onValueChange={(v) => setPeriodValue(v as Period['value'])} />
          <SegmentControl segments={SHOW} value={show} onValueChange={(v) => setShow(v as typeof show)} aria-label="Show" />
        </div>

        <TableWrapper>
          <Table horizontal>
            <TableHeader>
              <TableHeaderRow size="lg">
                <TableHead colSpan={5}>
                  <CardHeaderTitle>Events</CardHeaderTitle>
                  <CardHeaderSubtitle>
                    {period.label} · {all ? `${formatCount(problemCount)} with a problem, first` : 'problems first'}
                  </CardHeaderSubtitle>
                </TableHead>
              </TableHeaderRow>
              <TableHeaderRow>
                <TableHead>Event</TableHead>
                <TableHead className="text-right">Fired</TableHead>
                <TableHead>Raised with</TableHead>
                <TableHead>Listeners</TableHead>
                <TableHead>Check</TableHead>
              </TableHeaderRow>
            </TableHeader>
            {rows.length > 0 && (
              <TableBody>
                {rows.map((row) => {
                  const href = row.fired ? eventLink(catalog.dataUpdatedAt, period, row.eventName) : undefined;
                  return (
                    <TableRow key={row.eventName} className={href ? 'cursor-pointer' : undefined} onClick={href ? () => router.push(href) : undefined}>
                      <TableCell className="align-top whitespace-nowrap">
                        <SimpleBadge>{row.eventName}</SimpleBadge>
                        {row.fired && (
                          <div className="text-muted-foreground mt-1 text-xs">
                            last {formatDateTime(row.fired.lastOccurredAt, { style: 'relative' })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className={`text-right align-top font-mono tabular-nums ${row.fired ? '' : 'text-muted-foreground'}`}>
                        {formatCount(row.fired?.total ?? 0)}
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap">
                        <RaisedWith row={row} />
                      </TableCell>
                      <TableCell className="align-top">
                        <Listeners row={row} />
                      </TableCell>
                      <TableCell className="align-top">
                        <Checks row={row} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            )}
          </Table>
          <DataTableLoadingBody isLoading={!all && !failed} className="h-65" />
          <DataTableErrorBody isError={!!failed} error={failed?.error} onRetry={() => failed?.refetch()} className="h-65" />
          <DataTableEmptyBody
            isLoading={!all}
            isEmpty={!!all && rows.length === 0}
            title={show === 'problems' ? 'No wiring problems' : 'No events'}
            description={
              show === 'problems'
                ? 'Every event that fired had a listener, critical listeners are raised with emitCritical(), and every listener’s event fires.'
                : 'Nothing has fired and no listener is wired.'
            }
            className="h-65"
          />
        </TableWrapper>
        <p className="text-muted-foreground text-xs">
          The listener catalogue reads this process&apos;s <code>@OnEvent()</code> / <code>@OnCriticalEvent()</code> decorators — listeners in
          another service don&apos;t appear.
        </p>
      </DashboardContent>
    </>
  );
}

/** `emit 81`, `critical 554`, or both when an event is raised both ways. */
function RaisedWith({ row }: { row: WiringRow }) {
  if (!row.fired) return <span className="text-muted-foreground">—</span>;
  const { emitCount, emitCriticalCount } = row.fired;
  return (
    <div className="flex flex-col gap-0.5 text-sm">
      {emitCriticalCount > 0 && <span>critical {formatCount(emitCriticalCount)}</span>}
      {emitCount > 0 && <span className={row.criticalViaEmit ? 'text-negative' : undefined}>emit {formatCount(emitCount)}</span>}
    </div>
  );
}

function Listeners({ row }: { row: WiringRow }) {
  if (row.listeners.length === 0) return <span className="text-muted-foreground">none</span>;
  return (
    <div className="flex flex-col gap-1">
      {row.listeners.map((l) => (
        <span key={`${l.listenerClass}.${l.listenerMethod}`} className="flex flex-wrap items-center gap-1.5 text-sm">
          {l.listenerClass}.{l.listenerMethod}
          {l.critical && <SimpleBadge variant="blue">critical</SimpleBadge>}
        </span>
      ))}
    </div>
  );
}

function Checks({ row }: { row: WiringRow }) {
  if (!row.problem) return <SimpleBadge variant="green">ok</SimpleBadge>;
  return (
    <div className="flex flex-wrap gap-1">
      {row.criticalViaEmit && <SimpleBadge variant="red">critical listener, raised with emit()</SimpleBadge>}
      {row.firesIntoNothing && <SimpleBadge variant="orange">fires into nothing</SimpleBadge>}
      {row.neverFires && <SimpleBadge variant="blue">never fires</SimpleBadge>}
    </div>
  );
}
