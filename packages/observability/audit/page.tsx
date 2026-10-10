"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardFooter,
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
  KpiTrend,
  KpiValue,
  NormalState,
  PageHeader,
  PageHeaderAction,
  PageHeaderGroup,
  PageSubtitle,
  PageTitle,
  Skeleton,
  SkeletonState,
  SimpleBadge,
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
} from "@/ascendra-ui";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/ascendra-ui/shadcn";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { LuDatabase } from "react-icons/lu";
import { auditLogLinks } from "@/ascendra-commons-ui/audit-logging.ui/links";
import { auditApi } from "@/ascendra-commons-ui/audit-logging.ui/api";
import type {
  AuditStats,
  AuditStatsKpis,
} from "@/ascendra-commons-ui/audit-logging.ui/api";
import {
  formatCount,
  formatDateRange,
  formatShortDate,
  formatSignedPercent,
} from "@/ascendra-ui/utils/common.util";

const chartConfig: ChartConfig = {
  count: { label: "Records", color: "var(--chart-1)" },
};

/** Static per-tile copy — never depends on fetched data, so it renders immediately regardless of loading state. Only `value`/`deltaPct` (looked up by `key`) come from the query. */
const KPI_DEFS = [
  { key: "recordsToday", label: "Records today", comparedTo: "vs. yesterday" },
  {
    key: "records7d",
    label: "Records (past 7 days)",
    comparedTo: "vs. prior 7 days",
  },
  {
    key: "distinctActors30d",
    label: "Distinct actors (past 30 days)",
    comparedTo: "vs. prior 30 days",
  },
  {
    key: "entityTypes30d",
    label: "Entity types (past 30 days)",
    comparedTo: "vs. prior 30 days",
  },
] as const satisfies ReadonlyArray<{
  key: keyof AuditStatsKpis;
  label: string;
  comparedTo: string;
}>;

/**
 * The volume chart's loading-state data — real day labels (the "past 30
 * days" window is knowable client-side, independent of the fetch) paired
 * with a flat placeholder count. A flat, equal value still renders real bar
 * shapes (unlike an all-zero placeholder, which renders zero-height, i.e.
 * invisible, bars) — styled muted + pulsing so it never reads as real data.
 */
function buildPlaceholderPerDay(): AuditStats["perDay"] {
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return { day: d.toISOString().slice(0, 10), count: 1 };
  });
}

/**
 * The one fetcher this page calls — real API by default. A consumer
 * without a live backend (e.g. testbed) swaps this for a mock from
 * `audit-logging.ui/mocks` instead of editing the page body.
 *
 * `GET /audit/stats` is still a single combined endpoint (see AuditStats's
 * own doc comment in audit-api.types.ts) — the mock layer splits delivery
 * into two independently-timed calls (AuditOverviewStats/AuditTopActionsStats)
 * so the KPI/chart section and the Top Actions table can show independent
 * loading states for UX polish. The real version below can't do that split
 * without a second real request against the same unsplit endpoint, so both
 * sections share this one query/one loading state instead; re-split this
 * once the real API actually exposes two endpoints (update both together,
 * per AuditStats's doc comment, at that point). One consequence: the Top
 * Actions table's window is now whatever `stats` is fetched with (30d, to
 * match the KPI row), not its own independent 7d window the mock used.
 */
const fetchStats = (window?: string) => auditApi.stats(window);

/** The Audit Log module's landing page — auditLoggingNav's one entry points here. */
export default function AuditOverviewPage() {
  const router = useRouter();
  const placeholderPerDay = useMemo(() => buildPlaceholderPerDay(), []);

  const stats = useQuery({
    queryKey: ["audit-stats"],
    queryFn: () => fetchStats("30d"),
  });

  const kpiRows = KPI_DEFS.map((def) => {
    const kpi = stats.data?.kpis[def.key];
    return { ...def, kpi, up: kpi ? kpi.deltaPct >= 0 : true };
  });

  const volumeSubtitle = stats.data
    ? `Past 30 days · ${formatDateRange(
        stats.data.perDay[0].day,
        stats.data.perDay[stats.data.perDay.length - 1].day,
      )}`
    : "Past 30 days";

  const topActionsSubtitle = stats.data
    ? `Past ${stats.data.window} · ranked by record count`
    : "Ranked by record count";

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Audit Log</PageTitle>
          <PageSubtitle>
            Volume and shape at a glance — when something&apos;s off, this is
            where it shows first.
          </PageSubtitle>
        </PageHeaderGroup>
        <PageHeaderAction className="flex w-fit gap-2">
          <Button
            variant="secondary"
            onClick={() => router.push(auditLogLinks.retention())}
          >
            <LuDatabase />
            Retention &amp; Volume
          </Button>
          <Button onClick={() => router.push(auditLogLinks.list())}>
            Go to Audit Log
          </Button>
        </PageHeaderAction>
      </PageHeader>
      <DashboardContent>
        {/*
          KPI row + volume chart — audit-stats. WithError gates the whole
          section on stats.isError vs. everything else, since KPIs and the
          chart share one query — a single ErrorState replaces both rather
          than duplicating the error 5 times across tiles. No "empty" state
          here, since a KPI showing 0 or a chart with flat data isn't a
          broken/empty state the way a zero-row table is. Inside NormalState,
          the shells (Card/CardHeader/CardPanel, the real static label/
          caption text) are ALWAYS mounted; only the value+badge (per tile)
          and the chart body (via nested WithSkeleton blocks) swap between a
          skeleton and real content — gating the whole block on `stats.data`
          instead is what used to cause the entire section to pop into
          existence at once. `kpi?.value ?? 0`/`stats.data?.perDay ?? []`
          (not `kpi!`/`stats.data!`) inside NormalState's children is
          required, not stylistic — those children are constructed eagerly
          regardless of NormalState's own `if`, so a non-null assertion here
          would throw during the exact loading state it's meant to skip.

          ErrorState is given Card/CardPanel/ErrorMessage children here
          rather than relying on its own default title/description/icon
          props, for two reasons: Empty's own `border-dashed` class has no
          effect on its own (Tailwind's preflight zeroes border-width, and
          Empty never pairs `border-dashed` with a `border` width utility),
          so ErrorState's auto-generated default renders with no visible
          boundary at all; and this page wants that default content wrapped
          in Card/CardPanel (bg-muted, matching every other Card here)
          rather than bare. ErrorMessage is the gate-free default content
          ErrorState renders internally — using it directly here, instead of
          nesting a second `if`-bearing ErrorState inside the first just to
          reach the same default markup, keeps ErrorState's `if` as the only
          gate in this tree.
        */}
        <WithError>
          <ErrorState if={stats.isError}>
            <Card>
              <CardPanel>
                <ErrorMessage
                  title="Failed to load overview"
                  error={stats.error}
                  onRetry={() => stats.refetch()}
                />
              </CardPanel>
            </Card>
          </ErrorState>
          <NormalState if={!stats.isError}>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {kpiRows.map((row) => (
                <Card key={row.key} className="h-full">
                  <CardPanel>
                    <KpiTile>
                      <KpiLabel>{row.label}</KpiLabel>
                      <div className="mt-auto flex flex-col items-start gap-1 pt-4 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-2 lg:flex-col lg:items-start lg:gap-1 xl:flex-row xl:items-center xl:justify-between xl:gap-2">
                        <WithSkeleton>
                          <SkeletonState if={!row.kpi}>
                            <Skeleton className="h-8 w-20" />
                          </SkeletonState>
                          <NormalState if={!!row.kpi}>
                            <KpiValue>
                              {formatCount(row.kpi?.value ?? 0)}
                            </KpiValue>
                            <KpiTrend direction={row.up ? "up" : "down"}>
                              {formatSignedPercent(row.kpi?.deltaPct ?? 0)}
                            </KpiTrend>
                          </NormalState>
                        </WithSkeleton>
                      </div>
                      <KpiCaption className="mt-1 text-[0.6875rem] text-muted-foreground/60">
                        {row.comparedTo}
                      </KpiCaption>
                    </KpiTile>
                  </CardPanel>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardHeaderTitle>Volume by day</CardHeaderTitle>
                <CardHeaderSubtitle>{volumeSubtitle}</CardHeaderSubtitle>
              </CardHeader>
              <CardPanel>
                <div className="p-5">
                  <WithSkeleton>
                    <SkeletonState if={!stats.data}>
                      <ChartContainer
                        config={chartConfig}
                        className="h-56 w-full animate-pulse"
                      >
                        <BarChart
                          data={placeholderPerDay}
                          margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            vertical={false}
                            stroke="var(--border)"
                            strokeOpacity={0.6}
                            strokeWidth={0.5}
                          />
                          <XAxis
                            dataKey="day"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11 }}
                            interval={4}
                            tickFormatter={formatShortDate}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={false}
                            width={40}
                          />
                          <Bar
                            dataKey="count"
                            fill="var(--muted)"
                            radius={[3, 3, 0, 0]}
                          />
                        </BarChart>
                      </ChartContainer>
                    </SkeletonState>
                    <NormalState if={!!stats.data}>
                      <ChartContainer
                        config={chartConfig}
                        className="h-56 w-full"
                      >
                        <BarChart
                          data={stats.data?.perDay ?? []}
                          margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            vertical={false}
                            stroke="var(--border)"
                            strokeOpacity={0.6}
                            strokeWidth={0.5}
                          />
                          <XAxis
                            dataKey="day"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11 }}
                            interval={4}
                            tickFormatter={formatShortDate}
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
                                formatter={(v) => [
                                  formatCount(Number(v)),
                                  " Records",
                                ]}
                              />
                            }
                          />
                          <Bar
                            dataKey="count"
                            fill="var(--color-count)"
                            radius={[3, 3, 0, 0]}
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

        {/*
          Top actions — sliced from the same audit-stats query as the
          section above (see fetchStats's own doc comment for why this isn't
          independent the way the mock's two-call split is). Real
          CardHeader + real TableHeader (static "Action/Count/Actors"
          labels) stay mounted throughout; only the body area swaps between
          real rows and one of DataTableLoadingBody/DataTableErrorBody/
          DataTableEmptyBody — the real ascendra-ui components, used
          standalone via their prop overrides (isLoading/isError/error/
          onRetry/isEmpty) rather than DataTableProvider context, since this
          is deliberately a simple useQuery-driven table, not the full
          DataTable system. className="h-65" nets out to the same ~300px
          as the loaded state once the real TableHeader's own ~40px sitting
          above it is accounted for — EmptyBody isn't inside the Table's
          own height={300} scroll wrapper, so its height has to be set
          independently; same arithmetic as the hand-rolled version this
          replaced.
        */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12">
            <CardHeader>
              <CardHeaderTitle>Top actions</CardHeaderTitle>
              <CardHeaderSubtitle>{topActionsSubtitle}</CardHeaderSubtitle>
            </CardHeader>
            <TableWrapper>
              <Table scrollable horizontal vertical height={300}>
                <TableHeader>
                  <TableHeaderRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Actors</TableHead>
                  </TableHeaderRow>
                </TableHeader>
                {stats.data && stats.data.topActions.length > 0 && (
                  <TableBody>
                    {stats.data.topActions.map((row) => (
                      <TableRow key={row.action}>
                        <TableCell>
                          <SimpleBadge>{row.action}</SimpleBadge>
                        </TableCell>
                        <TableCell className="font-mono tabular-nums">
                          {formatCount(row.count)}
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {formatCount(row.actors)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                )}
              </Table>
              <DataTableLoadingBody
                isLoading={stats.isLoading}
                className="h-65"
              />
              <DataTableErrorBody
                isError={stats.isError}
                error={stats.error}
                onRetry={() => stats.refetch()}
                className="h-65"
              />
              <DataTableEmptyBody
                isLoading={stats.isLoading}
                isEmpty={
                  !!stats.data && stats.data.topActions.length === 0
                }
                title="No actions recorded"
                description="No audit activity in this window."
                className="h-65"
              />
              <CardFooter className="border-t-0 pt-0"></CardFooter>
            </TableWrapper>
          </div>
        </div>
      </DashboardContent>
    </>
  );
}
