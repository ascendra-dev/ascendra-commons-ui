'use client';

import Link from 'next/link';
import {
  DataTable,
  DataTableBar,
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
  type QueryFunctionMap,
} from '@/ascendra-ui';
import { auditEventColumns, auditQueryDefs, auditQueryFunctions } from '../queries';
import { auditLogLinks } from '../links';
import type { AuditEvent } from '../api/audit-api.types';

export interface AuditLogListScreenProps {
  queryFunctions?: QueryFunctionMap<AuditEvent>;
}

/** The one screen audit-logging.ui's nav.ts entry points to. */
export function AuditLogListScreen({ queryFunctions = auditQueryFunctions }: AuditLogListScreenProps) {
  return (
    <>
      <PageHeader>
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
          </DataTableBar>
          <DataTableFilterBar />
          <DataTableWrapper>
            <DataTable scrollable horizontal height={480}>
              <DataTableHeader>
                <DataTableHeaderRow>
                  <DataTableHead column="id">Event ID</DataTableHead>
                  <DataTableHead column="occurredAt">Occurred</DataTableHead>
                  <DataTableHead column="entityType">Entity Type</DataTableHead>
                  <DataTableHead column="entityId">Entity ID</DataTableHead>
                  <DataTableHead column="actor">Actor</DataTableHead>
                  <DataTableHead column="action">Action</DataTableHead>
                  <DataTableHead column="tenantId">Tenant</DataTableHead>
                  <DataTableHead column="correlationId">Correlation ID</DataTableHead>
                </DataTableHeaderRow>
              </DataTableHeader>
              <DataTableBody>
                {(row: AuditEvent) => (
                  <DataTableRow key={row.id}>
                    <DataTableCell column="id">
                      <Link href={auditLogLinks.eventDetail(row.id)} className="text-primary hover:underline">
                        {row.id}
                      </Link>
                    </DataTableCell>
                    <DataTableCell column="occurredAt">{new Date(row.occurredAt).toLocaleString()}</DataTableCell>
                    <DataTableCell column="entityType">{row.entityType}</DataTableCell>
                    <DataTableCell column="entityId">
                      <Link
                        href={auditLogLinks.entityHistory(row.entityType, row.entityId)}
                        className="text-primary hover:underline"
                      >
                        {row.entityId}
                      </Link>
                    </DataTableCell>
                    <DataTableCell column="actor">{row.actor}</DataTableCell>
                    <DataTableCell column="action">{row.action}</DataTableCell>
                    <DataTableCell column="tenantId">{row.tenantId ?? '—'}</DataTableCell>
                    <DataTableCell column="correlationId">
                      <Link href={auditLogLinks.trace(row.correlationId)} className="text-primary hover:underline">
                        {row.correlationId}
                      </Link>
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
