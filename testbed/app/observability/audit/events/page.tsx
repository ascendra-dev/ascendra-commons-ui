'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  DataTable,
  DataTableBar,
  DataTableBarAction,
  DataTableBarContent,
  DataTableBody,
  DataTableCell,
  DataTableColumnManager,
  DataTableCopyValueAction,
  DataTableEmptyBody,
  DataTableErrorBody,
  DataTableExportButton,
  DataTableFilterBar,
  DataTableFilterDropdown,
  DataTableFoot,
  DataTableHead,
  DataTableHeadAction,
  DataTableHeader,
  DataTableHeaderRow,
  DataTableHighlight,
  DataTableLoadingBody,
  DataTableRow,
  DataTableRowAction,
  DataTableSearchInput,
  DataTableSheetNavigator,
  DataTableSortDropdown,
  DataTableWithQueryProvider,
  DataTableWrapper,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  IdText,
  MainContent,
  PageContent,
  PageHeader,
  PageHeaderGroup,
  PageMain,
  PageSubtitle,
  PageTitle,
  PageWrapper,
  QueryBar,
  QueryParamPanel,
  SimpleBadge,
  WithEmptyValue,
  WithTooltip,
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  auditEventColumns,
  auditFieldOptionsFor,
  auditQueryDefs,
} from '@/ascendra-commons-ui/audit-logging.ui/queries';
import { auditLogLinks } from '@/ascendra-commons-ui/audit-logging.ui/links';
import {
  mockAuditQueryFunctions,
  mockCatalog,
  mockExportEvents,
} from '@/ascendra-commons-ui/audit-logging.ui/mocks';
import type { AuditEvent } from '@/ascendra-commons-ui/audit-logging.ui/api';
import { AuditEventDetailSheet } from '../_audit-event-detail-sheet';

/** testbed has no live backend — using mock fetchers (see page.tsx's own comment upstream). */
const queryFunctions = mockAuditQueryFunctions;
const fetchCatalog = mockCatalog;
const exportEvents = mockExportEvents;


/** The primary filterable Audit Log feed. */
export default function AuditLogListPage() {
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  const catalog = useQuery({ queryKey: ['audit-catalog'], queryFn: fetchCatalog, staleTime: Infinity });
  const fieldOptions = useMemo(() => auditFieldOptionsFor(catalog.data ?? []), [catalog.data]);

  return (
    <>
      <PageHeader>
        <PageHeaderGroup>
          <PageTitle>Audit Log</PageTitle>
          <PageSubtitle>
            Every recorded change, who made it, and when.
          </PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <PageMain>
        <PageWrapper>
          <PageContent>
            <MainContent>
              <DataTableWithQueryProvider
                queries={auditQueryDefs}
                fieldOptions={fieldOptions}
                queryFunctions={queryFunctions}
                columns={auditEventColumns}
                getRowId={(row) => row.id}
                tableId="audit-log-table"
              >
                <QueryBar />
                <QueryParamPanel />
                <DataTableBar>
                  <DataTableBarContent>
                    <DataTableSearchInput />
                    <DataTableColumnManager />
                    <DataTableSortDropdown />
                    <DataTableFilterDropdown />
                  </DataTableBarContent>
                  <DataTableBarAction>
                    <DataTableExportButton exportFn={exportEvents} />
                  </DataTableBarAction>
                </DataTableBar>
                <DataTableFilterBar />
                <DataTableWrapper>
                  <DataTable scrollable horizontal height={480}>
                    <DataTableHeader>
                      <DataTableHeaderRow>
                        <DataTableHead column="occurredAt">
                          Occurred at
                        </DataTableHead>
                        <DataTableHead column="actor">Actor</DataTableHead>
                        <DataTableHead column="action">Action</DataTableHead>
                        <DataTableHead column="entityType">
                          Entity
                        </DataTableHead>
                        <DataTableHead column="tenantId">Tenant</DataTableHead>
                        <DataTableHead column="reason">Reason</DataTableHead>
                        <DataTableHead column="correlationId">
                          Correlation
                        </DataTableHead>
                        <DataTableHeadAction />
                      </DataTableHeaderRow>
                    </DataTableHeader>
                    <DataTableBody>
                      {(row: AuditEvent) => (
                        <DataTableRow
                          key={row.id}
                          active={row.id === selected?.id}
                          className="cursor-pointer"
                          onClick={() => setSelected(row)}
                        >
                          <DataTableCell
                            column="occurredAt"
                            className="whitespace-nowrap"
                          >
                            <DataTableHighlight
                              text={formatDateTime(row.occurredAt, {
                                time: true,
                              })}
                              item={row}
                              itemKey="occurredAt"
                            />
                          </DataTableCell>
                          <DataTableCell column="actor">
                            <Link
                              href={auditLogLinks.actorActivity(row.actor)}
                              className="hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DataTableHighlight
                                text={row.actor}
                                item={row}
                                itemKey="actor"
                              />
                            </Link>
                          </DataTableCell>
                          <DataTableCell column="action">
                            <SimpleBadge>
                              <span>
                                <DataTableHighlight
                                  text={row.action}
                                  item={row}
                                  itemKey="action"
                                />
                              </span>
                            </SimpleBadge>
                          </DataTableCell>
                          <DataTableCell column="entityType">
                            <div className="flex flex-col gap-0.5">
                              <SimpleBadge
                                variant="secondary"
                                className="w-fit"
                              >
                                {row.entityType}
                              </SimpleBadge>
                              <Link
                                href={auditLogLinks.entityHistory(
                                  row.entityType,
                                  row.entityId,
                                )}
                                className="hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <IdText
                                  value={row.entityId}
                                  size="lg"
                                  copyable={false}
                                  className="text-muted-foreground text-xs"
                                  showTooltip={false}
                                />
                              </Link>
                            </div>
                          </DataTableCell>
                          <DataTableCell column="tenantId">
                            {row.tenantId ? (
                              <DataTableHighlight
                                text={row.tenantId}
                                item={row}
                                itemKey="tenantId"
                              />
                            ) : (
                              <SimpleBadge variant="info">platform</SimpleBadge>
                            )}
                          </DataTableCell>
                          <DataTableCell column="reason">
                            <WithEmptyValue value={row.reason}>
                              <WithTooltip
                                tooltip={row.reason}
                                className="line-clamp-3 w-64"
                              >
                                <DataTableHighlight
                                  text={row.reason!}
                                  item={row}
                                  itemKey="reason"
                                />
                              </WithTooltip>
                            </WithEmptyValue>
                          </DataTableCell>
                          <DataTableCell column="correlationId">
                            <Link
                              href={auditLogLinks.trace(row.correlationId)}
                              className="hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <IdText
                                value={row.correlationId}
                                size="lg"
                                copyable={false}
                                showTooltip={false}
                              />
                            </Link>
                          </DataTableCell>
                          <DataTableRowAction>
                            <DropdownMenuLabel>Row actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DataTableCopyValueAction
                              title="Copy Entity ID"
                              value={row.entityId}
                            />
                            <DataTableCopyValueAction
                              title="Copy Correlation ID"
                              value={row.correlationId}
                            />
                            <DataTableCopyValueAction
                              title="Copy Row ID"
                              value={row.id}
                            />
                          </DataTableRowAction>
                        </DataTableRow>
                      )}
                    </DataTableBody>
                  </DataTable>
                  <DataTableLoadingBody />
                  <DataTableErrorBody />
                  <DataTableEmptyBody />
                  <DataTableFoot />
                </DataTableWrapper>
                {selected && (
                  <AuditEventDetailSheet
                    record={selected}
                    onClose={() => setSelected(null)}
                    navigator={
                      <DataTableSheetNavigator<AuditEvent>
                        selectedId={selected.id}
                        onSelect={setSelected}
                      />
                    }
                  />
                )}
              </DataTableWithQueryProvider>
            </MainContent>
          </PageContent>
        </PageWrapper>
      </PageMain>
    </>
  );
}
