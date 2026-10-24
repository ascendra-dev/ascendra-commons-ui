'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { LuShieldAlert } from 'react-icons/lu';
import {
  Button,
  Card,
  CardHeader,
  CardHeaderSubtitle,
  CardHeaderTitle,
  CardList,
  CardListItem,
  CardListLink,
  CardPanel,
  DashboardContent,
  DataTableEmptyBody,
  DataTableErrorBody,
  DataTableLoadingBody,
  PageHeader,
  PageHeaderAction,
  PageHeaderGroup,
  PageSubtitle,
  PageTitle,
  SegmentControl,
  SimpleBadge,
} from '@/ascendra-ui';
import { formatCount } from '@/ascendra-ui/utils/common.util';
import {
  authorizationApi,
  authorizationLinks,
  authorizationQueryIds,
  personLabel,
  usePeopleNames,
} from '@/ascendra-commons-ui/authorization.ui';
import { TenantPicker, useAccessScope } from '../_scope';
import { tenantName } from '../tenants';

const PERIODS = [
  { value: 'day', label: 'Past 24 hours', days: 1 },
  { value: 'week', label: 'Past 7 days', days: 7 },
  { value: 'month', label: 'Past 30 days', days: 30 },
] as const;
type Period = (typeof PERIODS)[number];

/** The ranked panels show this many, then scroll. */
const TOP_VISIBLE = 5;

/**
 * Denied requests — who and what was refused most over a period: a missing grant shows up here before anyone files a
 * ticket; so does someone trying doors. Each row opens Refusals (the full list) filtered to what it counted.
 */
export default function AccessDenialsPage() {
  const { platform, tenantId } = useAccessScope();
  const [periodValue, setPeriodValue] = useState<Period['value']>('week');
  const period = PERIODS.find((p) => p.value === periodValue)!;
  const summary = useQuery({
    queryKey: ['authz-denial-summary', tenantId, period.value],
    queryFn: () => authorizationApi.denialSummary(period.days, tenantId),
  });
  const names = usePeopleNames(useMemo(() => (summary.data?.topActors ?? []).map((a) => a.actorId), [summary.data]));
  // The panels' window, anchored to when they were fetched — each row link opens exactly what it counted.
  const range = { from: new Date(summary.dataUpdatedAt - period.days * 24 * 60 * 60 * 1000), to: new Date(summary.dataUpdatedAt) };
  const topAction = summary.data?.topActions[0]?.count ?? 0;

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Denied requests</PageTitle>
          <PageSubtitle>Who was refused what {tenantId ? `in ${tenantName(tenantId)}` : platform ? 'in every tenant' : 'here'} — a missing grant, or someone trying doors.</PageSubtitle>
        </PageHeaderGroup>
        <PageHeaderAction className="flex w-fit gap-2">
          {platform && <TenantPicker />}
          <Button asChild>
            <Link href={authorizationLinks.denialsLog()}>Go to Refusals</Link>
          </Button>
        </PageHeaderAction>
      </PageHeader>
      <DashboardContent>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentControl segments={PERIODS} value={period.value} onValueChange={(v) => setPeriodValue(v as Period['value'])} />
          {summary.data && (
            <SimpleBadge>
              <LuShieldAlert />
              {formatCount(summary.data.total)} refused · {formatCount(summary.data.actors)} {summary.data.actors === 1 ? 'person' : 'people'}
            </SimpleBadge>
          )}
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-6">
            <Card collapseable="expanded">
              <CardHeader>
                <CardHeaderTitle>Most refused</CardHeaderTitle>
                <CardHeaderSubtitle>{period.label} · the action they lacked</CardHeaderSubtitle>
              </CardHeader>
              <CardPanel>
                {summary.data && summary.data.topActions.length > 0 && (
                  <CardList columns="3fr auto 2fr" visibleRows={TOP_VISIBLE}>
                    {summary.data.topActions.map((a) => (
                      <CardListItem key={a.action}>
                        <div>
                          <CardListLink href={authorizationLinks.denialsLog({ queryId: authorizationQueryIds.denialsFilter, params: { action: a.action, deniedRange: range } })}>
                            <SimpleBadge>{a.action}</SimpleBadge>
                          </CardListLink>
                          <div className="text-muted-foreground mt-1 text-xs">{formatCount(a.actors)} {a.actors === 1 ? 'person' : 'people'}</div>
                        </div>
                        <div className="text-right self-start font-mono tabular-nums">{formatCount(a.count)}</div>
                        <div className="self-start">
                          <div className="bg-muted mt-1.5 h-2 overflow-hidden rounded-full">
                            <div className="bg-negative/60 h-full rounded-full" style={{ width: `${topAction ? (a.count / topAction) * 100 : 0}%` }} />
                          </div>
                        </div>
                      </CardListItem>
                    ))}
                  </CardList>
                )}
                <DataTableLoadingBody isLoading={summary.isLoading} className="h-56" />
                <DataTableErrorBody isError={summary.isError} error={summary.error} onRetry={() => summary.refetch()} className="h-56" />
                <DataTableEmptyBody isLoading={summary.isLoading} isEmpty={!!summary.data && summary.data.total === 0} title="Nothing refused" description="Try a longer period." className="h-56" />
              </CardPanel>
            </Card>
          </div>
          <div className="col-span-12 lg:col-span-6">
            <Card collapseable="expanded">
              <CardHeader>
                <CardHeaderTitle>Most refused people</CardHeaderTitle>
                <CardHeaderSubtitle>{period.label} · refusals and how many actions</CardHeaderSubtitle>
              </CardHeader>
              <CardPanel>
                {summary.data && summary.data.topActors.length > 0 && (
                  <CardList columns="minmax(0,1fr) auto" visibleRows={TOP_VISIBLE}>
                    {summary.data.topActors.map((a) => (
                      <CardListItem key={a.actorId}>
                        <div>
                          <CardListLink href={authorizationLinks.denialsLog({ queryId: authorizationQueryIds.denialsFilter, params: { actorId: a.actorId, deniedRange: range } })}>
                            {personLabel(a.actorId, names)}
                          </CardListLink>
                          <div className="text-muted-foreground mt-1 text-xs">
                            {a.actions} {a.actions === 1 ? 'action' : 'actions'}
                            {platform && !tenantId ? ` · ${a.tenantId ? tenantName(a.tenantId) : 'platform'}` : ''}
                          </div>
                        </div>
                        <div className="text-right self-start font-mono tabular-nums">{formatCount(a.count)}</div>
                      </CardListItem>
                    ))}
                  </CardList>
                )}
                <DataTableLoadingBody isLoading={summary.isLoading} className="h-56" />
                <DataTableEmptyBody isLoading={summary.isLoading} isEmpty={!!summary.data && summary.data.total === 0} title="Nobody refused" description="Try a longer period." className="h-56" />
              </CardPanel>
            </Card>
          </div>
        </div>
      </DashboardContent>
    </>
  );
}
