'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  CardHeader,
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
import { auditApi } from '@/ascendra-commons-ui/audit-logging.ui/api';
import { auditLogLinks } from '@/ascendra-commons-ui/audit-logging.ui/links';
import type { AuditStats } from '@/ascendra-commons-ui/audit-logging.ui/api';

const chartConfig: ChartConfig = {
  count: { label: 'Records', color: 'var(--chart-1)' },
};

function todayCount(stats: AuditStats): number {
  const today = new Date().toISOString().slice(0, 10);
  return stats.perDay.find((d) => d.day === today)?.count ?? 0;
}

function last7dCount(stats: AuditStats): number {
  return stats.perDay.slice(-7).reduce((sum, d) => sum + d.count, 0);
}

/**
 * The one fetcher this page calls — real API by default. A consumer without
 * a live backend (e.g. testbed) swaps this single line for a mock from
 * `audit-logging.ui/mocks` instead of editing the page body.
 */
const fetchStats = (window?: string) => auditApi.stats(window);

/** The Audit Log module's landing page — auditLoggingNav's one entry points here. */
export default function AuditOverviewPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: () => fetchStats('30d'),
  });

  const kpis = data
    ? [
        { label: 'Records today', value: todayCount(data) },
        { label: 'Records (7d)', value: last7dCount(data) },
        { label: 'Distinct actors (30d)', value: data.topActors.length },
        { label: 'Tenants (30d)', value: data.perTenant.length },
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
              {kpis.map((kpi) => (
                <Card key={kpi.label} className="h-full">
                  <CardPanel>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-muted-foreground text-xs">{kpi.label}</p>
                      <span className="mt-auto pt-4 text-2xl font-semibold tracking-tight">{kpi.value}</span>
                    </div>
                  </CardPanel>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardHeaderTitle>Volume by day ({data.window})</CardHeaderTitle>
              </CardHeader>
              <CardPanel>
                <div className="p-5">
                  <ChartContainer config={chartConfig} className="h-56 w-full">
                    <BarChart data={data.perDay} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} strokeWidth={0.5} />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={4} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={32} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </div>
              </CardPanel>
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardHeaderTitle>Top actions ({data.window})</CardHeaderTitle>
                </CardHeader>
                <CardPanel>
                  <TableWrapper>
                    <Table>
                      <TableHeader>
                        <TableHeaderRow>
                          <TableHead className="whitespace-nowrap">Action</TableHead>
                          <TableHead className="whitespace-nowrap">Count</TableHead>
                        </TableHeaderRow>
                      </TableHeader>
                      <TableBody>
                        {data.topActions.map((row) => (
                          <TableRow key={row.action}>
                            <TableCell>
                              <SimpleBadge>{row.action}</SimpleBadge>
                            </TableCell>
                            <TableCell>{row.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableWrapper>
                </CardPanel>
              </Card>

              <Card>
                <CardHeader>
                  <CardHeaderTitle>Top actors ({data.window})</CardHeaderTitle>
                </CardHeader>
                <CardPanel>
                  <TableWrapper>
                    <Table>
                      <TableHeader>
                        <TableHeaderRow>
                          <TableHead className="whitespace-nowrap">Actor</TableHead>
                          <TableHead className="whitespace-nowrap">Count</TableHead>
                        </TableHeaderRow>
                      </TableHeader>
                      <TableBody>
                        {data.topActors.map((row) => (
                          <TableRow key={row.actor}>
                            <TableCell>{row.actor}</TableCell>
                            <TableCell>{row.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableWrapper>
                </CardPanel>
              </Card>
            </div>
          </>
        )}
      </DashboardContent>
    </>
  );
}
