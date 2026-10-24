'use client';

import { useMemo, useState } from 'react';
import {
  DataTable,
  DataTableBar,
  DataTableBarContent,
  DataTableBody,
  DataTableCell,
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
  PageFocus,
  PageFocusToggle,
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  authorizationFieldOptions,
  authorizationQueryIds,
  DELEGATION_STATE,
  delegationColumns,
  delegationQueryDefs,
  delegationQueryFunctions,
  delegationState,
  expiresSoon,
  useActionCatalog,
  useRoles,
  type DelegationRow,
} from '@/ascendra-commons-ui/authorization.ui';
import { TenantPicker, useAccessScope } from '../_scope';
import { ACCESS_TENANTS, tenantName } from '../tenants';
import { DelegationSheet } from './_delegation-sheet';

/** Everything lent — cover during leave, a backlog, quarter close: running, ending, no longer granting, or over. */
export default function AccessDelegationsPage() {
  const { platform, tenantId } = useAccessScope();
  const [selected, setSelected] = useState<DelegationRow | null>(null);
  const roles = useRoles();
  const actions = useActionCatalog();
  const fieldOptions = useMemo(() => authorizationFieldOptions(roles.data ?? [], actions.data ?? [], ACCESS_TENANTS), [roles.data, actions.data]);
  const queries = useMemo(() => delegationQueryDefs(platform), [platform]);

  return (
    <>
      <PageFocus>
        <PageHeader>
          <PageHeaderGroup>
            <PageTitle>Delegations</PageTitle>
            <PageSubtitle>What people lent each other {tenantId ? `in ${tenantName(tenantId)}` : platform ? 'in every tenant' : 'here'} — and what no longer grants.</PageSubtitle>
          </PageHeaderGroup>
          {platform && (
            <PageHeaderAction className="flex w-fit gap-2">
              <TenantPicker />
              <PageFocusToggle />
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
                  queryFunctions={delegationQueryFunctions}
                  columns={delegationColumns}
                  getRowId={(row) => row.id}
                  tableId="access-delegations-table"
                >
                  <QueryBar />
                  <QueryParamPanel />
                  <DataTableBar>
                    <DataTableBarContent>
                      <DataTableSearchInput />
                      <DataTableColumnManager />
                    </DataTableBarContent>
                  </DataTableBar>
                  <DataTableFilterBar />
                  <DataTableWrapper>
                    <DataTable scrollable horizontal>
                      <DataTableHeader>
                        <DataTableHeaderRow>
                          <DataTableHead column="granterName">From → to</DataTableHead>
                          <DataTableHead column="actions">Actions</DataTableHead>
                          <DataTableHead column="expiresAt">Until</DataTableHead>
                          <DataTableHead column="status">State</DataTableHead>
                          <DataTableHead column="reason">Reason</DataTableHead>
                          <DataTableHeadAction />
                        </DataTableHeaderRow>
                      </DataTableHeader>
                      <DataTableBody>
                        {(row: DelegationRow) => {
                          const state = DELEGATION_STATE[delegationState(row)];
                          const soon = row.status === 'active' ? expiresSoon(row.expiresAt) : null;
                          return (
                            <DataTableRow key={row.id} active={row.id === selected?.id} opensSheet className="cursor-pointer" onClick={() => setSelected(row)}>
                              <DataTableCell column="granterName" className="whitespace-nowrap">
                                {/* The whole row opens the sheet — its end says so (opensSheet); no icon on this one cell. */}
                                <DataTableHighlight text={`${row.granterName} → ${row.granteeName}`} item={row} itemKey="granterName" />
                                {platform && !tenantId && <div className="text-muted-foreground text-xs">{tenantName(row.tenantId)}</div>}
                              </DataTableCell>
                              <DataTableCell column="actions">
                                <div className="flex flex-wrap gap-1">
                                  {row.actions.map((a) => (
                                    <SimpleBadge key={a} variant={row.lapsedActions.includes(a) ? 'secondary' : 'default'} className={row.lapsedActions.includes(a) ? 'line-through' : undefined}>
                                      {a}
                                    </SimpleBadge>
                                  ))}
                                </div>
                              </DataTableCell>
                              <DataTableCell column="expiresAt" className="whitespace-nowrap">
                                {soon ? <SimpleBadge variant="orange">{soon}</SimpleBadge> : formatDateTime(row.expiresAt, { style: 'medium' })}
                              </DataTableCell>
                              <DataTableCell column="status">
                                <SimpleBadge variant={state.variant}>{state.label}</SimpleBadge>
                              </DataTableCell>
                              {/* The rest of the row's width, truncated — a table cell's own truncate can't cap its width, so a long
                                  reason pushed the table wider than its card. */}
                              <DataTableCell column="reason" className="text-muted-foreground w-full max-w-0">
                                <div className="truncate" title={row.reason ?? undefined}>{row.reason ?? '—'}</div>
                              </DataTableCell>
                              <DataTableRowAction>
                                <DropdownMenuLabel>Row actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DataTableRunQueryAction title={`Everything ${row.granterName} lent or got`} queryId={authorizationQueryIds.delegationsFilter} params={{ userId: row.granterId }} />
                                <DataTableRunQueryAction title={`Everything ${row.granteeName} lent or got`} queryId={authorizationQueryIds.delegationsFilter} params={{ userId: row.granteeId }} />
                              </DataTableRowAction>
                            </DataTableRow>
                          );
                        }}
                      </DataTableBody>
                    </DataTable>
                    <DataTableLoadingBody />
                    <DataTableErrorBody />
                    <DataTableEmptyBody title="Nothing lent" description="No delegation matches — try another state." />
                    <DataTableFoot />
                  </DataTableWrapper>
                  {selected && <DelegationSheet delegation={selected} onClose={() => setSelected(null)} />}
                </DataTableWithQueryProvider>
              </MainContent>
            </PageContent>
          </PageWrapper>
        </PageMain>
      </PageFocus>
    </>
  );
}
