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
  DataTableSortDropdown,
  DataTableWithQueryProvider,
  DataTableWrapper,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  ExportCsvButton,
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
  useQueryContext,
  WithEmptyValue,
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  auditEventColumns,
  auditFieldOptionsFor,
  auditQueryDefs,
  auditQueryFunctions,
} from '@/ascendra-commons-ui/audit-logging.ui/queries';
import { auditLogLinks } from '@/ascendra-commons-ui/audit-logging.ui/links';
import { auditApi } from '@/ascendra-commons-ui/audit-logging.ui/api';
import type { AuditEvent } from '@/ascendra-commons-ui/audit-logging.ui/api';
import { AuditEventDetailSheet } from '../_audit-event-detail-sheet';

/**
 * The one fetcher this page calls — real API by default. A consumer without
 * a live backend (e.g. testbed) swaps this for a mock from
 * `audit-logging.ui/mocks` instead of editing the page body.
 */
const queryFunctions = auditQueryFunctions;
const fetchCatalog = () => auditApi.catalog();

/** Bridges useQueryContext (only callable inside the provider) to ExportCsvButton's data prop. */
function AuditExportCsvButton() {
  const { data } = useQueryContext();
  return (
    <ExportCsvButton data={data as AuditEvent[]} filename="audit-events.csv" />
  );
}

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
                    <AuditExportCsvButton />
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
                              <DataTableHighlight
                                text={row.reason!}
                                item={row}
                                itemKey="reason"
                              />
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
              </DataTableWithQueryProvider>
            </MainContent>
          </PageContent>
        </PageWrapper>
      </PageMain>
      {selected && (
        <AuditEventDetailSheet
          record={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
