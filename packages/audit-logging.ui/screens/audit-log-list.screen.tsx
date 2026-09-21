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
  PageHeader,
  PageHeaderGroup,
  PageSubtitle,
  PageTitle,
  QueryBar,
  QueryParamPanel,
  SimpleBadge,
  useQueryContext,
  type QueryFunctionMap,
} from '@/ascendra-ui';
import { auditApi } from '../api/audit-api.client';
import { auditEventColumns, auditQueryDefs, auditQueryFunctions } from '../queries';
import { auditLogLinks } from '../links';
import type { AuditEvent, AuditQuery } from '../api/audit-api.types';

export interface AuditLogListScreenProps {
  queryFunctions?: QueryFunctionMap<AuditEvent>;
  downloadCsv?: (query: Omit<AuditQuery, 'limit' | 'cursor'>) => Promise<Blob>;
}

/** Reads the confirmed query's params so "Export CSV" downloads exactly what's on screen. */
function ExportCsvButton({ downloadCsv }: { downloadCsv: (query: Omit<AuditQuery, 'limit' | 'cursor'>) => Promise<Blob> }) {
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

/** The one screen audit-logging.ui's nav.ts entry points to. */
export function AuditLogListScreen({
  queryFunctions = auditQueryFunctions,
  downloadCsv = (q) => auditApi.downloadEventsCsv(q),
}: AuditLogListScreenProps) {
  const router = useRouter();

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Audit Log</PageTitle>
          <PageSubtitle>Every recorded change, who made it, and when.</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
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
              <ExportCsvButton downloadCsv={downloadCsv} />
            </DataTableBarAction>
          </DataTableBar>
          <DataTableFilterBar />
          <DataTableWrapper>
            <DataTable scrollable horizontal height={480}>
              <DataTableHeader>
                <DataTableHeaderRow>
                  <DataTableHead column="occurredAt" className="whitespace-nowrap">
                    Occurred at
                  </DataTableHead>
                  <DataTableHead column="actor" className="whitespace-nowrap">
                    Actor
                  </DataTableHead>
                  <DataTableHead column="action" className="whitespace-nowrap">
                    Action
                  </DataTableHead>
                  <DataTableHead column="entityType" className="whitespace-nowrap">
                    Entity
                  </DataTableHead>
                  <DataTableHead column="tenantId" className="whitespace-nowrap">
                    Tenant
                  </DataTableHead>
                  <DataTableHead column="reason" className="whitespace-nowrap">
                    Reason
                  </DataTableHead>
                  <DataTableHead column="correlationId" className="whitespace-nowrap">
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
                        text={new Date(row.occurredAt).toLocaleString()}
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
    </>
  );
}
