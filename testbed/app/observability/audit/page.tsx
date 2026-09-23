'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardHeaderSubtitle,
  CardHeaderTitle,
  CardPanel,
  DashboardContent,
  PageHeader,
  PageHeaderAction,
  PageHeaderGroup,
  PageSubtitle,
  PageTitle,
  SimpleAlert,
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
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/ascendra-ui/shadcn';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { LuDatabase, LuTrendingDown, LuTrendingUp } from 'react-icons/lu';
import { auditLogLinks } from '@/ascendra-commons-ui/audit-logging.ui/links';
import { mockStats } from '@/ascendra-commons-ui/audit-logging.ui/mocks';
import type { AuditKpiValue, AuditStats } from '@/ascendra-commons-ui/audit-logging.ui/api';

const chartConfig: ChartConfig = {
  count: { label: 'Records', color: 'var(--chart-1)' },
};

/** Thousands separator under 10,000; compact K/M above — same per-page local-helper convention as ascendra-ui's own dashboards (e.g. `fmtMrr` in saas-revenue/page.tsx). */
function formatCount(value: number): string {
  if (value >= 10_000) {
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  }
  return value.toLocaleString('en-US');
}

function formatDelta(kpi: AuditKpiValue): string {
  const sign = kpi.deltaPct >= 0 ? '+' : '';
  return `${sign}${kpi.deltaPct.toFixed(1)}%`;
}

function formatDateRange(perDay: AuditStats['perDay']): string {
  if (perDay.length === 0) return '';
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt(perDay[0].day)} – ${fmt(perDay[perDay.length - 1].day)}`;
}

/** testbed has no live backend — using the mock fetcher (see page.tsx's own comment upstream). */
const fetchStats = mockStats;

/** The Audit Log module's landing page — auditLoggingNav's one entry points here. */
export default function AuditOverviewPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: () => fetchStats('30d'),
  });

  const kpis = data
    ? [
        { label: 'Records today', comparedTo: 'vs. yesterday', ...data.kpis.recordsToday },
        { label: 'Records (past 7 days)', comparedTo: 'vs. prior 7 days', ...data.kpis.records7d },
        { label: 'Distinct actors (past 30 days)', comparedTo: 'vs. prior 30 days', ...data.kpis.distinctActors30d },
        { label: 'Entity types (past 30 days)', comparedTo: 'vs. prior 30 days', ...data.kpis.entityTypes30d },
      ]
    : [];

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Audit Log</PageTitle>
          <PageSubtitle>Volume and shape at a glance — when something's off, this is where it shows first.</PageSubtitle>
        </PageHeaderGroup>
        <PageHeaderAction className="flex w-fit gap-2">
          <Button variant="secondary" onClick={() => router.push(auditLogLinks.retention())}>
            <LuDatabase />
            Retention &amp; Volume
          </Button>
          <Button onClick={() => router.push(auditLogLinks.list())}>Go to Audit Log</Button>
        </PageHeaderAction>
      </PageHeader>
      <DashboardContent>
        {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
        {isError && <SimpleAlert variant="destructive">Could not load audit stats.</SimpleAlert>}
        {data && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {kpis.map((kpi) => {
                const up = kpi.deltaPct >= 0;
                return (
                  <Card key={kpi.label} className="h-full">
                    <CardPanel>
                      <div className="flex flex-1 flex-col p-5">
                        <p className="text-muted-foreground text-xs">{kpi.label}</p>
                        <div className="mt-auto flex flex-col items-start gap-1 pt-4 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-2 lg:flex-col lg:items-start lg:gap-1 xl:flex-row xl:items-center xl:justify-between xl:gap-2">
                          <span className="text-2xl font-semibold tracking-tight">{formatCount(kpi.value)}</span>
                          <SimpleBadge variant={up ? 'green' : 'red'}>
                            {up ? <LuTrendingUp className="size-3" /> : <LuTrendingDown className="size-3" />}
                            {formatDelta(kpi)}
                          </SimpleBadge>
                        </div>
                        <p className="text-muted-foreground/60 mt-1 text-[0.6875rem]">{kpi.comparedTo}</p>
                      </div>
                    </CardPanel>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardHeaderTitle>Volume by day</CardHeaderTitle>
                <CardHeaderSubtitle>Past 30 days · {formatDateRange(data.perDay)}</CardHeaderSubtitle>
              </CardHeader>
              <CardPanel>
                <div className="p-5">
                  <ChartContainer config={chartConfig} className="h-56 w-full">
                    <BarChart data={data.perDay} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} strokeWidth={0.5} />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={4} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                        width={40}
                        allowDecimals={false}
                        tickFormatter={(v: number) => formatCount(v)}
                      />
                      <ChartTooltip content={<ChartTooltipContent formatter={(v) => [formatCount(Number(v)), 'Records']} />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </div>
              </CardPanel>
            </Card>

            {/* ── Top actions — full width, bare CardHeader above TableWrapper (no enclosing Card), matching the Marketing dashboard's Active Campaigns table ── */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12">
                <CardHeader>
                  <CardHeaderTitle>Top actions</CardHeaderTitle>
                  <CardHeaderSubtitle>Past 7 days · ranked by record count</CardHeaderSubtitle>
                </CardHeader>
                <TableWrapper>
                  <Table scrollable horizontal vertical height={300}>
                    <TableHeader>
                      <TableHeaderRow>
                        <TableHead className="whitespace-nowrap">Action</TableHead>
                        <TableHead className="whitespace-nowrap">Count</TableHead>
                        <TableHead className="whitespace-nowrap">Actors</TableHead>
                      </TableHeaderRow>
                    </TableHeader>
                    <TableBody>
                      {data.topActions.map((row) => (
                        <TableRow key={row.action}>
                          <TableCell>
                            <SimpleBadge>{row.action}</SimpleBadge>
                          </TableCell>
                          <TableCell className="font-mono tabular-nums">{formatCount(row.count)}</TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">{formatCount(row.actors)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <CardFooter className="border-t-0 pt-0"></CardFooter>
                </TableWrapper>
              </div>
            </div>
          </>
        )}
      </DashboardContent>
    </>
  );
}
