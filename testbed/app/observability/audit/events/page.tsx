'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  WithSheetIcon,
  WithTooltip,
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  auditFieldOptionsFor,
  auditListViewFor,
  auditQueryFunctions,
} from '@/ascendra-commons-ui/audit-logging.ui/queries';
import { auditApi, type AuditEvent } from '@/ascendra-commons-ui/audit-logging.ui/api';
import { auditActionLabel } from '@/ascendra-commons-ui/audit-logging.ui/display';
import { AuditEventDetailSheet } from './_audit-event-detail-sheet';
import { AuditActorActivitySheet } from './_audit-actor-activity-sheet';
import { AuditEntityHistorySheet } from './_audit-entity-history-sheet';
import { AuditTraceSheet } from './_audit-trace-sheet';
import { useSession } from '../../auth/use-session';

/** The real audit API (`NEXT_PUBLIC_API_URL` — ascendra-commons-sandbox in the testbed). */
const queryFunctions = auditQueryFunctions;
const fetchCatalog = auditApi.catalog;
const exportEvents = auditApi.exportEvents;


type CellSheet =
  | { kind: 'actor'; actor: string }
  | { kind: 'entity'; entityType: string; entityId: string }
  | { kind: 'trace'; correlationId: string };

/** The primary filterable Audit Log feed. */
export default function AuditLogListPage() {
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  // The actor / entity / trace sheet opened from a cell. One sheet at a time: opening any sheet closes the other.
  const [cellSheet, setCellSheet] = useState<CellSheet | null>(null);
  const openCellSheet = (sheet: CellSheet) => {
    setSelected(null);
    setCellSheet(sheet);
  };
  const catalog = useQuery({ queryKey: ['audit-catalog'], queryFn: fetchCatalog, staleTime: Infinity });
  const fieldOptions = useMemo(() => auditFieldOptionsFor(catalog.data ?? []), [catalog.data]);
  // A tenant admin only ever sees their own tenant: no Tenant column or filter (see auditListViewFor).
  const tenantScoped = useSession().data?.actor?.tenantId != null;
  const { columns, queryDefs } = useMemo(() => auditListViewFor(tenantScoped), [tenantScoped]);

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
                queries={queryDefs}
                fieldOptions={fieldOptions}
                queryFunctions={queryFunctions}
                columns={columns}
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
                        {!tenantScoped && <DataTableHead column="tenantId">Tenant</DataTableHead>}
                        <DataTableHead column="reason">Reason</DataTableHead>
                        <DataTableHead column="correlationId">
                          Correlation
                        </DataTableHead>
                        <DataTableHead column="application">
                          Application
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
                          onClick={() => {
                            setCellSheet(null);
                            setSelected(row);
                          }}
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
                            <button
                              type="button"
                              className="cursor-pointer hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCellSheet({ kind: 'actor', actor: row.actor });
                              }}
                            >
                              <WithSheetIcon>
                                <DataTableHighlight
                                  text={row.actor}
                                  item={row}
                                  itemKey="actor"
                                />
                              </WithSheetIcon>
                            </button>
                          </DataTableCell>
                          {/* Entity type, action and entity id folded into one cell: `invoice.created`, the id beneath. */}
                          <DataTableCell column="action">
                            <div className="flex flex-col gap-0.5">
                              <SimpleBadge className="w-fit">
                                <span>
                                  <DataTableHighlight
                                    text={auditActionLabel(row)}
                                    item={row}
                                    itemKey="action"
                                  />
                                </span>
                              </SimpleBadge>
                              <button
                                type="button"
                                className="w-fit cursor-pointer text-left hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCellSheet({ kind: 'entity', entityType: row.entityType, entityId: row.entityId });
                                }}
                              >
                                <WithSheetIcon>
                                  <IdText
                                    value={row.entityId}
                                    size="lg"
                                    copyable={false}
                                    className="text-muted-foreground text-xs whitespace-nowrap"
                                    showTooltip={false}
                                  />
                                </WithSheetIcon>
                              </button>
                            </div>
                          </DataTableCell>
                          {!tenantScoped && (
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
                          )}
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
                            <button
                              type="button"
                              className="cursor-pointer text-left hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCellSheet({ kind: 'trace', correlationId: row.correlationId });
                              }}
                            >
                              <WithSheetIcon>
                                <IdText
                                  value={row.correlationId}
                                  size="lg"
                                  className="whitespace-nowrap"
                                  copyable={false}
                                  showTooltip={false}
                                />
                              </WithSheetIcon>
                            </button>
                          </DataTableCell>
                          <DataTableCell column="application">
                            <WithTooltip
                              tooltip={row.application}
                              className="line-clamp-2"
                            >
                              <DataTableHighlight
                                text={row.application}
                                item={row}
                                itemKey="application"
                              />
                            </WithTooltip>
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
                {cellSheet?.kind === 'actor' && (
                  <AuditActorActivitySheet
                    actor={cellSheet.actor}
                    onClose={() => setCellSheet(null)}
                  />
                )}
                {cellSheet?.kind === 'entity' && (
                  <AuditEntityHistorySheet
                    entityType={cellSheet.entityType}
                    entityId={cellSheet.entityId}
                    onClose={() => setCellSheet(null)}
                  />
                )}
                {cellSheet?.kind === 'trace' && (
                  <AuditTraceSheet
                    correlationId={cellSheet.correlationId}
                    onClose={() => setCellSheet(null)}
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
