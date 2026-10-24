'use client';

import { useMemo } from 'react';
import {
  BackLink,
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
  TableRowLink,
  useBackTo,
  PageFocus,
  PageFocusToggle,
} from '@/ascendra-ui';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  authorizationFieldOptions,
  authorizationLinks,
  authorizationQueryIds,
  denialColumns,
  denialQueryDefs,
  denialQueryFunctions,
  useActionCatalog,
  useRoles,
  type DenialRow,
} from '@/ascendra-commons-ui/authorization.ui';
import { TenantPicker, useAccessScope } from '../../_scope';
import { ACCESS_TENANTS, tenantName } from '../../tenants';

/**
 * Refusals — every "you don't have permission" the app answered, a row per person, action and page per minute,
 * newest first; Advanced Filter by person, action, page and range. Denied requests' rows open it filtered to what they
 * counted. Kept 90 days.
 */
export default function AccessRefusalsPage() {
  const { platform, tenantId } = useAccessScope();
  const backTo = useBackTo('refusals');
  const roles = useRoles();
  const actions = useActionCatalog();
  const fieldOptions = useMemo(() => authorizationFieldOptions(roles.data ?? [], actions.data ?? [], ACCESS_TENANTS), [roles.data, actions.data]);
  const queries = useMemo(() => denialQueryDefs(platform), [platform]);

  return (
    <>
      <BackLink href={authorizationLinks.denials()} label="Denied requests">Back to denied requests</BackLink>
      <PageFocus>
        <PageHeader>
          <PageHeaderGroup>
            <PageTitle>Refusals</PageTitle>
            <PageSubtitle>Every request refused {tenantId ? `in ${tenantName(tenantId)}` : platform ? 'in every tenant' : 'here'} — a row per person, action and page per minute.</PageSubtitle>
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
                  queryFunctions={denialQueryFunctions}
                  columns={denialColumns}
                  getRowId={(row) => row.id}
                  tableId="access-denials-table"
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
                          <DataTableHead column="windowStart">Minute</DataTableHead>
                          <DataTableHead column="actorName">Person</DataTableHead>
                          <DataTableHead column="action">Needed</DataTableHead>
                          <DataTableHead column="route">Page</DataTableHead>
                          <DataTableHead column="count">Times</DataTableHead>
                          <DataTableHeadAction />
                        </DataTableHeaderRow>
                      </DataTableHeader>
                      <DataTableBody>
                        {(row: DenialRow) => (
                          <DataTableRow key={row.id}>
                            <DataTableCell column="windowStart" className="whitespace-nowrap">
                              <DataTableHighlight text={formatDateTime(row.windowStart, { time: true })} item={row} itemKey="windowStart" />
                            </DataTableCell>
                            <DataTableCell column="actorName">
                              <TableRowLink href={backTo(authorizationLinks.person(row.actorId))}>
                                <DataTableHighlight text={row.actorName} item={row} itemKey="actorName" />
                              </TableRowLink>
                              {platform && !tenantId && <div className="text-muted-foreground text-xs">{row.tenantId ? tenantName(row.tenantId) : 'platform'}</div>}
                            </DataTableCell>
                            <DataTableCell column="action">
                              <SimpleBadge>
                                <span>
                                  <DataTableHighlight text={row.action} item={row} itemKey="action" />
                                </span>
                              </SimpleBadge>
                            </DataTableCell>
                            <DataTableCell column="route" className="text-muted-foreground font-mono text-xs">
                              {row.method} {row.route}
                            </DataTableCell>
                            <DataTableCell column="count" className={`font-mono tabular-nums ${row.count > 1 ? 'text-negative' : ''}`}>
                              {formatCount(row.count)}
                            </DataTableCell>
                            <DataTableRowAction>
                              <DropdownMenuLabel>Row actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DataTableRunQueryAction title={`Everything ${row.actorName} was refused`} queryId={authorizationQueryIds.denialsFilter} params={{ actorId: row.actorId }} />
                              <DataTableRunQueryAction title={`Everyone refused ${row.action}`} queryId={authorizationQueryIds.denialsFilter} params={{ action: row.action }} />
                            </DataTableRowAction>
                          </DataTableRow>
                        )}
                      </DataTableBody>
                    </DataTable>
                    <DataTableLoadingBody />
                    <DataTableErrorBody />
                    <DataTableEmptyBody title="Nothing refused" description="Widen the range or clear a filter." />
                    <DataTableFoot />
                  </DataTableWrapper>
                </DataTableWithQueryProvider>
              </MainContent>
            </PageContent>
          </PageWrapper>
        </PageMain>
      </PageFocus>
    </>
  );
}
