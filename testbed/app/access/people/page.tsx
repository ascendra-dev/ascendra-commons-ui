'use client';

import { useMemo, useState } from 'react';
import { LuShieldPlus } from 'react-icons/lu';
import {
  BackLink,
  Button,
  DataTable,
  DataTableBar,
  DataTableBarContent,
  DataTableBody,
  DataTableCell,
  DataTableCheckboxCell,
  DataTableCheckboxHead,
  DataTableColumnManager,
  DataTableEmptyBody,
  DataTableErrorBody,
  DataTableFilterBar,
  DataTableFoot,
  DataTableHead,
  DataTableHeadAction,
  DataTableHeader,
  DataTableHeaderRow,
  DataTableHighlight,
  DataTableLoadingBody,
  DataTableRow,
  DataTableRowAction,
  DataTableRunQueryAction,
  DataTableSearchInput,
  DataTableWithQueryProvider,
  DataTableWrapper,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  MainContent,
  PageContent,
  PageHeader,
  PageHeaderAction,
  PageHeaderGroup,
  PageMain,
  PageSubtitle,
  PageTitle,
  PageWrapper,
  QueryBar,
  QueryParamPanel,
  SimpleBadge,
  TableRowLink,
  useDataTable,
  WithTooltip,
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  authorizationFieldOptions,
  authorizationLinks,
  authorizationQueryIds,
  expiresSoon,
  peopleColumns,
  peopleQueryDefs,
  peopleQueryFunctions,
  useActionCatalog,
  useRoles,
  type PersonRow,
} from '@/ascendra-commons-ui/authorization.ui';
import { AssignRoleDialog } from '../_assign-dialog';
import { TenantPicker, useAccessScope } from '../_scope';
import { ACCESS_TENANTS, tenantName } from '../tenants';

/**
 * Everyone, by name, with what they hold — the app's own users (its AuthzUserDirectory), read here, never created.
 * Pick people to give them one role at once; a row opens the person.
 */
export default function AccessPeoplePage() {
  const { platform, tenantId, can } = useAccessScope();
  const roles = useRoles();
  const actions = useActionCatalog();
  const fieldOptions = useMemo(() => authorizationFieldOptions(roles.data ?? [], actions.data ?? [], ACCESS_TENANTS), [roles.data, actions.data]);
  const queries = useMemo(() => peopleQueryDefs(platform), [platform]);

  return (
    <>
      <PageHeader>
        <PageHeaderGroup>
          <BackLink href={authorizationLinks.overview()}>Back to overview</BackLink>
          <PageTitle>People</PageTitle>
          <PageSubtitle>Everyone {tenantId ? `in ${tenantName(tenantId)}` : platform ? 'in every tenant' : 'here'}, and what they hold.</PageSubtitle>
        </PageHeaderGroup>
        {platform && (
          <PageHeaderAction className="flex w-fit gap-2">
            <TenantPicker />
          </PageHeaderAction>
        )}
      </PageHeader>
      <PageMain>
        <PageWrapper>
          <PageContent>
            <MainContent>
              <DataTableWithQueryProvider
                queries={queries}
                fieldOptions={fieldOptions}
                queryFunctions={peopleQueryFunctions}
                columns={peopleColumns}
                getRowId={(row) => row.id}
                selectable={can('authz.assign_roles')}
                tableId="access-people-table"
              >
                <QueryBar />
                <QueryParamPanel />
                <DataTableBar>
                  <DataTableBarContent>
                    <DataTableSearchInput />
                    <DataTableColumnManager />
                    {can('authz.assign_roles') && <GiveRoleToSelected />}
                  </DataTableBarContent>
                </DataTableBar>
                <DataTableFilterBar />
                <DataTableWrapper>
                  <DataTable scrollable horizontal height={520}>
                    <DataTableHeader>
                      <DataTableHeaderRow>
                        {can('authz.assign_roles') && <DataTableCheckboxHead />}
                        <DataTableHead column="name">Person</DataTableHead>
                        {(platform && !tenantId) ? <DataTableHead column="tenantId">Tenant</DataTableHead> : null}
                        <DataTableHead column="roles">Roles</DataTableHead>
                        <DataTableHeadAction />
                      </DataTableHeaderRow>
                    </DataTableHeader>
                    <DataTableBody>
                      {(row: PersonRow) => (
                        <DataTableRow key={row.id}>
                          {can('authz.assign_roles') && <DataTableCheckboxCell rowId={row.id} />}
                          <DataTableCell column="name">
                            <TableRowLink href={authorizationLinks.person(row.id)} className="flex flex-col">
                              <span className="font-medium">
                                <DataTableHighlight text={row.name} item={row} itemKey="name" />
                              </span>
                              <span className="text-muted-foreground text-xs">{row.email ?? row.id}</span>
                            </TableRowLink>
                          </DataTableCell>
                          {(platform && !tenantId) ? (
                            <DataTableCell column="tenantId" className="text-muted-foreground whitespace-nowrap">
                              {row.tenantId ? tenantName(row.tenantId) : 'Platform'}
                            </DataTableCell>
                          ) : null}
                          <DataTableCell column="roles">
                            <RoleChips row={row} />
                          </DataTableCell>
                          <DataTableRowAction>
                            <DropdownMenuLabel>Row actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {row.roles.map((r) => (
                              <DataTableRunQueryAction
                                key={r.roleId}
                                title={`Everyone holding ${r.roleId}`}
                                queryId={authorizationQueryIds.peopleFilter}
                                params={{ roleId: r.roleId }}
                              />
                            ))}
                            {row.roles.length === 0 && (
                              <DataTableRunQueryAction title="Everyone holding no role" queryId={authorizationQueryIds.peopleFilter} params={{ roleless: 'true' }} />
                            )}
                          </DataTableRowAction>
                        </DataTableRow>
                      )}
                    </DataTableBody>
                  </DataTable>
                  <DataTableLoadingBody />
                  <DataTableErrorBody />
                  <DataTableEmptyBody title="Nobody matches" description="Clear the search or the role filter." />
                  <DataTableFoot />
                </DataTableWrapper>
              </DataTableWithQueryProvider>
            </MainContent>
          </PageContent>
        </PageWrapper>
      </PageMain>
    </>
  );
}

/** A person's active roles — an end date within the week as an orange chip, a global role marked. */
function RoleChips({ row }: { row: PersonRow }) {
  if (row.roles.length === 0) return <SimpleBadge variant="secondary">no role</SimpleBadge>;
  return (
    <div className="flex flex-wrap gap-1">
      {row.roles.map((r) => {
        const soon = expiresSoon(r.expiresAt);
        const chip = (
          <SimpleBadge key={`${r.roleId}-${r.tenantId}`} variant={soon ? 'orange' : r.tenantId === null ? 'amber' : 'default'}>
            {r.roleId}
            {r.tenantId === null ? ' · all tenants' : ''}
            {soon ? ` · ${soon}` : ''}
          </SimpleBadge>
        );
        return r.expiresAt ? (
          <WithTooltip key={`${r.roleId}-${r.tenantId}`} tooltip={`Until ${formatDateTime(r.expiresAt, { style: 'medium' })}`}>
            {chip}
          </WithTooltip>
        ) : (
          chip
        );
      })}
    </div>
  );
}

/** The bar's "Give a role" — enabled once people are selected; they must share a tenant (the role lands there). */
function GiveRoleToSelected() {
  const { selectedData: people, clearSelection } = useDataTable<PersonRow>();
  const [open, setOpen] = useState(false);
  const ids = people.map((p) => p.id);
  const tenants = new Set(people.map((p) => p.tenantId));
  const mixed = tenants.size > 1;
  const button = (
    <Button variant="secondary" disabled={ids.length === 0 || mixed} onClick={() => setOpen(true)}>
      <LuShieldPlus />
      Give a role{ids.length ? ` (${ids.length})` : ''}
    </Button>
  );
  return (
    <>
      {mixed ? <WithTooltip tooltip="Pick people from one tenant — the role lands in it">{button}</WithTooltip> : button}
      {open && (
        <AssignRoleDialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) clearSelection();
          }}
          userIds={ids}
          label={ids.length === 1 ? (people[0]?.name ?? ids[0]) : `${ids.length} people`}
          tenantId={people[0]?.tenantId ?? null}
        />
      )}
    </>
  );
}
