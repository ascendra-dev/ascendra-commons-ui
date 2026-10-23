'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  CardHeader,
  CardHeaderSubtitle,
  CardHeaderTitle,
  CardPanel,
  Checkbox,
  DashboardContent,
  DataTableEmptyBody,
  DataTableLoadingBody,
  DatePicker,
  Field,
  FieldHint,
  FieldLabel,
  Input,
  PageHeader,
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
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  authorizationApi,
  DELEGATION_STATE,
  delegationState,
  groupByModule,
  type Delegation,
} from '@/ascendra-commons-ui/authorization.ui';
import { useInvalidateAccess } from '../_assign-dialog';
import { useAccessScope } from '../_scope';
import { tenantName } from '../tenants';

/** The most a delegation may run — authorization's default `maxDelegationDays`. */
const MAX_LEND_DAYS = 90;

/**
 * For anyone signed in — what I can do here and why, what I lent and was lent, and lending some of mine while I'm
 * away. Reading, giving back and taking back need no action; lending needs `authz.manage_delegations`. Names of the
 * people involved come from the directory only for those who can read it — everyone else sees ids.
 */
export default function MyAccessPage() {
  const { can, ownTenantId } = useAccessScope();
  const access = useQuery({ queryKey: ['authz-me'], queryFn: () => authorizationApi.myAccess() });
  const mine = useQuery({ queryKey: ['authz-me-delegations'], queryFn: () => authorizationApi.myDelegations() });
  const a = access.data;
  const all = a?.effectiveActions === '*';
  const actions = all ? [] : ((a?.effectiveActions as string[] | undefined) ?? []);
  const groups = groupByModule(actions, (x) => x);
  const sources = new Map<string, string[]>();
  for (const r of a?.roles ?? []) for (const x of r.grantedActions) sources.set(x, [...(sources.get(x) ?? []), r.roleId]);
  for (const d of a?.delegations ?? []) for (const x of d.actions) sources.set(x, [...(sources.get(x) ?? []), `lent by ${d.granterId}`]);
  // What I may lend: what my roles give me (not what I was lent — a delegation can't be passed on).
  const fromRoles = [...new Set((a?.roles ?? []).flatMap((r) => r.grantedActions))].sort();

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>My access</PageTitle>
          <PageSubtitle>{ownTenantId ? `What you can do in ${tenantName(ownTenantId)}, and why.` : 'What you can do on the platform, and why.'}</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <DashboardContent>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-6">
            <Card>
              <CardHeader>
                <CardHeaderTitle>What I can do</CardHeaderTitle>
                <CardHeaderSubtitle>
                  {a ? `${(a.roles ?? []).map((r) => r.roleId).join(', ') || 'no role'}${a.delegations.length ? ` · ${a.delegations.length} lent to me` : ''}` : ' '}
                </CardHeaderSubtitle>
              </CardHeader>
              <CardPanel>
                <div className="flex flex-col gap-4 p-5">
                  {access.isLoading && <span className="text-muted-foreground text-sm">Loading…</span>}
                  {all && <span className="text-sm">Everything — a role grants every action.</span>}
                  {a && !all && actions.length === 0 && <span className="text-muted-foreground text-sm">Nothing yet — ask an admin for a role.</span>}
                  {groups.map((g) => (
                    <div key={g.module}>
                      <div className="text-muted-foreground mb-1 text-[0.6875rem] tracking-wide uppercase">{g.label}</div>
                      <div className="divide-border divide-y">
                        {g.items.map((x) => (
                          <div key={x} className="flex items-center justify-between gap-3 py-1.5">
                            <span className="font-mono text-xs">{x}</span>
                            <span className="flex flex-wrap justify-end gap-1">
                              {(sources.get(x) ?? []).map((s) => (
                                <SimpleBadge key={s} variant={s.startsWith('lent') ? 'blue' : 'secondary'}>
                                  {s}
                                </SimpleBadge>
                              ))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardPanel>
            </Card>
          </div>
          <div className="col-span-12 flex flex-col gap-4 lg:col-span-6">
            <LentCard title="I lent" rows={mine.data?.granted} loading={mine.isLoading} lent />
            <LentCard title="Lent to me" rows={mine.data?.received} loading={mine.isLoading} />
            {can('authz.manage_delegations') ? (
              <LendForm actions={fromRoles} />
            ) : (
              <Card>
                <CardHeader>
                  <CardHeaderTitle>Lending</CardHeaderTitle>
                  <CardHeaderSubtitle>Your roles don&apos;t include lending your actions to someone else.</CardHeaderSubtitle>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      </DashboardContent>
    </>
  );
}

function LentCard({ title, rows, loading, lent = false }: { title: string; rows?: Delegation[]; loading: boolean; lent?: boolean }) {
  const invalidate = useInvalidateAccess();
  const takeBack = useMutation({
    mutationFn: (id: string) => authorizationApi.revokeDelegation(id),
    onSuccess: async () => {
      toast.success(lent ? 'Taken back' : 'Given back');
      await invalidate();
    },
    onError: (error) => toast.error("Couldn't do that", { description: error instanceof Error ? error.message : undefined }),
  });
  const list = (rows ?? []).filter((d) => d.status === 'active');
  return (
    <TableWrapper>
      <Table>
        <TableHeader>
          <TableHeaderRow size="lg">
            <TableHead colSpan={2}>
              <CardHeaderTitle>{title}</CardHeaderTitle>
              <CardHeaderSubtitle>Running now</CardHeaderSubtitle>
            </TableHead>
          </TableHeaderRow>
        </TableHeader>
        {list.length > 0 && (
          <TableBody>
            {list.map((d) => {
              const state = DELEGATION_STATE[delegationState(d)];
              return (
                <TableRow key={d.id}>
                  {/* Two columns — the card is narrow: who and what (wrapping), then the state with its action. */}
                  <TableCell className="w-full max-w-0">
                    <div className="truncate text-sm">{lent ? `→ ${d.granteeId}` : `← ${d.granterId}`}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {d.actions.map((x) => (
                        <SimpleBadge key={x} variant={d.lapsedActions.includes(x) ? 'secondary' : 'default'} className={d.lapsedActions.includes(x) ? 'line-through' : undefined}>
                          {x}
                        </SimpleBadge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-xs whitespace-nowrap">
                    <SimpleBadge variant={state.variant}>{state.label}</SimpleBadge>
                    <div className="text-muted-foreground mt-1">until {formatDateTime(d.expiresAt, { style: 'medium' })}</div>
                    <Button variant="ghost" size="sm" className="mt-1" disabled={takeBack.isPending} onClick={() => takeBack.mutate(d.id)}>
                      {lent ? 'Take back' : 'Give back'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        )}
      </Table>
      <DataTableLoadingBody isLoading={loading} className="h-40" />
      <DataTableEmptyBody isLoading={loading} isEmpty={!loading && list.length === 0} title="Nothing running" description={lent ? "You haven't lent anything." : 'Nobody lent you anything.'} className="h-40" />
    </TableWrapper>
  );
}

/** Lend some of my access — to a colleague in my tenant, until a date (at most 90 days), only actions my roles give me. */
function LendForm({ actions }: { actions: string[] }) {
  const [grantee, setGrantee] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [until, setUntil] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState('');
  const invalidate = useInvalidateAccess();
  const lend = useMutation({
    mutationFn: () =>
      authorizationApi.lend({ granteeId: grantee.trim(), actions: picked, expiresAt: until!.toISOString(), reason: reason.trim() || undefined }),
    onSuccess: async (d) => {
      toast.success(`Lent to ${d.granteeId}`, { description: `${d.actions.join(', ')} until ${formatDateTime(d.expiresAt, { style: 'medium' })}` });
      setGrantee('');
      setPicked([]);
      setUntil(undefined);
      setReason('');
      await invalidate();
    },
    onError: (error) => toast.error("Couldn't lend it", { description: error instanceof Error ? error.message : undefined }),
  });
  const max = new Date();
  max.setDate(max.getDate() + MAX_LEND_DAYS);
  const lendable = actions.filter((x) => x !== 'authz.manage_delegations');

  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle>Lend some of my access</CardHeaderTitle>
        <CardHeaderSubtitle>To a colleague here, until a date (at most {MAX_LEND_DAYS} days). It stops granting anything you stop holding.</CardHeaderSubtitle>
      </CardHeader>
      <CardPanel>
        <div className="flex flex-col gap-4 p-5">
          <Field>
            <FieldLabel htmlFor="lend-to">To</FieldLabel>
            <Input id="lend-to" value={grantee} onChange={(e) => setGrantee(e.target.value)} placeholder="their email, e.g. elif.khan@acme.test" full />
          </Field>
          <Field>
            <FieldLabel>Actions</FieldLabel>
            <div className="flex flex-col gap-1">
              {lendable.length === 0 && <span className="text-muted-foreground text-sm">Your roles give you nothing to lend.</span>}
              {lendable.map((x) => (
                <label key={x} className="flex cursor-pointer items-center gap-2">
                  <Checkbox checked={picked.includes(x)} onCheckedChange={() => setPicked(picked.includes(x) ? picked.filter((p) => p !== x) : [...picked, x])} />
                  <span className="font-mono text-xs">{x}</span>
                </label>
              ))}
            </div>
            <FieldHint description="Only what your roles give you — not what someone lent you, and nothing platform-wide." />
          </Field>
          <Field>
            <FieldLabel htmlFor="lend-until">Until</FieldLabel>
            <DatePicker id="lend-until" value={until} onChange={setUntil} minDate={new Date()} maxDate={max} placeholder="Pick a date" />
          </Field>
          <Field>
            <FieldLabel htmlFor="lend-why">Why</FieldLabel>
            <Input id="lend-why" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} placeholder="Cover during annual leave" full />
            <FieldHint description="Optional — the delegation ledger shows it." optional />
          </Field>
          <div>
            <Button disabled={!grantee.trim() || picked.length === 0 || !until || lend.isPending} onClick={() => lend.mutate()}>
              {lend.isPending ? 'Lending…' : 'Lend'}
            </Button>
          </div>
        </div>
      </CardPanel>
    </Card>
  );
}
