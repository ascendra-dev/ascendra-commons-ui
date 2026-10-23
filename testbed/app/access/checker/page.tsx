'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LuCircleCheck, LuCircleX } from 'react-icons/lu';
import {
  BackLink,
  CardHeaderSubtitle,
  CardHeaderTitle,
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  DashboardContent,
  DataTableEmptyBody,
  DataTableErrorBody,
  DataTableLoadingBody,
  Field,
  FieldLabel,
  PageHeader,
  PageHeaderAction,
  PageHeaderGroup,
  PageSubtitle,
  PageTitle,
  SegmentControl,
  SimpleBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
  TableRowLink,
  TableWrapper,
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  authorizationApi,
  authorizationLinks,
  personLabel,
  useActionCatalog,
  usePeopleNames,
} from '@/ascendra-commons-ui/authorization.ui';
import { TenantPicker, useAccessScope } from '../_scope';
import { tenantName } from '../tenants';

const TABS = [
  { value: 'can', label: 'Can this person…' },
  { value: 'who', label: 'Who can…' },
] as const;

/**
 * The two questions support and incident response ask: "can she approve payouts, and why?" and "who can approve
 * payouts here?". The URL carries the question (`?tab&userId&action`), so a link from a person or a denial asks it.
 */
export default function AccessCheckerPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { platform, tenantId } = useAccessScope();
  const tab = params.get('tab') === 'who' ? 'who' : 'can';
  const userId = params.get('userId') ?? undefined;
  const action = params.get('action') ?? undefined;
  const set = (next: { tab?: 'can' | 'who'; userId?: string; action?: string }) =>
    router.replace(authorizationLinks.checker({ tab, userId, action, ...next }));

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <BackLink href={authorizationLinks.overview()}>Back to overview</BackLink>
          <PageTitle>Access checker</PageTitle>
          <PageSubtitle>Ask why someone can or can&apos;t do something — or who can.</PageSubtitle>
        </PageHeaderGroup>
        {platform && (
          <PageHeaderAction className="flex w-fit gap-2">
            <TenantPicker />
          </PageHeaderAction>
        )}
      </PageHeader>
      <DashboardContent>
        <SegmentControl segments={TABS} value={tab} onValueChange={(v) => set({ tab: v as 'can' | 'who' })} />
        {tab === 'can' ? (
          <CanThisPerson userId={userId} action={action} tenantId={tenantId} onChange={set} />
        ) : (
          <WhoCan action={action} tenantId={tenantId} onChange={set} platform={platform} />
        )}
      </DashboardContent>
    </>
  );
}

/** An action picker over the catalog — typed to search, by name. */
function ActionPicker({ value, onChange }: { value?: string; onChange: (action: string) => void }) {
  const catalog = useActionCatalog();
  const names = (catalog.data ?? []).map((a) => a.name);
  return (
    <Field className="min-w-64">
      <FieldLabel>Action</FieldLabel>
      <Combobox items={names} value={value ?? null} onValueChange={(v) => v && onChange(v as string)}>
        <ComboboxInput placeholder={catalog.isLoading ? 'Loading…' : 'payout.approve'} />
        <ComboboxContent>
          <ComboboxList>
            <ComboboxEmpty>No such action.</ComboboxEmpty>
            <ComboboxCollection>
              {(n: string) => (
                <ComboboxItem key={n} value={n}>
                  {n}
                </ComboboxItem>
              )}
            </ComboboxCollection>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}

/** A person picker over the directory — the first 200 in reach, searched as you type. */
function PersonPicker({ value, tenantId, onChange }: { value?: string; tenantId?: string; onChange: (id: string) => void }) {
  const people = useQuery({
    queryKey: ['authz-pick-people', tenantId ?? null],
    queryFn: () => authorizationApi.findUsers(tenantId ? { tenantId } : {}, 200),
  });
  const list = people.data?.data ?? [];
  const byId = new Map(list.map((u) => [u.id, u]));
  return (
    <Field className="min-w-72">
      <FieldLabel>Person</FieldLabel>
      <Combobox
        items={list.map((u) => u.id)}
        value={value ?? null}
        onValueChange={(v) => v && onChange(v as string)}
        itemToStringLabel={(id: string) => byId.get(id)?.name ?? id}
        filter={(id: string, query: string) => {
          const u = byId.get(id);
          const q = query.trim().toLowerCase();
          return !q || [u?.name, u?.email, id].some((s) => s?.toLowerCase().includes(q));
        }}
      >
        <ComboboxInput placeholder={people.isLoading ? 'Loading…' : 'Search by name or email'} />
        <ComboboxContent>
          <ComboboxList>
            <ComboboxEmpty>Nobody by that name or email.</ComboboxEmpty>
            <ComboboxCollection>
              {(id: string) => (
                <ComboboxItem key={id} value={id}>
                  <span className="flex flex-col">
                    <span>{byId.get(id)?.name ?? id}</span>
                    <span className="text-muted-foreground text-xs">{byId.get(id)?.email ?? id}</span>
                  </span>
                </ComboboxItem>
              )}
            </ComboboxCollection>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}

function CanThisPerson({
  userId,
  action,
  tenantId,
  onChange,
}: {
  userId?: string;
  action?: string;
  tenantId?: string;
  onChange: (next: { userId?: string; action?: string }) => void;
}) {
  const answer = useQuery({
    queryKey: ['authz-explain', userId, action, tenantId],
    queryFn: async () => {
      // The question is asked in the person's own tenant — a platform admin's picker only narrows who's listed.
      const [user] = await authorizationApi.lookup([userId!]);
      return authorizationApi.explain(userId!, action, user?.tenantId ?? tenantId);
    },
    enabled: !!userId && !!action,
  });
  const names = usePeopleNames(useMemo(() => [userId ?? '', ...(answer.data?.delegations ?? []).map((d) => d.granterId)].filter(Boolean), [userId, answer.data]));
  const a = answer.data;
  const via = a?.roles.find((r) => r.grantsAll || r.grantedActions.includes(action ?? ''));
  const lent = a?.delegations.find((d) => d.actions.includes(action ?? ''));
  const lapsed = a?.delegations.find((d) => d.lapsedActions.includes(action ?? ''));
  const who = userId ? personLabel(userId, names) : '';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <PersonPicker value={userId} tenantId={tenantId} onChange={(id) => onChange({ userId: id })} />
        <ActionPicker value={action} onChange={(next) => onChange({ action: next })} />
      </div>
      {answer.isError && <p className="text-negative text-sm">{answer.error instanceof Error ? answer.error.message : 'Could not check.'}</p>}
      {a && (
        <div
          className={`flex items-start gap-3 rounded-xl p-4 ring-1 ${a.allowed ? 'bg-positive/5 ring-positive/20' : 'bg-negative/5 ring-negative/20'}`}
        >
          {a.allowed ? <LuCircleCheck className="text-positive mt-0.5 size-5 shrink-0" /> : <LuCircleX className="text-negative mt-0.5 size-5 shrink-0" />}
          <div className="flex flex-col gap-1">
            <span className="font-medium">
              {a.allowed ? `Yes — ${who} can ${action}.` : `No — ${who} can't ${action}.`}
            </span>
            <span className="text-muted-foreground text-sm">
              {via
                ? via.grantsAll
                  ? `Their role ${via.roleId} grants every action.`
                  : `Their role ${via.roleId} grants it${via.tenantId === null ? ' in every tenant' : ''}${via.expiresAt ? ` — until ${formatDateTime(via.expiresAt, { style: 'medium' })}` : ''}.`
                : lent
                  ? `Lent by ${personLabel(lent.granterId, names)} until ${formatDateTime(lent.expiresAt, { style: 'medium' })}.`
                  : lapsed
                    ? `${personLabel(lapsed.granterId, names)} lends it, but no longer holds it — so it grants nothing. No role of theirs grants it.`
                    : 'No role of theirs grants it, and nobody lent it to them.'}
            </span>
            {a.tenantId && <span className="text-muted-foreground text-xs">In {tenantName(a.tenantId)}</span>}
          </div>
        </div>
      )}
      {!userId || !action ? <p className="text-muted-foreground text-sm">Pick a person and an action.</p> : null}
    </div>
  );
}

function WhoCan({
  action,
  tenantId,
  platform,
  onChange,
}: {
  action?: string;
  tenantId?: string;
  platform: boolean;
  onChange: (next: { action?: string }) => void;
}) {
  const answer = useQuery({ queryKey: ['authz-who-can', action, tenantId], queryFn: () => authorizationApi.whoCan(action!, tenantId), enabled: !!action });
  const ids = useMemo(
    () => [...(answer.data?.roles ?? []).flatMap((r) => r.holderUserIds), ...(answer.data?.delegations ?? []).flatMap((d) => [d.granterId, d.granteeId])],
    [answer.data],
  );
  const names = usePeopleNames(ids);
  const rows = [
    ...(answer.data?.roles ?? []).flatMap((r) => r.holderUserIds.map((u) => ({ key: `${r.roleId}-${u}`, userId: u, via: r.roleId, lent: false, note: '' }))),
    ...(answer.data?.delegations ?? []).map((d) => ({
      key: d.id,
      userId: d.granteeId,
      via: 'lent',
      lent: true,
      note: `by ${personLabel(d.granterId, names)}, until ${formatDateTime(d.expiresAt, { style: 'medium' })}`,
    })),
  ].sort((a, b) => personLabel(a.userId, names).localeCompare(personLabel(b.userId, names)));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <ActionPicker value={action} onChange={(next) => onChange({ action: next })} />
      </div>
      {action && (
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableHeaderRow size="lg">
                <TableHead colSpan={3}>
                  <CardHeaderTitle>Who can {action}</CardHeaderTitle>
                  <CardHeaderSubtitle>
                    {tenantId ? `In ${tenantName(tenantId)}` : platform ? 'In every tenant' : 'Here'} · through a role or something lent · platform staff with a global role act here too
                  </CardHeaderSubtitle>
                </TableHead>
              </TableHeaderRow>
            </TableHeader>
            {rows.length > 0 && (
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell>
                      <TableRowLink href={authorizationLinks.person(r.userId)}>{personLabel(r.userId, names)}</TableRowLink>
                    </TableCell>
                    <TableCell>
                      <SimpleBadge variant={r.lent ? 'blue' : 'default'}>{r.via}</SimpleBadge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{r.note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
          <DataTableLoadingBody isLoading={answer.isLoading} className="h-40" />
          <DataTableErrorBody isError={answer.isError} error={answer.error} onRetry={() => answer.refetch()} className="h-40" />
          <DataTableEmptyBody isLoading={answer.isLoading} isEmpty={!!answer.data && rows.length === 0} title="Nobody" description="No role held here grants it, and nobody lent it." className="h-40" />
        </TableWrapper>
      )}
      {!action && <p className="text-muted-foreground text-sm">Pick an action.</p>}
    </div>
  );
}
