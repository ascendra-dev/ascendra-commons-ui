'use client';

import { useRouter } from 'next/navigation';
import { LuArrowUpRight, LuDownload } from 'react-icons/lu';
import {
  Button,
  CopyText,
  DataTable,
  DataTableBar,
  DataTableBarAction,
  DataTableBarContent,
  DataTableBody,
  DataTableCell,
  DataTableColumnManager,
  DataTableFilterBar,
  DataTableFilterDropdown,
  DataTableFoot,
  DataTableHead,
  DataTableHeader,
  DataTableHeaderRow,
  DataTableHighlight,
  DataTableRow,
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
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import { auditEventColumns, auditQueryDefs } from '@/ascendra-commons-ui/audit-logging.ui/queries';
import { auditLogLinks } from '@/ascendra-commons-ui/audit-logging.ui/links';
import { mockAuditQueryFunctions, mockDownloadCsv } from '@/ascendra-commons-ui/audit-logging.ui/mocks';
import type { AuditEvent } from '@/ascendra-commons-ui/audit-logging.ui/api';

/** testbed has no live backend — using mock fetchers (see page.tsx's own comment upstream). */
const queryFunctions = mockAuditQueryFunctions;
const downloadCsv = mockDownloadCsv;

/** Reads the confirmed query's params so "Export CSV" downloads exactly what's on screen. */
function ExportCsvButton() {
  const { confirmedParams } = useQueryContext();

  const handleExport = async () => {
    const params = confirmedParams ?? {};
    const toStr = (v: unknown) => (typeof v === 'string' && v.length > 0 ? v : undefined);
    const toISO = (v: unknown) => (v instanceof Date ? v.toISOString() : undefined);
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

/** The primary filterable Audit Log feed. */
export default function AuditLogListPage() {
  const router = useRouter();

  return (
    <>
      <PageHeader>
        <PageHeaderGroup>
          <PageTitle>Audit Log</PageTitle>
          <PageSubtitle>Every recorded change, who made it, and when.</PageSubtitle>
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
                        <DataTableHead column="actor">
                          Actor
                        </DataTableHead>
                        <DataTableHead column="action">
                          Action
                        </DataTableHead>
                        <DataTableHead column="entityType">
                          Entity
                        </DataTableHead>
                        <DataTableHead column="tenantId">
                          Tenant
                        </DataTableHead>
                        <DataTableHead column="reason">
                          Reason
                        </DataTableHead>
                        <DataTableHead column="correlationId">
                          Correlation
                        </DataTableHead>
                      </DataTableHeaderRow>
                    </DataTableHeader>
                    <DataTableBody>
                      {(row: AuditEvent) => (
                        <DataTableRow
                          key={row.id}
                          className="cursor-pointer"
                          onClick={() => router.push(auditLogLinks.eventDetail(row.id))}
                        >
                          <DataTableCell column="occurredAt" className="whitespace-nowrap">
                            <DataTableHighlight
                              text={formatDateTime(row.occurredAt, { time: true })}
                              item={row}
                              itemKey="occurredAt"
                            />
                          </DataTableCell>
                          <DataTableCell column="actor">
                            <span
                              className="hover:underline"
                              role="link"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(auditLogLinks.actorActivity(row.actor));
                              }}
                            >
                              <DataTableHighlight text={row.actor} item={row} itemKey="actor" />
                            </span>
                          </DataTableCell>
                          <DataTableCell column="action">
                            <SimpleBadge>{row.action}</SimpleBadge>
                          </DataTableCell>
                          <DataTableCell column="entityType">
                            <div
                              className="flex flex-col gap-0.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(auditLogLinks.entityHistory(row.entityType, row.entityId));
                              }}
                            >
                              <SimpleBadge variant="secondary" className="w-fit cursor-pointer">
                                {row.entityType}
                              </SimpleBadge>
                              <span className="font-mono text-muted-foreground cursor-pointer text-xs hover:underline">
                                {row.entityId}
                              </span>
                            </div>
                          </DataTableCell>
                          <DataTableCell column="tenantId">
                            {row.tenantId ?? <SimpleBadge variant="info">platform</SimpleBadge>}
                          </DataTableCell>
                          <DataTableCell column="reason">
                            {row.reason ? <DataTableHighlight text={row.reason} item={row} itemKey="reason" /> : '—'}
                          </DataTableCell>
                          <DataTableCell column="correlationId">
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <CopyText value={row.correlationId} className="font-mono text-xs" showTooltip />
                              <button
                                type="button"
                                title="View trace"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => router.push(auditLogLinks.trace(row.correlationId))}
                              >
                                <LuArrowUpRight className="size-3.5" />
                              </button>
                            </div>
                          </DataTableCell>
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
