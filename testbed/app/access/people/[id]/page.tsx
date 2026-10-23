'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LuSearchCheck, LuShieldPlus } from 'react-icons/lu';
import {
  BackLink,
  Button,
  Card,
  CardFooter,
  CardFooterIcon,
  CardHeader,
  CardHeaderSubtitle,
  CardHeaderTitle,
  CardPanel,
  DashboardContent,
  DataTableEmptyBody,
  DataTableErrorBody,
  DataTableLoadingBody,
  ErrorMessage,
  PageHeader,
  PageHeaderAction,
  PageHeaderGroup,
  PageSubtitle,
  PageTitle,
  SimpleBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
  TableWrapper,
  toast,
  WithTooltip,
  useBackTo,
} from '@/ascendra-ui';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  authorizationApi,
  authorizationLinks,
  authorizationQueryIds,
  DELEGATION_STATE,
  delegationState,
  expiresSoon,
  groupByModule,
  personLabel,
  useActionCatalog,
  usePeopleNames,
  type AccessExplanation,
  type Assignment,
  type Delegation,
} from '@/ascendra-commons-ui/authorization.ui';
import { AssignRoleDialog, useInvalidateAccess } from '../../_assign-dialog';
import { ConfirmDialog } from '../../_confirm';
import { useAccessScope } from '../../_scope';
import { tenantName } from '../../tenants';


/**
 * One person's access — the roles they were given (by whom, until when), what they can actually do and through what,
 * what they lent and were lent, and what they were refused. The place to give or take a role.
 */
export default function AccessPersonPage() {
  const { id } = useParams<{ id: string }>();
  const userId = decodeURIComponent(id);
  const { can, platform, actorId } = useAccessScope();
  const [giving, setGiving] = useState(false);
  const person = useQuery({ queryKey: ['authz-person', userId], queryFn: () => authorizationApi.person(userId) });
  const refused = useQuery({
    queryKey: ['authz-person-denials', userId],
    queryFn: () => authorizationApi.recentDenialsOf(userId, 7, 5),
  });
  const p = person.data;
  const backTo = useBackTo(p?.user.name ?? userId);
  const names = usePeopleNames(
    useMemo(() => [...(p?.assignments ?? []).map((a) => a.grantedBy ?? ''), ...(p?.delegations ?? []).flatMap((d) => [d.granterId, d.granteeId])].filter(Boolean), [p]),
  );

  if (person.isError) {
    return (
      <DashboardContent>
        <ErrorMessage title="Couldn't load this person" error={person.error} onRetry={() => person.refetch()} />
      </DashboardContent>
    );
  }

  return (
    <>
      <BackLink href={authorizationLinks.people()} label="People">Back to people</BackLink>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>{p?.user.name ?? userId}</PageTitle>
          <PageSubtitle>
            {p ? `${p.user.email ?? p.user.id} · ${p.user.tenantId ? tenantName(p.user.tenantId) : 'Platform staff'}` : ' '}
          </PageSubtitle>
        </PageHeaderGroup>
        <PageHeaderAction className="flex w-fit gap-2">
          <Button variant="secondary" asChild>
            <Link href={backTo(authorizationLinks.checker({ userId }))}>
              <LuSearchCheck />
              Check an action
            </Link>
          </Button>
          {can('authz.assign_roles') && (
            <Button onClick={() => setGiving(true)} disabled={!p}>
              <LuShieldPlus />
              Give a role
            </Button>
          )}
        </PageHeaderAction>
      </PageHeader>
      <DashboardContent>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-6">
            <RolesCard
              assignments={p?.assignments}
              loading={person.isLoading}
              names={names}
              canRevoke={can('authz.assign_roles')}
              platform={platform}
              self={actorId === userId}
            />
          </div>
          <div className="col-span-12 lg:col-span-6">
            <DelegationsCard userId={userId} delegations={p?.delegations} loading={person.isLoading} names={names} />
          </div>
          <div className="col-span-12 lg:col-span-6">
            <AccessCard access={p?.access} loading={person.isLoading} names={names} />
          </div>
          <div className="col-span-12 lg:col-span-6">
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableHeaderRow size="lg">
                    <TableHead colSpan={2}>
                      <CardHeaderTitle>Refused</CardHeaderTitle>
                      <CardHeaderSubtitle>Denied requests · past 7 days</CardHeaderSubtitle>
                    </TableHead>
                  </TableHeaderRow>
                </TableHeader>
                {refused.data && refused.data.data.length > 0 && (
                  <TableBody>
                    {refused.data.data.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="w-full max-w-0">
                          <SimpleBadge>{d.action}</SimpleBadge>
                          <div className="text-muted-foreground mt-1 truncate text-xs">
                            {formatDateTime(d.windowStart, { time: true })} · <span className="font-mono">{d.method} {d.route}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right align-top font-mono tabular-nums">{formatCount(d.count)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                )}
              </Table>
              <DataTableLoadingBody isLoading={refused.isLoading} className="h-40" />
              <DataTableErrorBody isError={refused.isError} error={refused.error} onRetry={() => refused.refetch()} className="h-40" />
              <DataTableEmptyBody isLoading={refused.isLoading} isEmpty={!!refused.data && refused.data.data.length === 0} title="Nothing refused" description="Nothing they tried this week was denied." className="h-40" />
              {refused.data && refused.data.data.length > 0 && (
                <CardFooter>
                  <CardFooterIcon />
                  <span>
                    <Link
                      className="underline underline-offset-2"
                      href={backTo(authorizationLinks.denials({
                        queryId: authorizationQueryIds.denialsFilter,
                        params: { actorId: userId, deniedRange: { from: new Date(refused.dataUpdatedAt - 7 * 24 * 60 * 60 * 1000), to: new Date(refused.dataUpdatedAt) } },
                      }))}
                    >
                      All their denied requests
                    </Link>
                  </span>
                </CardFooter>
              )}
            </TableWrapper>
          </div>
        </div>
      </DashboardContent>
      {giving && p && (
        <AssignRoleDialog open={giving} onOpenChange={setGiving} userIds={[userId]} label={p.user.name} tenantId={p.user.tenantId} />
      )}
    </>
  );
}

/** Their roles, active first, then expired; Revoke asks first and shows the API's refusal (the last admin, yourself). */
function RolesCard({
  assignments,
  loading,
  names,
  canRevoke,
  platform,
  self,
}: {
  assignments?: Assignment[];
  loading: boolean;
  names: ReadonlyMap<string, string>;
  canRevoke: boolean;
  platform: boolean;
  self: boolean;
}) {
  const [revoking, setRevoking] = useState<Assignment | null>(null);
  const invalidate = useInvalidateAccess();
  const revoke = useMutation({
    mutationFn: (a: Assignment) => authorizationApi.revoke(a.userId, a.roleId, a.tenantId),
    onSuccess: async (_v, a) => {
      toast.success(`${a.roleId} taken away`);
      setRevoking(null);
      await invalidate();
    },
    onError: (error, a) => toast.error(`Couldn't take away ${a.roleId}`, { description: error instanceof Error ? error.message : undefined }),
  });
  const rows = [...(assignments ?? [])].sort((a, b) => (a.status === b.status ? b.grantedAt.localeCompare(a.grantedAt) : a.status === 'active' ? -1 : 1));

  return (
    <TableWrapper>
      <Table>
        <TableHeader>
          <TableHeaderRow size="lg">
            <TableHead colSpan={2}>
              <CardHeaderTitle>Roles</CardHeaderTitle>
              <CardHeaderSubtitle>Given by · until · active first</CardHeaderSubtitle>
            </TableHead>
          </TableHeaderRow>
        </TableHeader>
        {rows.length > 0 && (
          <TableBody>
            {rows.map((a) => {
              const soon = expiresSoon(a.expiresAt);
              // A global role is the platform's — a tenant admin can't take it away.
              const revocable = canRevoke && a.status === 'active' && (platform || a.tenantId !== null);
              return (
                <TableRow key={`${a.roleId}-${a.tenantId}`}>
                  {/* Two columns — the card is narrow: the role and who gave it, then its end with the action. */}
                  <TableCell className="w-full max-w-0">
                    <div className="flex flex-wrap items-center gap-1">
                      <SimpleBadge variant={a.status === 'expired' ? 'secondary' : a.tenantId === null ? 'amber' : 'default'}>{a.roleId}</SimpleBadge>
                      {a.tenantId === null && <SimpleBadge variant="amber">all tenants</SimpleBadge>}
                      {a.status === 'expired' && <SimpleBadge variant="secondary">expired</SimpleBadge>}
                    </div>
                    <div className="text-muted-foreground mt-1 truncate text-xs">
                      {formatDateTime(a.grantedAt, { style: 'medium' })} · by {a.grantedBy ? personLabel(a.grantedBy, names) : '—'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-xs whitespace-nowrap">
                    {a.expiresAt ? (
                      soon ? <SimpleBadge variant="orange">{soon}</SimpleBadge> : <span className="text-muted-foreground">until {formatDateTime(a.expiresAt, { style: 'medium' })}</span>
                    ) : (
                      <span className="text-muted-foreground">no end</span>
                    )}
                    {revocable && (
                      <div>
                        <Button variant="ghost" size="sm" className="mt-1 whitespace-nowrap" onClick={() => setRevoking(a)}>
                          Take away
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        )}
      </Table>
      <DataTableLoadingBody isLoading={loading} className="h-40" />
      <DataTableEmptyBody isLoading={loading} isEmpty={!loading && rows.length === 0} title="No role" description="They can do nothing yet — give them a role." className="h-40" />
      {revoking && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setRevoking(null)}
          title={`Take away ${revoking.roleId}?`}
          description={
            self
              ? 'This is your own role — if it lets you manage roles, the console refuses (ask another admin).'
              : `They lose everything ${revoking.roleId} grants${revoking.tenantId ? ` in ${tenantName(revoking.tenantId)}` : ' in every tenant'} — and anything they lent from it stops working.`
          }
          confirmLabel="Take it away"
          pending={revoke.isPending}
          onConfirm={() => revoke.mutate(revoking)}
        />
      )}
    </TableWrapper>
  );
}

/** What they can do in their tenant, by module — each action's source: a role, or who lent it. */
function AccessCard({ access, loading, names }: { access?: AccessExplanation; loading: boolean; names: ReadonlyMap<string, string> }) {
  const catalog = useActionCatalog();
  const descriptions = new Map((catalog.data ?? []).map((a) => [a.name, a.description]));
  const all = access?.effectiveActions === '*';
  const sources = new Map<string, string[]>();
  for (const r of access?.roles ?? []) for (const a of r.grantedActions) sources.set(a, [...(sources.get(a) ?? []), r.roleId]);
  for (const d of access?.delegations ?? []) for (const a of d.actions) sources.set(a, [...(sources.get(a) ?? []), `lent by ${personLabel(d.granterId, names)}`]);
  const actions = all ? [] : ((access?.effectiveActions as string[] | undefined) ?? []);
  const groups = groupByModule(actions, (a) => a);

  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle>What they can do</CardHeaderTitle>
        <CardHeaderSubtitle>
          {access ? `${access.tenantId ? `In ${tenantName(access.tenantId)}` : 'As platform staff'} · by module · from their roles and what they were lent` : ' '}
        </CardHeaderSubtitle>
      </CardHeader>
      <CardPanel>
        <div className="flex flex-col gap-4 p-5">
          {loading && <span className="text-muted-foreground text-sm">Loading…</span>}
          {all && <span className="text-sm">Everything — a role grants every action.</span>}
          {!loading && !all && actions.length === 0 && <span className="text-muted-foreground text-sm">Nothing — no role, nothing lent.</span>}
          {groups.map((g) => (
            <div key={g.module}>
              <div className="text-muted-foreground mb-1 text-[0.6875rem] tracking-wide uppercase">{g.label}</div>
              <div className="divide-border divide-y">
                {g.items.map((action) => (
                  <div key={action} className="flex items-start justify-between gap-3 py-1.5">
                    <div className="min-w-0">
                      <div className="font-mono text-xs">{action}</div>
                      <div className="text-muted-foreground text-xs">{descriptions.get(action) ?? '—'}</div>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                      {(sources.get(action) ?? []).map((s) => (
                        <SimpleBadge key={s} variant={s.startsWith('lent') ? 'blue' : 'secondary'}>
                          {s}
                        </SimpleBadge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardPanel>
      <CardFooter>
        <CardFooterIcon />
        <span>Ask about any one action — &ldquo;can they approve payouts, and why&rdquo; — with Check an action.</span>
      </CardFooter>
    </Card>
  );
}

/** What they lent and were lent — a lapsed action struck through. */
function DelegationsCard({ userId, delegations, loading, names }: { userId: string; delegations?: Delegation[]; loading: boolean; names: ReadonlyMap<string, string> }) {
  const rows = delegations ?? [];
  return (
    <TableWrapper>
      <Table>
        <TableHeader>
          <TableHeaderRow size="lg">
            <TableHead colSpan={3}>
              <CardHeaderTitle>Delegations</CardHeaderTitle>
              <CardHeaderSubtitle>Lent and received · newest first</CardHeaderSubtitle>
            </TableHead>
          </TableHeaderRow>
        </TableHeader>
        {rows.length > 0 && (
          <TableBody>
            {rows.map((d) => {
              const state = DELEGATION_STATE[delegationState(d)];
              const lent = d.granterId === userId;
              return (
                <TableRow key={d.id}>
                  <TableCell className="text-sm">
                    <div className="text-muted-foreground text-xs">{lent ? 'Lent to' : 'Lent by'}</div>
                    {lent ? personLabel(d.granteeId, names) : personLabel(d.granterId, names)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {d.actions.map((a) => (
                        <SimpleBadge key={a} variant={d.lapsedActions.includes(a) ? 'secondary' : 'default'} className={d.lapsedActions.includes(a) ? 'line-through' : undefined}>
                          {a}
                        </SimpleBadge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-xs whitespace-nowrap">
                    <WithTooltip tooltip={`Until ${formatDateTime(d.expiresAt, { style: 'medium' })}`}>
                      <SimpleBadge variant={state.variant}>{state.label}</SimpleBadge>
                    </WithTooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        )}
      </Table>
      <DataTableLoadingBody isLoading={loading} className="h-40" />
      <DataTableEmptyBody isLoading={loading} isEmpty={!loading && rows.length === 0} title="Nothing lent" description="They haven't lent or been lent anything." className="h-40" />
    </TableWrapper>
  );
}

