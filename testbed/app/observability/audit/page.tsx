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
  Empty,
  EmptyBody,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  PageHeader,
  PageHeaderAction,
  PageHeaderGroup,
  PageSubtitle,
  PageTitle,
  Skeleton,
  SimpleBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
  TableWrapper,
} from "@/ascendra-ui";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/ascendra-ui/shadcn";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  LuDatabase,
  LuLoader,
  LuTrendingDown,
  LuTrendingUp,
} from "react-icons/lu";
import { auditLogLinks } from "@/ascendra-commons-ui/audit-logging.ui/links";
import {
  mockOverviewStats,
  mockTopActionsStats,
} from "@/ascendra-commons-ui/audit-logging.ui/mocks";
import type {
  AuditKpiValue,
  AuditOverviewStats,
  AuditStatsKpis,
} from "@/ascendra-commons-ui/audit-logging.ui/api";

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

/** Thousands separator under 10,000; compact K/M above — same per-page local-helper convention as ascendra-ui's own dashboards (e.g. `fmtMrr` in saas-revenue/page.tsx). */
function formatCount(value: number): string {
  if (value >= 10_000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return value.toLocaleString("en-US");
}

function formatDelta(kpi: AuditKpiValue): string {
  const sign = kpi.deltaPct >= 0 ? "+" : "";
  return `${sign}${kpi.deltaPct.toFixed(1)}%`;
}

/** Shared by both the real and placeholder chart's XAxis, so tick formatting never changes when the data swaps in. */
function formatAxisDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateRange(perDay: AuditOverviewStats["perDay"]): string {
  if (perDay.length === 0) return "";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  return `${fmt(perDay[0].day)} – ${fmt(perDay[perDay.length - 1].day)}`;
}

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
          KPI row + volume chart — audit-overview-stats. The shells below
          (Card/CardHeader/CardPanel, the real static label/caption text)
          are ALWAYS mounted; only the value+badge and the chart body swap
          between a skeleton and real content. This is deliberate — gating
          the whole block behind `overview.data &&` is what used to cause
          the entire section to pop into existence at once. Error handling
          is deferred (falls through to the skeleton state for now).
        */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPI_DEFS.map((def) => {
            const kpi = overview.data?.kpis[def.key];
            const up = kpi ? kpi.deltaPct >= 0 : true;
            return (
              <Card key={def.key} className="h-full">
                <CardPanel>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-muted-foreground text-xs">{def.label}</p>
                    <div className="mt-auto flex flex-col items-start gap-1 pt-4 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-2 lg:flex-col lg:items-start lg:gap-1 xl:flex-row xl:items-center xl:justify-between xl:gap-2">
                      {kpi ? (
                        <>
                          <span className="text-2xl font-semibold tracking-tight">
                            {formatCount(kpi.value)}
                          </span>
                          <SimpleBadge variant={up ? "green" : "red"}>
                            {up ? (
                              <LuTrendingUp className="size-3" />
                            ) : (
                              <LuTrendingDown className="size-3" />
                            )}
                            {formatDelta(kpi)}
                          </SimpleBadge>
                        </>
                      ) : (
                        <Skeleton className="h-8 w-20" />
                      )}
                    </div>
                    <p className="text-muted-foreground/60 mt-1 text-[0.6875rem]">
                      {def.comparedTo}
                    </p>
                  </div>
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
                ? ` · ${formatDateRange(overview.data.perDay)}`
                : ""}
            </CardHeaderSubtitle>
          </CardHeader>
          <CardPanel>
            <div className="p-5">
              {overview.data ? (
                <ChartContainer config={chartConfig} className="h-56 w-full">
                  <BarChart
                    data={overview.data.perDay}
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
                      tickFormatter={formatAxisDay}
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
                          formatter={(v) => [formatCount(Number(v)), "Records"]}
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
              ) : (
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
                      tickFormatter={formatAxisDay}
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
              )}
            </div>
          </CardPanel>
        </Card>

        {/*
          Top actions — audit-top-actions, independent of the section above.
          Real CardHeader + real TableHeader (static "Action/Count/Actors"
          labels) stay mounted throughout; only the body area swaps between
          this loading block and real rows — same mechanism ascendra-ui's
          own DataTableLoadingBody uses (EmptyBody wrapping Empty/EmptyMedia/
          EmptyTitle/EmptyDescription with a spinning LuLoader), reused
          directly here rather than via DataTableLoadingBody itself, since
          that component requires a DataTableProvider this simple table
          intentionally doesn't have. EmptyBody (not a plain div) matters —
          it's what gives the block its neutral bg-background surface via
          the same before:-pseudo-element trick a real populated TableBody
          uses, instead of it showing through to TableWrapper's bg-muted
          backdrop. Pinned to the same 300px the real Table caps at, so the
          swap is an exact height match, not an incidental one.
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
                {topActions.data && (
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
              {!topActions.data && (
                <EmptyBody className="h-65">
                  <Empty className="h-full">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <LuLoader className="animate-spin" strokeWidth={2} />
                      </EmptyMedia>
                      <EmptyTitle>Loading ...</EmptyTitle>
                      <EmptyDescription>
                        Please wait while data is being fetched.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </EmptyBody>
              )}
              <CardFooter className="border-t-0 pt-0"></CardFooter>
            </TableWrapper>
          </div>
        </div>
      </DashboardContent>
    </>
  );
}
