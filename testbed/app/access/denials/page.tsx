'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CardHeaderSubtitle,
  CardHeaderTitle,
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
  useBackTo,
} from '@/ascendra-ui';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  authorizationApi,
  authorizationFieldOptions,
  authorizationLinks,
  authorizationQueryIds,
  denialColumns,
  denialQueryDefs,
  denialQueryFunctions,
  personLabel,
  useActionCatalog,
  usePeopleNames,
  useRoles,
  type DenialRow,
} from '@/ascendra-commons-ui/authorization.ui';
import { TenantPicker, useAccessScope } from '../_scope';
import { ACCESS_TENANTS, tenantName } from '../tenants';

const PERIODS = [
  { value: 'day', label: 'Past 24 hours', days: 1 },
  { value: 'week', label: 'Past 7 days', days: 7 },
  { value: 'month', label: 'Past 30 days', days: 30 },
] as const;
type Period = (typeof PERIODS)[number];

/** The ranked panels show this many, then scroll. */
const TOP_VISIBLE = 5;

/**
 * Every "you don't have permission" the app answered, counted per person, action and page per minute — a missing
 * grant shows up here before anyone files a ticket; so does someone trying doors. The period picks the panels; the
 * list has its own filter. Kept 90 days.
 */
export default function AccessDenialsPage() {
  const { platform, tenantId } = useAccessScope();
  const backTo = useBackTo('denied requests');
  const [periodValue, setPeriodValue] = useState<Period['value']>('week');
  const period = PERIODS.find((p) => p.value === periodValue)!;
  const roles = useRoles();
  const actions = useActionCatalog();
  const fieldOptions = useMemo(() => authorizationFieldOptions(roles.data ?? [], actions.data ?? [], ACCESS_TENANTS), [roles.data, actions.data]);
  const queries = useMemo(() => denialQueryDefs(platform), [platform]);
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
      <PageHeader>
        <PageHeaderGroup>
          <PageTitle>Denied requests</PageTitle>
          <PageSubtitle>Who was refused what {tenantId ? `in ${tenantName(tenantId)}` : platform ? 'in every tenant' : 'here'} — a missing grant, or someone trying doors.</PageSubtitle>
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
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <SegmentControl segments={PERIODS} value={period.value} onValueChange={(v) => setPeriodValue(v as Period['value'])} />
                <span className="text-muted-foreground text-xs">
                  {summary.data ? `${formatCount(summary.data.total)} refused, ${formatCount(summary.data.actors)} ${summary.data.actors === 1 ? 'person' : 'people'}` : ' '}
                </span>
              </div>
              <div className="mb-6 grid grid-cols-12 gap-4">
                <div className="col-span-12 lg:col-span-6">
                  <TableWrapper>
                    <Table visibleRows={TOP_VISIBLE}>
                      <TableHeader>
                        <TableHeaderRow size="lg">
                          <TableHead colSpan={3}>
                            <CardHeaderTitle>Most refused</CardHeaderTitle>
                            <CardHeaderSubtitle>{period.label} · the action they lacked</CardHeaderSubtitle>
                          </TableHead>
                        </TableHeaderRow>
                      </TableHeader>
                      {summary.data && summary.data.topActions.length > 0 && (
                        <TableBody>
                          {summary.data.topActions.map((a) => (
                            <TableRow key={a.action}>
                              <TableCell>
                                <TableRowLink href={authorizationLinks.denials({ queryId: authorizationQueryIds.denialsFilter, params: { action: a.action, deniedRange: range } })}>
                                  <SimpleBadge>{a.action}</SimpleBadge>
                                </TableRowLink>
                                <div className="text-muted-foreground mt-1 text-xs">{formatCount(a.actors)} {a.actors === 1 ? 'person' : 'people'}</div>
                              </TableCell>
                              <TableCell className="text-right align-top font-mono tabular-nums">{formatCount(a.count)}</TableCell>
                              <TableCell className="w-2/5 align-top">
                                <div className="bg-muted mt-1.5 h-2 overflow-hidden rounded-full">
                                  <div className="bg-negative/60 h-full rounded-full" style={{ width: `${topAction ? (a.count / topAction) * 100 : 0}%` }} />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      )}
                    </Table>
                    <DataTableLoadingBody isLoading={summary.isLoading} className="h-56" />
                    <DataTableErrorBody isError={summary.isError} error={summary.error} onRetry={() => summary.refetch()} className="h-56" />
                    <DataTableEmptyBody isLoading={summary.isLoading} isEmpty={!!summary.data && summary.data.total === 0} title="Nothing refused" description="Try a longer period." className="h-56" />
                  </TableWrapper>
                </div>
                <div className="col-span-12 lg:col-span-6">
                  <TableWrapper>
                    <Table visibleRows={TOP_VISIBLE}>
                      <TableHeader>
                        <TableHeaderRow size="lg">
                          <TableHead colSpan={2}>
                            <CardHeaderTitle>Most refused people</CardHeaderTitle>
                            <CardHeaderSubtitle>{period.label} · refusals and how many actions</CardHeaderSubtitle>
                          </TableHead>
                        </TableHeaderRow>
                      </TableHeader>
                      {summary.data && summary.data.topActors.length > 0 && (
                        <TableBody>
                          {summary.data.topActors.map((a) => (
                            <TableRow key={a.actorId}>
                              <TableCell>
                                <TableRowLink href={authorizationLinks.denials({ queryId: authorizationQueryIds.denialsFilter, params: { actorId: a.actorId, deniedRange: range } })}>
                                  {personLabel(a.actorId, names)}
                                </TableRowLink>
                                <div className="text-muted-foreground mt-1 text-xs">
                                  {a.actions} {a.actions === 1 ? 'action' : 'actions'}
                                  {platform && !tenantId ? ` · ${a.tenantId ? tenantName(a.tenantId) : 'platform'}` : ''}
                                </div>
                              </TableCell>
                              <TableCell className="text-right align-top font-mono tabular-nums">{formatCount(a.count)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      )}
                    </Table>
                    <DataTableLoadingBody isLoading={summary.isLoading} className="h-56" />
                    <DataTableEmptyBody isLoading={summary.isLoading} isEmpty={!!summary.data && summary.data.total === 0} title="Nobody refused" description="Try a longer period." className="h-56" />
                  </TableWrapper>
                </div>
              </div>

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
                  <DataTable scrollable horizontal height={480}>
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
    </>
  );
}
