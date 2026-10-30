'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useQueries, useQuery } from '@tanstack/react-query';
import { LuArrowUpRight } from 'react-icons/lu';
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
  categoryStatus,
  fileStorageApi,
  fileStorageLinks,
  fileStorageQueryIds,
  formatBytes,
  pastRetention,
  REJECTION_REASONS,
  rejectionQueryIds,
  type FileCategorySummary,
  type FileStats,
  type StorageQuota,
  type StorageUsageRow,
} from '@/ascendra-commons-ui/file-storage.ui';
import { TenantPicker, useFileScope } from './_scope';
import { tenantName } from './tenants';

const PERIODS = [
  { value: '7', label: 'Past 7 days' },
  { value: '30', label: 'Past 30 days' },
  { value: '90', label: 'Past 90 days' },
];

/** The viewer's IANA zone — a "day" is a day on their calendar. */
const viewerTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const chartConfig: ChartConfig = {
  uploads: { label: 'Uploaded', color: 'var(--chart-1)' },
  rejected: { label: 'Refused', color: 'var(--color-red-500)' },
};

/** What the lists below read at most — a count past it reads "200+". */
const SCAN_LIMIT = 200;

/** A tenant this near its limit is called out. */
const NEAR_FULL = 0.9;

const plural = (n: number, one: string, many: string) => `${formatCount(n)} ${n === 1 ? one : many}`;

type Tone = 'warn' | 'alert' | undefined;

/** What came in, what was turned away and why, who's running out of space, and what's waiting on cleanup. */
export default function FilesOverviewPage() {
  const { platform, tenantId } = useFileScope();
  const [windowDays, setWindowDays] = useState('30');

  const stats = useQuery({
    queryKey: ['file-stats', windowDays, tenantId ?? null],
    queryFn: () => fileStorageApi.stats(Number(windowDays), viewerTimeZone(), tenantId),
  });
  const categories = useQuery({ queryKey: ['file-categories', tenantId ?? null], queryFn: () => fileStorageApi.categories(tenantId), staleTime: 60_000 });
  const retention = useQuery({ queryKey: ['file-retention', tenantId ?? null], queryFn: () => fileStorageApi.retention(tenantId) });

  const s = stats.data;
  const firstDay = s?.byDay[0]?.date;
  const lastDay = s?.byDay[s.byDay.length - 1]?.date;
  // Files over exactly the days the numbers were counted in, plus a field or two.
  const filesLink = (fields: TriggerParams = {}) =>
    fileStorageLinks.files({
      queryId: fileStorageQueryIds.advancedFilter,
      params: { ...(tenantId ? { tenantId } : {}), ...(firstDay && lastDay ? { uploadedRange: { from: firstDay, to: lastDay } } : {}), ...fields },
    });
  const rejectionsLink = (fields: TriggerParams = {}) =>
    fileStorageLinks.rejections({
      queryId: rejectionQueryIds.advancedFilter,
      params: { ...(tenantId ? { tenantId } : {}), ...(firstDay && lastDay ? { occurredRange: { from: firstDay, to: lastDay } } : {}), ...fields },
    });

  const reasonCount = (reason: keyof typeof REJECTION_REASONS) => s?.byRejectionReason.find((r) => r.reason === reason)?.count ?? 0;
  const refusedCaption = (Object.keys(REJECTION_REASONS) as Array<keyof typeof REJECTION_REASONS>)
    .filter((r) => reasonCount(r) > 0)
    .map((r) => `${formatCount(reasonCount(r))} ${REJECTION_REASONS[r].badge}`)
    .join(' · ');
  const v = retention.data;

  const tiles: Array<{ key: string; label: string; value: number | undefined; caption: string; tone?: Tone; href?: string }> = [
    { key: 'uploaded', label: 'Uploaded', value: s?.totals.uploads, caption: s ? `files · ${formatBytes(s.totals.bytes)}` : '', href: filesLink() },
    {
      key: 'refused',
      label: 'Refused',
      value: s?.totals.rejected,
      caption: s ? refusedCaption || 'nothing turned away' : '',
      tone: s?.totals.rejected ? 'alert' : undefined,
      href: rejectionsLink(),
    },
    {
      key: 'stored',
      label: 'Stored now',
      value: v?.files.count,
      caption: v ? `${formatBytes(v.files.totalBytes)}${v.files.oldestCreatedAt ? ` · oldest ${formatDateTime(v.files.oldestCreatedAt)}` : ''}` : '',
      href: fileStorageLinks.storage(),
    },
    {
      key: 'unscanned',
      label: 'Unscanned',
      value: s?.totals.unscannable,
      caption: "stored though the scanner couldn't read it",
      tone: s?.totals.unscannable ? 'warn' : undefined,
      href: filesLink({ scanVerdict: 'unscannable' }),
    },
    {
      key: 'held',
      label: 'On legal hold',
      value: v?.files.held,
      caption: "can't be deleted",
      href: fileStorageLinks.files({ queryId: fileStorageQueryIds.held, params: tenantId ? { tenantId } : {} }),
    },
  ];

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Files</PageTitle>
          <PageSubtitle>
            What came in{tenantId ? ` for ${tenantName(tenantId)}` : ''}, what was turned away and why, who is running out of space — and what&apos;s
            waiting on cleanup.
          </PageSubtitle>
        </PageHeaderGroup>
        <PageHeaderAction className="flex w-fit flex-wrap gap-2">
          <TenantPicker />
          <Button asChild>
            <Link href={fileStorageLinks.files()}>Go to Files</Link>
          </Button>
        </PageHeaderAction>
      </PageHeader>
      <DashboardContent>
        <SegmentControl segments={PERIODS} value={windowDays} onValueChange={setWindowDays} />

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
              <div className="col-span-12">
                <PerDayCard stats={s} period={PERIODS.find((p) => p.value === windowDays)!.label} link={(day) => filesLink({ uploadedRange: { from: day, to: day } })} />
              </div>
              <div className="col-span-12 lg:col-span-6">
                <TypesCard stats={s} categories={categories.data} isLoading={stats.isLoading} filesLink={filesLink} rejectionsLink={rejectionsLink} />
              </div>
              <div className="col-span-12 lg:col-span-6">
                <ReasonsCard stats={s} isLoading={stats.isLoading} rejectionsLink={rejectionsLink} />
              </div>
              <div className="col-span-12 lg:col-span-6">
                <StorageCard tenantId={tenantId} platform={platform} />
              </div>
              <div className="col-span-12 lg:col-span-6">
                <AttentionCard tenantId={tenantId} platform={platform} categories={categories.data} />
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
      aria-label={`${label} — open the list`}
      className="group focus-visible:outline-primary block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {card}
    </Link>
  ) : (
    <div className="h-full">{card}</div>
  );
}

/** Uploads per day in the viewer's zone, refusals on top — a day's column opens that day's files. */
function PerDayCard({ stats, period, link }: { stats: FileStats | undefined; period: string; link: (day: string) => string }) {
  const rows = stats?.byDay ?? [];
  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle>Uploads per day</CardHeaderTitle>
        <CardHeaderSubtitle>{period}, your time zone — refused on top</CardHeaderSubtitle>
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
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    minTickGap={16}
                    tickFormatter={(d: string) => formatDateTime(d, { style: 'short' })}
                  />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={40} allowDecimals={false} tickFormatter={(n: number) => formatCount(n)} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(day) => formatDateTime(String(day))}
                        formatter={(value, name) => [formatCount(Number(value)), ` ${chartConfig[String(name)]?.label ?? name}`]}
                      />
                    }
                  />
                  <Bar dataKey="uploads" stackId="day" fill="var(--color-uploads)" />
                  <Bar
                    dataKey="rejected"
                    stackId="day"
                    fill="var(--color-rejected)"
                    radius={[3, 3, 0, 0]}
                    shape={<ChartBarLink href={(row: { date: string }) => link(row.date)} />}
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

/** Each upload type's weight this period — uploaded, size, refused — and why a type with none is quiet. */
function TypesCard({
  stats,
  categories,
  isLoading,
  filesLink,
  rejectionsLink,
}: {
  stats: FileStats | undefined;
  categories: FileCategorySummary[] | undefined;
  isLoading: boolean;
  filesLink: (fields?: TriggerParams) => string;
  rejectionsLink: (fields?: TriggerParams) => string;
}) {
  const rows = useMemo(
    () => [...(stats?.byCategory ?? [])].sort((a, b) => b.fileCount - a.fileCount || b.rejected - a.rejected || a.category.localeCompare(b.category)),
    [stats],
  );
  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle>By upload type</CardHeaderTitle>
        <CardHeaderSubtitle>Uploaded · size · refused, this period</CardHeaderSubtitle>
      </CardHeader>
      <CardPanel>
        {rows.length > 0 && (
          <CardList columns="minmax(0,1fr) auto" visibleRows={7}>
            {rows.map((r) => {
              const c = categories?.find((x) => x.key === r.category);
              const status = c ? categoryStatus(c) : null;
              const note = !categories ? null : !c ? 'an integration sends a key the app doesn’t declare' : status === 'off' ? 'turned off for everyone' : status === 'tenant-off' ? 'turned off for this tenant' : null;
              return (
                <CardListItem key={r.category}>
                  <div>
                    {c ? (
                      <CardListLink href={filesLink({ category: r.category })}>{c.base.label}</CardListLink>
                    ) : (
                      <span className="font-mono text-xs">{r.category}</span>
                    )}
                    {categories && !c && (
                      <SimpleBadge variant="orange" className="ml-1.5">
                        not a type
                      </SimpleBadge>
                    )}
                    {(r.rejected > 0 || note) && (
                      <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-1.5 text-xs">
                        {r.rejected > 0 && (
                          <Link href={rejectionsLink({ category: r.category })} className="text-primary underline-offset-2 hover:underline">
                            {formatCount(r.rejected)} refused
                          </Link>
                        )}
                        {note && <span>{r.rejected > 0 ? `— ${note}` : note}</span>}
                      </div>
                    )}
                  </div>
                  <div className="self-start text-right tabular-nums">
                    {formatCount(r.fileCount)}
                    {r.fileCount > 0 && <span className="text-muted-foreground"> · {formatBytes(r.totalBytes)}</span>}
                  </div>
                </CardListItem>
              );
            })}
          </CardList>
        )}
        <DataTableLoadingBody isLoading={isLoading} className="h-48" />
        <DataTableEmptyBody isLoading={isLoading} isEmpty={!!stats && rows.length === 0} title="Nothing uploaded" description="Try a longer period." className="h-48" />
      </CardPanel>
      <CardFooter className="text-muted-foreground text-xs">
        <p>
          <Link href={fileStorageLinks.types()} className="text-primary underline-offset-2 hover:underline">
            All upload types
          </Link>{' '}
          — what each accepts and how long it&apos;s kept.
        </p>
      </CardFooter>
    </Card>
  );
}

/** Refusals by reason, most first — each opens exactly the refusals it counted. */
function ReasonsCard({ stats, isLoading, rejectionsLink }: { stats: FileStats | undefined; isLoading: boolean; rejectionsLink: (fields?: TriggerParams) => string }) {
  const rows = [...(stats?.byRejectionReason ?? [])].sort((a, b) => b.count - a.count);
  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle>Why uploads were refused</CardHeaderTitle>
        <CardHeaderSubtitle>This period, by reason — nothing was stored for these</CardHeaderSubtitle>
      </CardHeader>
      <CardPanel>
        {rows.length > 0 && (
          <CardList columns="minmax(0,1fr) auto">
            {rows.map((r) => {
              const meta = REJECTION_REASONS[r.reason];
              return (
                <CardListItem key={r.reason}>
                  <div>
                    <CardListLink href={rejectionsLink({ reason: r.reason })}>{meta.title}</CardListLink>
                    <div className="mt-1">
                      <SimpleBadge variant={meta.variant}>{meta.badge}</SimpleBadge>
                    </div>
                  </div>
                  <div className="self-start text-right font-mono tabular-nums">{formatCount(r.count)}</div>
                </CardListItem>
              );
            })}
          </CardList>
        )}
        <DataTableLoadingBody isLoading={isLoading} className="h-48" />
        <DataTableEmptyBody isLoading={isLoading} isEmpty={!!stats && rows.length === 0} title="Nothing refused" description="Every upload in the period was stored." className="h-48" />
      </CardPanel>
      <CardFooter className="text-muted-foreground text-xs">
        <p>
          <Link href={fileStorageLinks.rejections()} className="text-primary underline-offset-2 hover:underline">
            All refused uploads
          </Link>{' '}
          — newest first, with each one&apos;s reason.
        </p>
      </CardFooter>
    </Card>
  );
}

interface TenantStorage {
  tenantId: string;
  fileCount: number;
  usedBytes: number;
  quota: StorageQuota | null;
}

/** Per tenant: its files and bytes, and its limit — a quota's own count of what's used, since that's what it enforces. */
function byTenant(usage: StorageUsageRow[], quotas: StorageQuota[]): TenantStorage[] {
  const map = new Map<string, TenantStorage>();
  for (const row of usage) {
    const t = map.get(row.tenantId) ?? { tenantId: row.tenantId, fileCount: 0, usedBytes: 0, quota: null };
    t.fileCount += row.fileCount;
    t.usedBytes += row.totalBytes;
    map.set(row.tenantId, t);
  }
  for (const q of quotas) {
    const t = map.get(q.tenantId) ?? { tenantId: q.tenantId, fileCount: q.fileCount, usedBytes: q.usedBytes, quota: null };
    map.set(q.tenantId, { ...t, usedBytes: q.usedBytes, fileCount: q.fileCount, quota: q });
  }
  return [...map.values()].sort((a, b) => b.usedBytes - a.usedBytes);
}

/** Used against each tenant's limit — the fullest called out. A tenant admin sees its own. */
function StorageCard({ tenantId, platform }: { tenantId: string | undefined; platform: boolean }) {
  const usage = useQuery({ queryKey: ['file-storage-usage', tenantId ?? null], queryFn: () => fileStorageApi.storageUsage(tenantId) });
  const quotas = useQuery({ queryKey: ['file-quotas', tenantId ?? null], queryFn: () => fileStorageApi.quotas(tenantId) });
  const rows = usage.data && quotas.data ? byTenant(usage.data, quotas.data) : [];
  const isLoading = usage.isLoading || quotas.isLoading;
  const error = usage.isError ? usage : quotas.isError ? quotas : null;

  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle>Storage {platform && !tenantId ? 'by tenant' : ''}</CardHeaderTitle>
        <CardHeaderSubtitle>Used against the limit — an upload that would pass it is refused</CardHeaderSubtitle>
      </CardHeader>
      <CardPanel>
        {rows.length > 0 && (
          <CardList columns="minmax(0,1fr) auto" visibleRows={6}>
            {rows.map((t) => {
              const share = t.quota ? t.usedBytes / t.quota.maxBytes : 0;
              const full = share >= NEAR_FULL;
              return (
                <CardListItem key={t.tenantId}>
                  <div className="flex flex-col gap-2">
                    <div>
                      {tenantName(t.tenantId)} <span className="text-muted-foreground">· {plural(t.fileCount, 'file', 'files')}</span>
                    </div>
                    {t.quota && (
                      <div className="bg-muted flex h-2 overflow-hidden rounded-full">
                        <div className={full ? 'bg-red-500/80' : 'bg-primary/60'} style={{ width: `${Math.min(100, Math.max(1, share * 100))}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="self-start text-right tabular-nums">
                    {t.quota ? (
                      full ? (
                        <SimpleBadge variant="red">
                          {formatBytes(t.usedBytes)} of {formatBytes(t.quota.maxBytes)} — {Math.round(share * 100)}%
                        </SimpleBadge>
                      ) : (
                        <span>
                          {formatBytes(t.usedBytes)} <span className="text-muted-foreground">of {formatBytes(t.quota.maxBytes)}</span>
                        </span>
                      )
                    ) : (
                      <span>
                        {formatBytes(t.usedBytes)} <span className="text-muted-foreground">· no limit</span>
                      </span>
                    )}
                  </div>
                </CardListItem>
              );
            })}
          </CardList>
        )}
        <DataTableLoadingBody isLoading={isLoading} className="h-48" />
        <DataTableErrorBody isError={!!error} error={error?.error} onRetry={() => error?.refetch()} className="h-48" />
        <DataTableEmptyBody isLoading={isLoading} isEmpty={!isLoading && !error && rows.length === 0} title="Nothing stored" className="h-48" />
      </CardPanel>
      <CardFooter className="text-muted-foreground text-xs">
        <p>
          <Link href={fileStorageLinks.storage()} className="text-primary underline-offset-2 hover:underline">
            Storage &amp; limits
          </Link>{' '}
          — by upload type{platform ? ', and setting a limit' : ''}.
        </p>
      </CardFooter>
    </Card>
  );
}

/** What cleanup and the retention run are waiting on — each opens where it's dealt with. */
function AttentionCard({ tenantId, platform, categories }: { tenantId: string | undefined; platform: boolean; categories: FileCategorySummary[] | undefined }) {
  const retention = useQuery({ queryKey: ['file-retention', tenantId ?? null], queryFn: () => fileStorageApi.retention(tenantId) });
  const orphans = useQuery({ queryKey: ['file-orphans-count', tenantId ?? null], queryFn: () => fileStorageApi.orphans({ tenantId }, SCAN_LIMIT) });
  const duplicates = useQuery({ queryKey: ['file-duplicates', tenantId ?? null], queryFn: () => fileStorageApi.duplicates(tenantId) });
  // Held files are few — read them all to find the ones past their date (the run skips them).
  const held = useQuery({
    queryKey: ['file-held', tenantId ?? null],
    queryFn: () => fileStorageApi.findFiles({ held: 'held', ...(tenantId ? { tenantId } : {}) }, SCAN_LIMIT),
  });
  // Stray blobs are per bucket and the platform's to see — a bucket holds every tenant's bytes.
  const buckets = platform && !tenantId ? [...new Set((categories ?? []).map((c) => c.base.bucket))].sort() : [];
  const strays = useQueries({
    queries: buckets.map((bucket) => ({
      queryKey: ['file-stray-blobs', bucket],
      queryFn: () => fileStorageApi.strayBlobs(bucket),
      retry: false,
      staleTime: 5 * 60_000,
    })),
  });

  const v = retention.data;
  const orphanRows = orphans.data?.data ?? [];
  const orphanMore = !!orphans.data?.meta.nextCursor;
  const dupGroups = duplicates.data ?? [];
  const dupCopies = dupGroups.reduce((n, g) => n + g.fileCount - 1, 0);
  const dupWasted = dupGroups.reduce((n, g) => n + g.wastedBytes, 0);
  const heldPast = (held.data?.data ?? []).filter((f) => pastRetention(f)).length;
  const strayByBucket = buckets
    .map((bucket, i) => ({ bucket, count: strays[i]?.data?.data.length ?? 0, more: !!strays[i]?.data?.meta.nextCursor }))
    .filter((b) => b.count > 0);
  const isLoading = retention.isLoading || orphans.isLoading || duplicates.isLoading || held.isLoading;

  const items: Array<{ key: string; title: string; value: ReactNode; note: string; href: string }> = [];
  if (v && v.files.pastRetention > 0) {
    items.push({ key: 'past', title: 'Past their retention date', value: formatCount(v.files.pastRetention), note: 'the next retention run deletes them', href: fileStorageLinks.retention() });
  }
  if (v && v.files.expiringWithin30Days > 0) {
    items.push({ key: 'expiring', title: 'Expiring in the next 30 days', value: formatCount(v.files.expiringWithin30Days), note: 'the retention run deletes them on their date', href: fileStorageLinks.retention() });
  }
  if (orphanRows.length > 0) {
    items.push({
      key: 'orphans',
      title: 'Orphaned files',
      value: `${formatCount(orphanRows.length)}${orphanMore ? '+' : ''} · ${formatBytes(orphanRows.reduce((n, o) => n + o.sizeBytes, 0))}`,
      note: 'attached to nothing — purge them in Cleanup',
      href: fileStorageLinks.cleanup('orphans'),
    });
  }
  if (dupCopies > 0) {
    items.push({ key: 'duplicates', title: 'Duplicate copies', value: `${formatCount(dupCopies)} · ${formatBytes(dupWasted)}`, note: 'the same bytes uploaded again — reported, never merged', href: fileStorageLinks.cleanup('duplicates') });
  }
  for (const b of strayByBucket) {
    items.push({
      key: `stray-${b.bucket}`,
      title: `Stray blobs in ${b.bucket}`,
      value: `${formatCount(b.count)}${b.more ? '+' : ''}`,
      note: 'stored bytes no file record holds — a failed upload left them',
      href: fileStorageLinks.cleanup('stray-blobs', b.bucket),
    });
  }
  if (heldPast > 0) {
    items.push({ key: 'held-past', title: 'Held past their retention date', value: formatCount(heldPast), note: 'the run skips them until the hold is released', href: fileStorageLinks.files({ queryId: fileStorageQueryIds.held, params: tenantId ? { tenantId } : {} }) });
  }

  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle>Needs attention</CardHeaderTitle>
        <CardHeaderSubtitle>What cleanup and retention are waiting on — as of now</CardHeaderSubtitle>
      </CardHeader>
      <CardPanel>
        {!isLoading && items.length > 0 && (
          <CardList columns="minmax(0,1fr) auto">
            {items.map((item) => (
              <CardListItem key={item.key}>
                <div>
                  <CardListLink href={item.href}>{item.title}</CardListLink>
                  <div className="text-muted-foreground mt-1 text-xs">{item.note}</div>
                </div>
                <div className="self-start text-right tabular-nums">{item.value}</div>
              </CardListItem>
            ))}
          </CardList>
        )}
        <DataTableLoadingBody isLoading={isLoading} className="h-48" />
        <DataTableEmptyBody isLoading={isLoading} isEmpty={!isLoading && items.length === 0} title="Nothing waiting" description="No orphans, duplicates or files near their date." className="h-48" />
      </CardPanel>
    </Card>
  );
}

