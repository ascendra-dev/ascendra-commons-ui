'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LuHandshake, LuShieldAlert, LuUsers } from 'react-icons/lu';
import Link from 'next/link';
import {
  Button,
  Card,
  CardFooter,
  CardFooterIcon,
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
  useBackTo,
} from '@/ascendra-ui';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  authorizationApi,
  authorizationLinks,
  authorizationQueryIds,
  expiresSoon,
  personLabel,
  usePeopleNames,
} from '@/ascendra-commons-ui/authorization.ui';
import { Tile } from './_tile';
import { TenantPicker, useAccessScope } from './_scope';

const PERIODS = [
  { value: 'day', label: 'Past 24 hours', days: 1 },
  { value: 'week', label: 'Past 7 days', days: 7 },
  { value: 'month', label: 'Past 30 days', days: 30 },
] as const;
type Period = (typeof PERIODS)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The window a denial number was counted over, as the Denied requests filter's range — anchored to when the numbers
 * were fetched (`dataUpdatedAt`), never render time, so the list shows exactly what the number counted.
 */
const deniedRange = (asOf: number, days: number) => ({ from: new Date(asOf - days * DAY_MS), to: new Date(asOf) });

/** "Who holds what" shows this many roles, then scrolls. */
const ROLES_VISIBLE = 6;

/** A list item worth a look — what it is, why, and where it opens. */
interface LookItem {
  key: string;
  title: string;
  meta: string;
  badge: { label: string; variant: 'red' | 'orange' | 'blue' };
  href: string;
}

/** The landing screen — what needs a look in who-can-do-what. Posture is "now"; the period applies to denied requests. */
export default function AccessOverviewPage() {
  const { platform, tenantId } = useAccessScope();
  const backTo = useBackTo('overview');
  const [periodValue, setPeriodValue] = useState<Period['value']>('week');
  const period = PERIODS.find((p) => p.value === periodValue)!;

  const stats = useQuery({ queryKey: ['authz-stats', tenantId], queryFn: () => authorizationApi.stats(tenantId) });
  const denials = useQuery({
    queryKey: ['authz-denial-summary', tenantId, period.value],
    queryFn: () => authorizationApi.denialSummary(period.days, tenantId),
  });
  const lapsed = useQuery({
    queryKey: ['authz-lapsed', tenantId],
    queryFn: () => authorizationApi.findDelegations({ status: 'lapsed', ...(tenantId ? { tenantId } : {}) }, 5),
  });
  const ending = useQuery({
    queryKey: ['authz-delegations-expiring', tenantId],
    queryFn: () => authorizationApi.findDelegations({ status: 'expiring', ...(tenantId ? { tenantId } : {}) }, 5),
  });
  const roleEnds = useQuery({ queryKey: ['authz-assignments-expiring', tenantId], queryFn: () => authorizationApi.expiringAssignments(tenantId) });

  const s = stats.data;
  const ids = useMemo(
    () => [
      ...(lapsed.data?.data ?? []).flatMap((d) => [d.granterId, d.granteeId]),
      ...(ending.data?.data ?? []).flatMap((d) => [d.granterId, d.granteeId]),
      ...(roleEnds.data ?? []).map((a) => a.userId),
      ...(denials.data?.topActors ?? []).slice(0, 3).map((a) => a.actorId),
    ],
    [lapsed.data, ending.data, roleEnds.data, denials.data],
  );
  const names = usePeopleNames(ids);
  const who = (id: string) => personLabel(id, names);

  const look: LookItem[] = [
    ...(lapsed.data?.data ?? []).map((d) => ({
      key: `lapsed-${d.id}`,
      title: `${who(d.granterId)} → ${who(d.granteeId)} lends ${d.lapsedActions.join(', ')}`,
      meta: `${who(d.granterId)} no longer holds it — the delegation grants nothing for it · revoke it, or give the role back`,
      badge: { label: 'lapsed', variant: 'red' as const },
      href: backTo(authorizationLinks.delegations({ queryId: authorizationQueryIds.delegationsFilter, params: { status: 'lapsed' } })),
    })),
    ...(roleEnds.data ?? []).map((a) => ({
      key: `role-${a.userId}-${a.roleId}-${a.tenantId}`,
      title: `${who(a.userId)} · ${a.roleId}`,
      meta: `ends ${formatDateTime(a.expiresAt!, { style: 'medium' })} · renew it from their page, or let it lapse`,
      badge: { label: expiresSoon(a.expiresAt) ?? 'expiring', variant: 'orange' as const },
      href: backTo(authorizationLinks.person(a.userId)),
    })),
    ...(ending.data?.data ?? [])
      .filter((d) => d.lapsedActions.length === 0)
      .map((d) => ({
        key: `ending-${d.id}`,
        title: `${who(d.granterId)} → ${who(d.granteeId)} lends ${d.actions.join(', ')}`,
        meta: d.reason ? `“${d.reason}”` : 'no reason given',
        badge: { label: expiresSoon(d.expiresAt) ?? 'expiring', variant: 'orange' as const },
        href: backTo(authorizationLinks.delegations({ queryId: authorizationQueryIds.delegationsFilter, params: { status: 'expiring' } })),
      })),
    ...(denials.data?.topActors ?? []).slice(0, 3).map((a) => ({
      key: `denied-${a.actorId}`,
      title: `${who(a.actorId)} refused ${formatCount(a.count)} ${a.count === 1 ? 'time' : 'times'}`,
      meta: `${a.actions} ${a.actions === 1 ? 'action' : 'actions'} · ${period.label.toLowerCase()} · a missing grant, or curiosity`,
      badge: { label: 'refused', variant: 'blue' as const },
      href: backTo(authorizationLinks.denialsLog({ queryId: authorizationQueryIds.denialsFilter, params: { actorId: a.actorId, deniedRange: deniedRange(denials.dataUpdatedAt, period.days) } })),
    })),
  ];

  const roleRows = [...(s?.roleHolders ?? [])].sort((a, b) => b.holders - a.holders || a.roleId.localeCompare(b.roleId));
  const most = roleRows[0]?.holders ?? 0;
  const lookLoading = lapsed.isLoading || ending.isLoading || roleEnds.isLoading || denials.isLoading;
  const lookError = lapsed.isError ? lapsed : ending.isError ? ending : roleEnds.isError ? roleEnds : null;

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Access</PageTitle>
          <PageSubtitle>Who can do what — what&apos;s about to lapse, what no longer grants, who keeps getting refused.</PageSubtitle>
        </PageHeaderGroup>
        <PageHeaderAction className="flex w-fit gap-2">
          <TenantPicker />
          <Button variant="secondary" asChild>
            <Link href={backTo(authorizationLinks.delegations())}>
              <LuHandshake />
              Delegations
            </Link>
          </Button>
          <Button asChild>
            <Link href={backTo(authorizationLinks.people())}>
              <LuUsers />
              People
            </Link>
          </Button>
        </PageHeaderAction>
      </PageHeader>
      <DashboardContent>
        {/* The period picker, and what it applies to — page-wide, so it sits beside the picker. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentControl segments={PERIODS} value={period.value} onValueChange={(v) => setPeriodValue(v as Period['value'])} />
          <SimpleBadge>
            <LuShieldAlert />
            The period applies to denied requests
          </SimpleBadge>
        </div>

        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${platform ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          <Tile
            label="People"
            value={s?.users ?? null}
            caption={s ? `${formatCount(s.usersWithRole)} with a role` : '…'}
            href={backTo(authorizationLinks.people({ queryId: authorizationQueryIds.everyone }))}
            loading={stats.isLoading}
          />
          <Tile
            label="Without a role"
            value={s?.usersWithoutRole ?? null}
            caption="signed up, can do nothing yet"
            tone={s?.usersWithoutRole ? 'warn' : undefined}
            href={backTo(authorizationLinks.people({ queryId: authorizationQueryIds.peopleFilter, params: { roleless: 'true' } }))}
            loading={stats.isLoading}
          />
          <Tile
            label="Active delegations"
            value={s?.activeDelegations ?? null}
            caption={s ? `${formatCount(s.delegationsExpiring7d)} ending within 7 days` : '…'}
            href={backTo(authorizationLinks.delegations({ queryId: authorizationQueryIds.activeDelegations }))}
            loading={stats.isLoading}
          />
          <Tile
            label="Lapsed delegations"
            value={s?.lapsedDelegations ?? null}
            caption="lend what the lender lost"
            tone={s?.lapsedDelegations ? 'alert' : undefined}
            href={backTo(authorizationLinks.delegations({ queryId: authorizationQueryIds.delegationsFilter, params: { status: 'lapsed' } }))}
            loading={stats.isLoading}
          />
          {/* A count of assignments, not people — no list filters by expiry, so it doesn't link; Needs a look lists them. */}
          <Tile label="Roles ending" value={s?.assignmentsExpiring7d ?? null} caption="role assignments, within 7 days" loading={stats.isLoading} />
          <Tile
            label="Denied requests"
            value={denials.data?.total ?? null}
            caption={denials.data ? `by ${formatCount(denials.data.actors)} ${denials.data.actors === 1 ? 'person' : 'people'} · ${period.label.toLowerCase()}` : '…'}
            href={denials.data && backTo(authorizationLinks.denialsLog({ queryId: authorizationQueryIds.denialsFilter, params: { deniedRange: deniedRange(denials.dataUpdatedAt, period.days) } }))}
            loading={denials.isLoading}
          />
          {platform && (
            <Tile
              label="Platform access"
              value={s?.platformHolders ?? null}
              caption="people holding a platform-wide role"
              loading={stats.isLoading}
            />
          )}
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-6">
            <Card collapseable="expanded" maximizable>
              <CardHeader>
                <CardHeaderTitle>Who holds what</CardHeaderTitle>
                <CardHeaderSubtitle>Active holders per role · most first</CardHeaderSubtitle>
              </CardHeader>
              <CardPanel>
                {roleRows.length > 0 && (
                  <CardList columns="3fr auto 2fr" visibleRows={ROLES_VISIBLE}>
                    {roleRows.map((r) => (
                      <CardListItem key={r.roleId}>
                        <div>
                          <CardListLink href={backTo(authorizationLinks.role(r.roleId))}>
                            <SimpleBadge>{r.roleId}</SimpleBadge>
                          </CardListLink>
                        </div>
                        <div className="text-right font-mono tabular-nums">{formatCount(r.holders)}</div>
                        <div>
                          <div className="bg-muted h-2 overflow-hidden rounded-full">
                            <div className="h-full rounded-full bg-sky-500/70" style={{ width: `${most ? (r.holders / most) * 100 : 0}%` }} />
                          </div>
                        </div>
                      </CardListItem>
                    ))}
                  </CardList>
                )}
                <DataTableLoadingBody isLoading={stats.isLoading} className="h-65" />
                <DataTableErrorBody isError={stats.isError} error={stats.error} onRetry={() => stats.refetch()} className="h-65" />
                <DataTableEmptyBody isLoading={stats.isLoading} isEmpty={!!s && roleRows.length === 0} title="Nobody holds a role" description="Give people roles from People." className="h-65" />
              </CardPanel>
              {platform && !tenantId ? null : (
                <CardFooter>
                  <CardFooterIcon />
                  <span>{s ? `${formatCount(s.platformHolders)} platform staff hold a global role here too — they act in every tenant.` : ''}</span>
                </CardFooter>
              )}
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <Card collapseable="expanded" maximizable>
              <CardHeader>
                <CardHeaderTitle>Needs a look</CardHeaderTitle>
                <CardHeaderSubtitle>Lapsed and ending access, the most refused people</CardHeaderSubtitle>
              </CardHeader>
              <CardPanel>
                {look.length > 0 && (
                  <CardList columns="minmax(0,1fr)" visibleRows={ROLES_VISIBLE}>
                    {look.map((item) => (
                      <CardListItem key={item.key}>
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <CardListLink href={item.href} className="truncate text-sm font-medium">
                              {item.title}
                            </CardListLink>
                            <SimpleBadge variant={item.badge.variant}>{item.badge.label}</SimpleBadge>
                          </div>
                          <div className="text-muted-foreground mt-1 truncate text-xs" title={item.meta}>
                            {item.meta}
                          </div>
                        </div>
                      </CardListItem>
                    ))}
                  </CardList>
                )}
                <DataTableLoadingBody isLoading={lookLoading} className="h-65" />
                <DataTableErrorBody isError={!!lookError} error={lookError?.error} onRetry={() => lookError?.refetch()} className="h-65" />
                <DataTableEmptyBody isLoading={lookLoading} isEmpty={!lookLoading && look.length === 0} title="Nothing needs a look" description="No lapsed or ending access, and nobody was refused." className="h-65" />
              </CardPanel>
            </Card>
          </div>
        </div>
      </DashboardContent>
    </>
  );
}
