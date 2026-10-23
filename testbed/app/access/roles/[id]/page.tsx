'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LuShieldPlus } from 'react-icons/lu';
import {
  CardList,
  CardListItem,
  CardListLink,
  Dialog,
  DialogContent,
  BackLink,
  Button,
  Card,
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
  SimpleAlert,
  useBackTo,
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  authorizationApi,
  authorizationLinks,
  expiresSoon,
  groupByModule,
  personLabel,
  useActionCatalog,
  usePeopleNames,
} from '@/ascendra-commons-ui/authorization.ui';
import { AssignRoleContent } from '../../_assign-dialog';
import { PickContent } from '../../_pick-dialog';
import { TenantPicker, useAccessScope } from '../../_scope';
import { ACCESS_TENANTS, tenantName } from '../../tenants';

/** One role — what it grants, by module with each action's meaning, and who holds it here. */
export default function AccessRolePage() {
  const { id } = useParams<{ id: string }>();
  const roleId = decodeURIComponent(id);
  const { platform, tenantId, ownTenantId, can } = useAccessScope();
  const backTo = useBackTo(roleId);
  const [giving, setGiving] = useState(false);
  const role = useQuery({ queryKey: ['authz-role', roleId, tenantId], queryFn: () => authorizationApi.role(roleId) });
  const holders = useQuery({ queryKey: ['authz-holders', roleId, tenantId], queryFn: () => authorizationApi.holders(roleId, tenantId) });
  const catalog = useActionCatalog();
  const names = usePeopleNames(useMemo(() => (holders.data?.data ?? []).map((a) => a.userId), [holders.data]));
  const descriptions = new Map((catalog.data ?? []).map((a) => [a.name, a]));
  const r = role.data;
  const groups = groupByModule(r?.actions ?? [], (a) => a);
  const rows = [...(holders.data?.data ?? [])].sort((a, b) => personLabel(a.userId, names).localeCompare(personLabel(b.userId, names)));
  // Where a "give this role" lands: the viewer's tenant, or the one a platform admin picked; a platform role — all tenants.
  const target = r?.scope === 'platform' ? null : (tenantId ?? ownTenantId);
  const canGive = can('authz.assign_roles') && (r?.scope !== 'platform' || platform) && (target !== null || r?.scope === 'platform');

  if (role.isError) {
    return (
      <DashboardContent>
        <ErrorMessage title={`Couldn't load ${roleId}`} error={role.error} onRetry={() => role.refetch()} />
      </DashboardContent>
    );
  }

  return (
    <>
      <BackLink href={authorizationLinks.roles()} label="Roles">Back to roles</BackLink>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>{roleId}</PageTitle>
          <PageSubtitle>{r?.description ?? ' '}</PageSubtitle>
        </PageHeaderGroup>
        <PageHeaderAction className="flex w-fit gap-2">
          <TenantPicker />
          {canGive && (
            <Button onClick={() => setGiving(true)}>
              <LuShieldPlus />
              Give this role
            </Button>
          )}
        </PageHeaderAction>
      </PageHeader>
      <DashboardContent>
        {r?.scope === 'platform' && (
          <SimpleAlert variant="warning">
            {r.grantsAll ? 'Grants every action.' : `Platform-wide — it grants ${r.platformActions.join(', ')}, which read or change every tenant's data.`} It
            can only be given to all tenants, by a platform admin.
          </SimpleAlert>
        )}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-6">
            <Card collapseable="expanded">
              <CardHeader>
                <CardHeaderTitle>Grants</CardHeaderTitle>
                <CardHeaderSubtitle>{r ? (r.grantsAll ? 'every action' : `${r.actions.length} actions · ${r.scope} scope`) : ' '}</CardHeaderSubtitle>
              </CardHeader>
              <CardPanel>
                <div className="flex flex-col gap-4 p-5">
                  {r?.grantsAll && <span className="text-sm">Every action the app has, now and later.</span>}
                  {groups.map((g) => (
                    <div key={g.module}>
                      <div className="text-muted-foreground mb-1 text-[0.6875rem] tracking-wide uppercase">{g.label}</div>
                      <div className="divide-border divide-y">
                        {g.items.map((action) => {
                          const info = descriptions.get(action);
                          return (
                            <div key={action} className="flex items-start justify-between gap-3 py-1.5">
                              <div className="min-w-0">
                                <div className="font-mono text-xs">{action}</div>
                                <div className="text-muted-foreground text-xs">{info?.description ?? '—'}</div>
                              </div>
                              <div className="flex shrink-0 gap-1">
                                {info?.scope === 'platform' && <SimpleBadge variant="amber">platform</SimpleBadge>}
                                {info && !info.description && <SimpleBadge variant="orange">no description</SimpleBadge>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardPanel>
            </Card>
          </div>
          <div className="col-span-12 lg:col-span-6">
            <Card collapseable="expanded">
              <CardHeader>
                <CardHeaderTitle>Holders {tenantId ? `in ${tenantName(tenantId)}` : platform ? 'in every tenant' : ''}</CardHeaderTitle>
                <CardHeaderSubtitle>{holders.data ? `${rows.length} ${rows.length === 1 ? 'assignment' : 'assignments'} · by name` : ' '}</CardHeaderSubtitle>
              </CardHeader>
              <CardPanel>
                {rows.length > 0 && (
                  <CardList columns="minmax(0,1fr) auto auto">
                    {rows.map((a) => {
                      const soon = expiresSoon(a.expiresAt);
                      return (
                        <CardListItem key={`${a.userId}-${a.tenantId}`}>
                          <div>
                            <CardListLink href={backTo(authorizationLinks.person(a.userId))}>{personLabel(a.userId, names)}</CardListLink>
                            {platform && !tenantId && <div className="text-muted-foreground text-xs">{a.tenantId ? tenantName(a.tenantId) : 'all tenants'}</div>}
                          </div>
                          <div className="text-muted-foreground text-xs whitespace-nowrap">since {formatDateTime(a.grantedAt, { style: 'medium' })}</div>
                          <div className="text-right">{soon && <SimpleBadge variant="orange">{soon}</SimpleBadge>}</div>
                        </CardListItem>
                      );
                    })}
                  </CardList>
                )}
                <DataTableLoadingBody isLoading={holders.isLoading} className="h-40" />
                <DataTableErrorBody isError={holders.isError} error={holders.error} onRetry={() => holders.refetch()} className="h-40" />
                <DataTableEmptyBody isLoading={holders.isLoading} isEmpty={!!holders.data && rows.length === 0} title="Nobody holds it" description="Give it to people from here or from People." className="h-40" />
              </CardPanel>
            </Card>
          </div>
        </div>
      </DashboardContent>
      {giving && r && (
        <PeoplePickerAssign roleId={roleId} target={target} onClose={() => setGiving(false)} />
      )}
    </>
  );
}

/** "Give this role" — one dialog, two steps: pick people from the target tenant's directory, then the end date. */
function PeoplePickerAssign({ roleId, target, onClose }: { roleId: string; target: string | null; onClose: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [step, setStep] = useState<'pick' | 'confirm'>('pick');
  const people = useQuery({
    queryKey: ['authz-pick-people', target],
    queryFn: () => authorizationApi.findUsers(target ? { tenantId: target } : {}, 200),
  });
  const candidates = (people.data?.data ?? []).filter((u) => u.tenantId === target && !u.roles.some((x) => x.roleId === roleId));
  const chosen = picked.map((id) => ({ id, name: candidates.find((c) => c.id === id)?.name ?? id }));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        {step === 'pick' ? (
          <PickContent
            title={`Give ${roleId} to…`}
            description={`People ${target ? `in ${ACCESS_TENANTS.find((t) => t.id === target)?.name ?? target}` : 'on the platform'} who don't hold it yet.`}
            loading={people.isLoading}
            options={candidates.map((c) => ({ value: c.id, label: c.name, hint: c.email ?? c.id }))}
            picked={picked}
            onPick={setPicked}
            onNext={() => setStep('confirm')}
          />
        ) : (
          <AssignRoleContent
            userIds={picked}
            label={picked.length === 1 ? chosen[0].name : `${picked.length} people`}
            people={chosen}
            tenantId={target}
            fixedRoleId={roleId}
            onBack={() => setStep('pick')}
            onDone={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

