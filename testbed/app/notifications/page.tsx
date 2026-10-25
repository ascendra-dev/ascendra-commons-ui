'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { LuArrowUpRight, LuDatabase } from 'react-icons/lu';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardHeaderSubtitle,
  CardHeaderTitle,
  CardList,
  CardListItem,
  CardListLink,
  CardPanel,
  ChartBarLink,
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
  WithError,
  WithSkeleton,
  type TriggerParams,
} from '@/ascendra-ui';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/ascendra-ui/shadcn';
import { cn } from '@/ascendra-ui/shadcn';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  channelLabel,
  NOTIFICATION_CHANNELS,
  notificationApi,
  notificationLinks,
  notificationQueryIds,
  REASON_KIND_BADGE,
  reasonKind,
  reasonTitle,
  type CoverageGap,
  type DeliveryStats,
  type DeliveryStatus,
  type NotificationTypeSummary,
  type StatsWindow,
} from '@/ascendra-commons-ui/notification.ui';
import { TenantPicker, useNotificationScope } from './_scope';
import { tenantName } from './tenants';

const PERIODS: Array<{ value: StatsWindow; label: string }> = [
  { value: '24h', label: 'Past 24 hours' },
  { value: '7d', label: 'Past 7 days' },
  { value: '30d', label: 'Past 30 days' },
];

/** The viewer's IANA zone — a "day" is a day on their calendar. */
const viewerTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const chartConfig: ChartConfig = {
  ok: { label: 'Not failed', color: 'var(--chart-1)' },
  failed: { label: 'Failed or bounced', color: 'var(--color-red-500)' },
};

/** The channel bar's segments, in order — reached, waiting on the provider, failed, skipped. */
const SEGMENTS = [
  { key: 'delivered', label: 'reached', className: 'bg-emerald-500/80' },
  { key: 'sent', label: 'sent, no callback yet', className: 'bg-sky-400/80' },
  { key: 'failed', label: 'failed / bounced', className: 'bg-red-500/80' },
  { key: 'skipped', label: 'skipped', className: 'bg-muted-foreground/30' },
] as const;

const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));
const plural = (n: number, one: string, many: string) => `${formatCount(n)} ${n === 1 ? one : many}`;

/** Totals per status over rows of `{ status, count }`. */
function byStatus(rows: Array<{ status: DeliveryStatus; count: number }>) {
  const t: Record<DeliveryStatus, number> = { sent: 0, delivered: 0, failed: 0, bounced: 0, skipped: 0 };
  for (const r of rows) t[r.status] += r.count;
  return { ...t, total: t.sent + t.delivered + t.failed + t.bounced + t.skipped };
}

type Tone = 'warn' | 'alert' | undefined;

/** Is the app reaching people? The console's landing page — every count links to the Deliveries it counted. */
export default function NotificationsOverviewPage() {
  const { platform, tenantId } = useNotificationScope();
  const [window, setWindow] = useState<StatsWindow>('7d');
  const period = PERIODS.find((p) => p.value === window)!;

  const stats = useQuery({
    queryKey: ['notification-stats', window, tenantId ?? null],
    queryFn: () => notificationApi.stats(window, viewerTimeZone(), tenantId),
  });
  const gaps = useQuery({ queryKey: ['notification-gaps'], queryFn: () => notificationApi.coverageGaps() });
  const types = useQuery({ queryKey: ['notification-types'], queryFn: () => notificationApi.types(), staleTime: 5 * 60_000 });

  const s = stats.data;
  // A link to Deliveries over exactly the window the numbers were counted in, plus a field or two.
  const link = (fields: TriggerParams = {}) =>
    notificationLinks.deliveries({
      queryId: notificationQueryIds.advancedFilter,
      params: { ...(tenantId ? { tenantId } : {}), ...(s ? { attemptedRange: { from: new Date(s.since), to: new Date(s.until) } } : {}), ...fields },
    });

  const totals = byStatus(s?.byChannel ?? []);
  const reasonCount = (code: string) => s?.byReason.find((r) => r.reason === code)?.count ?? 0;
  const undeclared = (types.data ?? []).filter((t) => !t.declared);
  // A default route's gap reaches every tenant; a picked tenant sees its own and those. A type nothing declares shows
  // once, as a leftover route — not again for the template it lacks.
  const shownGaps = (gaps.data ?? []).filter(
    (g) => (!tenantId || g.tenantId === null || g.tenantId === tenantId) && !undeclared.some((t) => t.name === g.notificationType),
  );
  const configIssues = gaps.data && types.data ? shownGaps.length + undeclared.length : undefined;

  const tiles: Array<{ key: string; label: string; value: number | undefined; caption: string; tone?: Tone; href?: string }> = [
    { key: 'sends', label: 'Sends', value: s && totals.total, caption: 'delivery attempts, all channels', href: link() },
    {
      key: 'reached',
      label: 'Reached',
      value: s && totals.sent + totals.delivered,
      caption: s ? `${pct(totals.sent + totals.delivered, totals.total)}% — ${formatCount(totals.delivered)} confirmed delivered` : '',
    },
    {
      key: 'failed',
      label: 'Failed',
      value: s && totals.failed + totals.bounced,
      caption: s ? `${formatCount(totals.failed)} failed · ${formatCount(totals.bounced)} bounced` : '',
      tone: totals.failed + totals.bounced > 0 ? 'alert' : undefined,
    },
    {
      key: 'skipped',
      label: 'Skipped',
      value: s && totals.skipped,
      caption: s ? `${formatCount(reasonCount('suppressed'))} suppressed · ${formatCount(reasonCount('opted_out'))} opted out` : '',
      href: link({ status: 'skipped' }),
    },
    {
      key: 'gaps',
      label: 'Config gaps',
      value: configIssues,
      caption: 'will fail the next send',
      tone: configIssues ? 'warn' : undefined,
    },
  ];

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Notifications</PageTitle>
          <PageSubtitle>
            Is the app reaching people{tenantId ? ` in ${tenantName(tenantId)}` : ''}? What failed, why — and what will fail the next send.
          </PageSubtitle>
        </PageHeaderGroup>
        <PageHeaderAction className="flex w-fit flex-wrap gap-2">
          <TenantPicker />
          {platform && (
            <Button variant="secondary" asChild>
              <Link href={notificationLinks.retention()}>
                <LuDatabase />
                Volume &amp; Retention
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href={notificationLinks.deliveries()}>Go to Deliveries</Link>
          </Button>
        </PageHeaderAction>
      </PageHeader>
      <DashboardContent>
        <SegmentControl segments={PERIODS} value={window} onValueChange={(v) => setWindow(v as StatsWindow)} />

        <WithError>
          <ErrorState if={stats.isError}>
            <Card>
              <CardPanel>
                <ErrorMessage title="Failed to load the numbers" error={stats.error} onRetry={() => stats.refetch()} />
              </CardPanel>
            </Card>
          </ErrorState>
          <NormalState if={!stats.isError}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {tiles.map(({ key, ...tile }) => (
                <StatTile key={key} {...tile} />
              ))}
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-6">
                <ChannelsCard stats={s} isLoading={stats.isLoading} link={link} />
              </div>
              <div className="col-span-12 lg:col-span-6">
                <ReasonsCard stats={s} isLoading={stats.isLoading} link={link} />
              </div>
              <div className="col-span-12 lg:col-span-6">
                <TypesCard stats={s} isLoading={stats.isLoading} link={link} />
              </div>
              <div className="col-span-12 lg:col-span-6">
                <ConfigHealthCard
                  gaps={shownGaps}
                  undeclared={undeclared}
                  isLoading={gaps.isLoading || types.isLoading}
                  error={gaps.isError ? gaps : types.isError ? types : null}
                />
              </div>
              <div className="col-span-12">
                <PerDayCard stats={s} period={period.label} link={link} />
              </div>
            </div>
          </NormalState>
        </WithError>
      </DashboardContent>
    </>
  );
}

function StatTile({ label, value, caption, tone, href }: { label: string; value: number | undefined; caption: string; tone?: Tone; href?: string }) {
  const card = (
    <Card className="h-full">
      <CardPanel>
        <KpiTile>
          <KpiLabel className="flex items-center justify-between gap-2">
            {label}
            {href && <LuArrowUpRight className="text-muted-foreground group-hover:text-foreground size-3.5 shrink-0 transition-colors" />}
          </KpiLabel>
          {/* Right under the label, not pinned to the bottom — a caption that wraps would push it out of line. */}
          <div className="pt-4">
            <WithSkeleton>
              <SkeletonState if={value === undefined}>
                <Skeleton className="h-8 w-24" />
              </SkeletonState>
              <NormalState if={value !== undefined}>
                <KpiValue className={cn(tone === 'warn' && 'text-orange-600 dark:text-orange-400', tone === 'alert' && 'text-negative')}>
                  {formatCount(value ?? 0)}
                </KpiValue>
              </NormalState>
            </WithSkeleton>
          </div>
          <KpiCaption className="text-muted-foreground/60 mt-1 text-[0.6875rem]">{caption}</KpiCaption>
        </KpiTile>
      </CardPanel>
    </Card>
  );
  return href ? (
    <Link
      href={href}
      aria-label={`${label} — open in Deliveries`}
      className="group focus-visible:outline-primary block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {card}
    </Link>
  ) : (
    <div className="h-full">{card}</div>
  );
}

interface CardProps {
  stats: DeliveryStats | undefined;
  isLoading: boolean;
  link: (fields?: TriggerParams) => string;
}

/** Reached, waiting, failed and skipped per channel — the worst one says so in red. */
function ChannelsCard({ stats, isLoading, link }: CardProps) {
  const rows = NOTIFICATION_CHANNELS.map((channel) => ({
    channel,
    ...byStatus((stats?.byChannel ?? []).filter((r) => r.channel === channel)),
  })).filter((r) => r.total > 0);

  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle>By channel</CardHeaderTitle>
        <CardHeaderSubtitle>Reached · waiting for the provider · failed · skipped</CardHeaderSubtitle>
      </CardHeader>
      <CardPanel>
        {rows.length > 0 && (
          <CardList columns="minmax(0,1fr)">
            {rows.map((r) => {
              const failed = r.failed + r.bounced;
              const reached = r.sent + r.delivered;
              const worse = failed > reached;
              const parts = { delivered: r.delivered, sent: r.sent, failed, skipped: r.skipped };
              return (
                <CardListItem key={r.channel}>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardListLink href={link({ channel: r.channel })}>
                        {channelLabel(r.channel)} · {formatCount(r.total)}
                      </CardListLink>
                      {worse ? (
                        <SimpleBadge variant="red">{pct(failed, r.total)}% failed</SimpleBadge>
                      ) : (
                        <span className="text-muted-foreground text-xs">{pct(reached, r.total)}% reached</span>
                      )}
                    </div>
                    <div className="bg-muted flex h-2 overflow-hidden rounded-full">
                      {SEGMENTS.map((seg) => (
                        <div key={seg.key} className={seg.className} style={{ width: `${(parts[seg.key] / r.total) * 100}%` }} />
                      ))}
                    </div>
                  </div>
                </CardListItem>
              );
            })}
          </CardList>
        )}
        <DataTableLoadingBody isLoading={isLoading} className="h-48" />
        <DataTableEmptyBody isLoading={isLoading} isEmpty={!!stats && rows.length === 0} title="Nothing sent" description="Try a longer period." className="h-48" />
      </CardPanel>
      <CardFooter className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {SEGMENTS.map((seg) => (
          <span key={seg.key} className="flex items-center gap-1.5">
            <span className={cn('size-2 rounded-full', seg.className)} />
            {seg.label}
          </span>
        ))}
      </CardFooter>
    </Card>
  );
}

/** Failed and skipped sends by reason, most first — each opens exactly the sends it counted. */
function ReasonsCard({ stats, isLoading, link }: CardProps) {
  const rows = stats?.byReason ?? [];
  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle>Why sends failed</CardHeaderTitle>
        <CardHeaderSubtitle>Failed, bounced and skipped, by reason — and what kind of fix it needs</CardHeaderSubtitle>
      </CardHeader>
      <CardPanel>
        {rows.length > 0 && (
          <CardList columns="minmax(0,1fr) auto" visibleRows={7}>
            {rows.map((r) => {
              const kind = reasonKind(r.reason);
              const badge = kind ? REASON_KIND_BADGE[kind] : null;
              // A bounce is one group — its reason is the provider's own text — so it's filtered by status alone.
              const fields = r.status === 'bounced' ? { status: 'bounced' } : { status: r.status, reason: r.reason };
              return (
                <CardListItem key={`${r.status}-${r.reason}`}>
                  <div>
                    <CardListLink href={link(fields)}>{reasonTitle(r.reason)}</CardListLink>
                    {badge && (
                      <div className="mt-1">
                        <SimpleBadge variant={badge.variant}>{badge.label}</SimpleBadge>
                      </div>
                    )}
                  </div>
                  <div className="self-start text-right font-mono tabular-nums">{formatCount(r.count)}</div>
                </CardListItem>
              );
            })}
          </CardList>
        )}
        <DataTableLoadingBody isLoading={isLoading} className="h-48" />
        <DataTableEmptyBody
          isLoading={isLoading}
          isEmpty={!!stats && rows.length === 0}
          title="Nothing failed"
          description="Every send in the period went out."
          className="h-48"
        />
      </CardPanel>
    </Card>
  );
}

/** Each type's failure rate, the worst first; types that never failed are counted, not listed. */
function TypesCard({ stats, isLoading, link }: CardProps) {
  const all = useMemo(() => {
    const names = [...new Set((stats?.byType ?? []).map((r) => r.notificationType))];
    return names
      .map((name) => {
        const t = byStatus((stats?.byType ?? []).filter((r) => r.notificationType === name));
        return { name, total: t.total, failed: t.failed + t.bounced };
      })
      .sort((a, b) => b.failed / b.total - a.failed / a.total || b.failed - a.failed);
  }, [stats]);
  const failing = all.filter((t) => t.failed > 0);
  const quiet = all.length - failing.length;

  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle>By type</CardHeaderTitle>
        <CardHeaderSubtitle>Failure rate — the worst first</CardHeaderSubtitle>
      </CardHeader>
      <CardPanel>
        {failing.length > 0 && (
          <CardList columns="minmax(0,1fr) auto" visibleRows={6}>
            {failing.map((t) => (
              <CardListItem key={t.name}>
                <CardListLink href={link({ notificationType: t.name })}>{t.name}</CardListLink>
                <div className="text-right tabular-nums">
                  {formatCount(t.failed)} <span className="text-muted-foreground">of {formatCount(t.total)} failed</span>
                </div>
              </CardListItem>
            ))}
          </CardList>
        )}
        <DataTableLoadingBody isLoading={isLoading} className="h-48" />
        <DataTableEmptyBody
          isLoading={isLoading}
          isEmpty={!!stats && failing.length === 0}
          title="No type failed"
          description={all.length ? `${plural(all.length, 'type', 'types')} sent, all of it went out.` : 'Nothing was sent in the period.'}
          className="h-48"
        />
      </CardPanel>
      {failing.length > 0 && quiet > 0 && (
        <CardFooter className="text-muted-foreground text-xs">{plural(quiet, 'more type', 'more types')} without failures</CardFooter>
      )}
    </Card>
  );
}

const GAP_BADGE: Record<CoverageGap['kind'], string> = { missing_template: 'no template', missing_provider_credential: 'no account' };

/** Holes in the configuration that will fail the next send — and routes for types nothing sends any more. */
function ConfigHealthCard({
  gaps,
  undeclared,
  isLoading,
  error,
}: {
  gaps: CoverageGap[];
  undeclared: NotificationTypeSummary[];
  isLoading: boolean;
  error: { error: Error | null; refetch: () => unknown } | null;
}) {
  const empty = !isLoading && !error && gaps.length === 0 && undeclared.length === 0;
  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle>Configuration health</CardHeaderTitle>
        <CardHeaderSubtitle>Holes that will fail the next send — checked for every tenant a route reaches</CardHeaderSubtitle>
      </CardHeader>
      <CardPanel>
        {!isLoading && !error && !empty && (
          <CardList columns="minmax(0,1fr) auto" visibleRows={6}>
            {gaps.map((g) => (
              <CardListItem key={`${g.notificationType}-${g.channel}-${g.tenantId}-${g.kind}`}>
                <div>
                  <div>
                    {g.notificationType} · {channelLabel(g.channel)}
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    {g.tenantId ? `${tenantName(g.tenantId)}'s own route` : 'The default route — every tenant'}
                  </div>
                </div>
                <div className="self-start text-right">
                  <SimpleBadge variant="orange">{GAP_BADGE[g.kind]}</SimpleBadge>
                </div>
              </CardListItem>
            ))}
            {undeclared.map((t) => (
              <CardListItem key={t.name}>
                <div>
                  <div>
                    {t.name} · {t.defaultChannels.map(channelLabel).join(', ')}
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">A leftover route — this app no longer declares the type; nothing sends it</div>
                </div>
                <div className="self-start text-right">
                  <SimpleBadge variant="secondary">not declared</SimpleBadge>
                </div>
              </CardListItem>
            ))}
          </CardList>
        )}
        <DataTableLoadingBody isLoading={isLoading} className="h-48" />
        <DataTableErrorBody isError={!!error} error={error?.error} onRetry={() => error?.refetch()} className="h-48" />
        <DataTableEmptyBody
          isLoading={isLoading}
          isEmpty={empty}
          title="Every route can be sent"
          description="Each routed channel has a template and a provider account."
          className="h-48"
        />
      </CardPanel>
    </Card>
  );
}

/** Sends per day in the viewer's zone, failures on top — a day's column opens its sends. */
function PerDayCard({ stats, period, link }: { stats: DeliveryStats | undefined; period: string; link: (fields?: TriggerParams) => string }) {
  const rows = (stats?.byDay ?? []).map((d) => ({ day: d.day, ok: d.count - d.failed, failed: d.failed }));
  // One day on the viewer's calendar — the date as both ends, exactly what picking it in the form does.
  const dayLink = (day: string) => link({ attemptedRange: { from: day, to: day } });
  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle>Sends per day</CardHeaderTitle>
        <CardHeaderSubtitle>{period}, your time zone — failed on top</CardHeaderSubtitle>
      </CardHeader>
      <CardPanel>
        <div className="p-5">
          <WithSkeleton>
            <SkeletonState if={!stats}>
              <Skeleton className="h-56 w-full" />
            </SkeletonState>
            <NormalState if={!!stats}>
              <ChartContainer config={chartConfig} className="h-56 w-full">
                <BarChart data={rows} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} strokeWidth={0.5} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(d: string) => formatDateTime(d, { style: 'short' })} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={40} allowDecimals={false} tickFormatter={(v: number) => formatCount(v)} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(day) => formatDateTime(String(day))}
                        formatter={(v, name) => [formatCount(Number(v)), ` ${chartConfig[String(name)]?.label ?? name}`]}
                      />
                    }
                  />
                  <Bar dataKey="ok" stackId="day" fill="var(--color-ok)" />
                  <Bar
                    dataKey="failed"
                    stackId="day"
                    fill="var(--color-failed)"
                    radius={[3, 3, 0, 0]}
                    shape={<ChartBarLink href={(row: { day: string }) => dayLink(row.day)} />}
                  />
                </BarChart>
              </ChartContainer>
            </NormalState>
          </WithSkeleton>
        </div>
      </CardPanel>
    </Card>
  );
}
