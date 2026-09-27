'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LuDownload } from 'react-icons/lu';
import {
  Button,
  DataTable,
  DataTableBar,
  DataTableBarAction,
  DataTableBarContent,
  DataTableBody,
  DataTableCell,
  DataTableColumnManager,
  DataTableCopyValueAction,
  DataTableFilterBar,
  DataTableFilterDropdown,
  DataTableFoot,
  DataTableHead,
  DataTableHeader,
  DataTableHeaderRow,
  DataTableHighlight,
  DataTableRow,
  DataTableRowAction,
  DataTableSearchInput,
  DataTableSortDropdown,
  DataTableWithQueryProvider,
  DataTableWrapper,
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
  WithTooltip,
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  auditEventColumns,
  auditQueryDefs,
} from '@/ascendra-commons-ui/audit-logging.ui/queries';
import { auditLogLinks } from '@/ascendra-commons-ui/audit-logging.ui/links';
import {
  mockAuditQueryFunctions,
  mockDownloadCsv,
} from '@/ascendra-commons-ui/audit-logging.ui/mocks';
import type { AuditEvent } from '@/ascendra-commons-ui/audit-logging.ui/api';

/** testbed has no live backend — using mock fetchers (see page.tsx's own comment upstream). */
const queryFunctions = mockAuditQueryFunctions;
const downloadCsv = mockDownloadCsv;

/** Reads the confirmed query's params so "Export CSV" downloads exactly what's on screen. */
function ExportCsvButton() {
  const { confirmedParams } = useQueryContext();

  const handleExport = async () => {
    const params = confirmedParams ?? {};
    const toStr = (v: unknown) =>
      typeof v === 'string' && v.length > 0 ? v : undefined;
    const toISO = (v: unknown) =>
      v instanceof Date ? v.toISOString() : undefined;
    const blob = await downloadCsv({
      entityType: toStr(params.entityType),
      action: toStr(params.action),
      actor: toStr(params.actor),
      correlationId: toStr(params.correlationId),
      occurredAfter: toISO(params.occurredAfter),
      occurredBefore: toISO(params.occurredBefore),
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-events.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="secondary" onClick={handleExport}>
      <LuDownload className="size-3.5" />
      Export CSV
    </Button>
  );
}

/** Empty header cell matching DataTableRowAction's trailing column. */
function ActionsColumnHead() {
  return <th data-slot="table-head" className="py-3 pr-6 pl-5 w-12" />;
}
ActionsColumnHead.isLastColumn = true as const;

/** The primary filterable Audit Log feed. */
export default function AuditLogListPage() {
  const router = useRouter();

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
                    <ExportCsvButton />
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
                        <ActionsColumnHead />
                      </DataTableHeaderRow>
                    </DataTableHeader>
                    <DataTableBody>
                      {(row: AuditEvent) => (
                        <DataTableRow
                          key={row.id}
                          className="cursor-pointer"
                          onClick={() =>
                            router.push(auditLogLinks.eventDetail(row.id))
                          }
                        >
                          <DataTableCell
                            column="occurredAt"
                            className="whitespace-nowrap"
                          >
                            <WithTooltip
                              tooltip={new Date(row.occurredAt).toISOString()}
                            >
                              <DataTableHighlight
                                text={formatDateTime(row.occurredAt, {
                                  time: true,
                                })}
                                item={row}
                                itemKey="occurredAt"
                              />
                            </WithTooltip>
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
                                className="font-mono text-muted-foreground text-xs hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {row.entityId}
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
                              className="font-mono text-xs hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {row.correlationId}
                            </Link>
                          </DataTableCell>
                          <DataTableRowAction>
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
