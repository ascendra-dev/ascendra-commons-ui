'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CardFooter,
  CardFooterIcon,
  CardHeaderSubtitle,
  CardHeaderTitle,
  DashboardContent,
  DataTableEmptyBody,
  DataTableErrorBody,
  DataTableLoadingBody,
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
  TableRowLink,
  TableWrapper,
  WithTooltip,
} from '@/ascendra-ui';
import { formatCount } from '@/ascendra-ui/utils/common.util';
import { authorizationApi, authorizationLinks, useRoles } from '@/ascendra-commons-ui/authorization.ui';
import { TenantPicker, useAccessScope } from '../_scope';
import { tenantName } from '../tenants';

/** The roles the app ships — what each grants and how many hold it here. Read-only: a role's definition ships with the app. */
export default function AccessRolesPage() {
  const { platform, tenantId } = useAccessScope();
  const roles = useRoles();
  const stats = useQuery({ queryKey: ['authz-stats', tenantId], queryFn: () => authorizationApi.stats(tenantId) });
  const holders = new Map((stats.data?.roleHolders ?? []).map((r) => [r.roleId, r.holders]));
  // Platform roles first only for a platform admin; everyone sees tenant roles by name.
  const rows = [...(roles.data ?? [])].sort((a, b) => (a.scope === b.scope ? a.id.localeCompare(b.id) : a.scope === 'tenant' ? -1 : 1));

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Roles</PageTitle>
          <PageSubtitle>What each role grants, and how many hold it {tenantId ? `in ${tenantName(tenantId)}` : platform ? 'across tenants' : 'here'}.</PageSubtitle>
        </PageHeaderGroup>
        {platform && (
          <PageHeaderAction className="flex w-fit gap-2">
            <TenantPicker />
          </PageHeaderAction>
        )}
      </PageHeader>
      <DashboardContent>
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableHeaderRow size="lg">
                <TableHead colSpan={5}>
                  <CardHeaderTitle>Every role</CardHeaderTitle>
                  <CardHeaderSubtitle>Tenant roles first · a platform role is assigned to all tenants, by a platform admin</CardHeaderSubtitle>
                </TableHead>
              </TableHeaderRow>
              <TableHeaderRow>
                <TableHead>Role</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                <TableHead className="text-right">Holders</TableHead>
                <TableHead>What it&apos;s for</TableHead>
              </TableHeaderRow>
            </TableHeader>
            {rows.length > 0 && (
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <TableRowLink href={authorizationLinks.role(r.id)}>
                        <SimpleBadge variant={r.scope === 'platform' ? 'amber' : 'default'}>{r.id}</SimpleBadge>
                      </TableRowLink>
                    </TableCell>
                    <TableCell>
                      {r.scope === 'platform' ? (
                        <WithTooltip tooltip={r.grantsAll ? 'Grants every action' : `Platform-wide: ${r.platformActions.join(', ')}`}>
                          <SimpleBadge variant="amber">platform</SimpleBadge>
                        </WithTooltip>
                      ) : (
                        <SimpleBadge variant="secondary">tenant</SimpleBadge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{r.grantsAll ? 'all' : formatCount(r.actions.length)}</TableCell>
                    <TableCell className={`text-right font-mono tabular-nums ${holders.get(r.id) ? '' : 'text-muted-foreground'}`}>
                      {formatCount(holders.get(r.id) ?? 0)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.description ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
          <DataTableLoadingBody isLoading={roles.isLoading} className="h-65" />
          <DataTableErrorBody isError={roles.isError} error={roles.error} onRetry={() => roles.refetch()} className="h-65" />
          <DataTableEmptyBody isLoading={roles.isLoading} isEmpty={!!roles.data && rows.length === 0} title="No roles" description="The app ships none yet — its deploy seeds them." className="h-65" />
          <CardFooter>
            <CardFooterIcon />
            <span>A role&apos;s actions ship with the app — this console gives roles out and takes them back, never edits them.</span>
          </CardFooter>
        </TableWrapper>
      </DashboardContent>
    </>
  );
}
