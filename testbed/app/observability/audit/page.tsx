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
import {
  mockOverviewStats,
  mockTopActionsStats,
} from "@/ascendra-commons-ui/audit-logging.ui/mocks";
import type {
  AuditOverviewStats,
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
function buildPlaceholderPerDay(): AuditOverviewStats["perDay"] {
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return { day: d.toISOString().slice(0, 10), count: 1 };
  });
}

/**
 * testbed has no live backend — using the mock fetchers. Two independent
 * calls, matching the two independent useQuery hooks below: the KPI
 * row + volume chart load separately from the Top Actions table (see the
 * doc comments on AuditOverviewStats/AuditTopActionsStats in
 * audit-api.types.ts for why this is a mock-layer-only split for now).
 */
const fetchOverviewStats = mockOverviewStats;
const fetchTopActions = mockTopActionsStats;

/** The Audit Log module's landing page — auditLoggingNav's one entry points here. */
export default function AuditOverviewPage() {
  const router = useRouter();
  const placeholderPerDay = useMemo(() => buildPlaceholderPerDay(), []);

  const overview = useQuery({
    queryKey: ["audit-overview-stats"],
    queryFn: () => fetchOverviewStats("30d"),
  });

  const topActions = useQuery({
    queryKey: ["audit-top-actions"],
    queryFn: () => fetchTopActions("7d"),
  });

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
          KPI row + volume chart — audit-overview-stats. WithError gates the
          whole section on overview.isError vs. everything else, since KPIs
          and the chart share one query — a single ErrorState replaces both
          rather than duplicating the error 5 times across tiles. No "empty"
          state here, since a KPI showing 0 or a chart with flat data isn't a
          broken/empty state the way a zero-row table is. Inside NormalState,
          the shells (Card/CardHeader/CardPanel, the real static label/
          caption text) are ALWAYS mounted; only the value+badge (per tile)
          and the chart body (via nested WithSkeleton blocks) swap between a
          skeleton and real content — gating the whole block on `overview.data`
          instead is what used to cause the entire section to pop into
          existence at once. `kpi?.value ?? 0`/`overview.data?.perDay ?? []`
          (not `kpi!`/`overview.data!`) inside NormalState's children is
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
          <ErrorState if={overview.isError}>
            <Card>
              <CardPanel>
                <ErrorMessage
                  title="Failed to load overview"
                  error={overview.error}
                  onRetry={() => overview.refetch()}
                />
              </CardPanel>
            </Card>
          </ErrorState>
          <NormalState if={!overview.isError}>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {KPI_DEFS.map((def) => {
                const kpi = overview.data?.kpis[def.key];
                const up = kpi ? kpi.deltaPct >= 0 : true;
                return (
                  <Card key={def.key} className="h-full">
                    <CardPanel>
                      <KpiTile>
                        <KpiLabel>{def.label}</KpiLabel>
                        <div className="mt-auto flex flex-col items-start gap-1 pt-4 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-2 lg:flex-col lg:items-start lg:gap-1 xl:flex-row xl:items-center xl:justify-between xl:gap-2">
                          <WithSkeleton>
                            <SkeletonState if={!kpi}>
                              <Skeleton className="h-8 w-20" />
                            </SkeletonState>
                            <NormalState if={!!kpi}>
                              <KpiValue>
                                {formatCount(kpi?.value ?? 0)}
                              </KpiValue>
                              <KpiTrend direction={up ? "up" : "down"}>
                                {formatSignedPercent(kpi?.deltaPct ?? 0)}
                              </KpiTrend>
                            </NormalState>
                          </WithSkeleton>
                        </div>
                        <KpiCaption className="mt-1 text-[0.6875rem] text-muted-foreground/60">
                          {def.comparedTo}
                        </KpiCaption>
                      </KpiTile>
                    </CardPanel>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardHeaderTitle>Volume by day</CardHeaderTitle>
                <CardHeaderSubtitle>
                  Past 30 days
                  {overview.data
                    ? ` · ${formatDateRange(
                        overview.data.perDay[0].day,
                        overview.data.perDay[overview.data.perDay.length - 1]
                          .day,
                      )}`
                    : ""}
                </CardHeaderSubtitle>
              </CardHeader>
              <CardPanel>
                <div className="p-5">
                  <WithSkeleton>
                    <SkeletonState if={!overview.data}>
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
                    <NormalState if={!!overview.data}>
                      <ChartContainer
                        config={chartConfig}
                        className="h-56 w-full"
                      >
                        <BarChart
                          data={overview.data?.perDay ?? []}
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
          Top actions — audit-top-actions, independent of the section above.
          Real CardHeader + real TableHeader (static "Action/Count/Actors"
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
              <CardHeaderSubtitle>
                Past 7 days · ranked by record count
              </CardHeaderSubtitle>
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
                {topActions.data && topActions.data.topActions.length > 0 && (
                  <TableBody>
                    {topActions.data.topActions.map((row) => (
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
                isLoading={topActions.isLoading}
                className="h-65"
              />
              <DataTableErrorBody
                isError={topActions.isError}
                error={topActions.error}
                onRetry={() => topActions.refetch()}
                className="h-65"
              />
              <DataTableEmptyBody
                isLoading={topActions.isLoading}
                isEmpty={
                  !!topActions.data && topActions.data.topActions.length === 0
                }
                title="No actions recorded"
                description="No audit activity in the past 7 days."
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
