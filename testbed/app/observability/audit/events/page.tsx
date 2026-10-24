'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BackLink,
  DataTable,
  DataTableBar,
  DataTableBarAction,
  DataTableBarContent,
  DataTableBody,
  DataTableCell,
  DataTableColumnManager,
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
  DataTableRunQueryAction,
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
  PageFocus,
  PageFocusToggle,
  PageHeaderAction,
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  auditFieldOptionsFor,
  auditListViewFor,
  auditQueryFunctions,
  auditQueryIds,
} from '@/ascendra-commons-ui/audit-logging.ui/queries';
import { auditApi, type AuditCatalog, type AuditEvent } from '@/ascendra-commons-ui/audit-logging.ui/api';
import { auditActionLabel } from '@/ascendra-commons-ui/audit-logging.ui/display';
import { auditLogLinks } from '@/ascendra-commons-ui/audit-logging.ui/links';
import { AuditEventDetailSheet } from './_audit-event-detail-sheet';
import { AuditActorActivitySheet } from './_audit-actor-activity-sheet';
import { AuditEntityHistorySheet } from './_audit-entity-history-sheet';
import { AuditTraceSheet } from './_audit-trace-sheet';
import { useSession } from '../../auth/use-session';

/** The real audit API (`NEXT_PUBLIC_API_URL` — ascendra-commons-sandbox in the testbed). */
const queryFunctions = auditQueryFunctions;
const fetchCatalog = auditApi.catalog;
/** Until the catalog loads — empty selects. A module constant, so the field options don't rebuild every render. */
const EMPTY_CATALOG: AuditCatalog = { entries: [], applications: [] };
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
  const fieldOptions = useMemo(() => auditFieldOptionsFor(catalog.data ?? EMPTY_CATALOG), [catalog.data]);
  // A tenant admin only ever sees their own tenant: no Tenant column or filter (see auditListViewFor).
  const tenantScoped = useSession().data?.actor?.tenantId != null;
  const { columns, queryDefs } = useMemo(() => auditListViewFor(tenantScoped), [tenantScoped]);

  return (
    <>
      <BackLink href={auditLogLinks.overview()} label="Audit log">Back to overview</BackLink>
      <PageFocus>
        <PageHeader>
          <PageHeaderGroup>
            <PageTitle>Audit Log</PageTitle>
            <PageSubtitle>
              Every recorded change, who made it, and when.
            </PageSubtitle>
          </PageHeaderGroup>
          <PageHeaderAction className="w-fit">
            <PageFocusToggle />
          </PageHeaderAction>
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
                    <DataTable scrollable horizontal>
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
                            opensSheet
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
                            {/* The row's spare width, a long actor truncated — so the table fits its card and the row's
                                end (its sheet icon, its menu) stays in view. */}
                            <DataTableCell column="actor" className="w-full max-w-0">
                              <button
                                type="button"
                                className="flex max-w-full cursor-pointer hover:underline"
                                title={row.actor}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCellSheet({ kind: 'actor', actor: row.actor });
                                }}
                              >
                                <WithSheetIcon className="min-w-0">
                                  <span className="truncate">
                                    <DataTableHighlight
                                      text={row.actor}
                                      item={row}
                                      itemKey="actor"
                                    />
                                  </span>
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
                                      className="text-muted-foreground text-xs"
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
                                    className="text-muted-foreground"
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
                              {/* A fresh Advanced Filter run on this row's value, over the filter's default range (the past
                                  90 days). The ids are copyable in the record's sheet. */}
                              <DataTableRunQueryAction
                                title="Filter by actor"
                                queryId={auditQueryIds.advancedFilter}
                                params={{ actor: row.actor }}
                              />
                              <DataTableRunQueryAction
                                title="Filter by action"
                                queryId={auditQueryIds.advancedFilter}
                                params={{ entityType: row.entityType, action: row.action }}
                              />
                              <DataTableRunQueryAction
                                title="Filter by entity"
                                queryId={auditQueryIds.advancedFilter}
                                params={{ entityType: row.entityType, entityId: row.entityId }}
                              />
                              <DataTableRunQueryAction
                                title="Filter by correlation"
                                queryId={auditQueryIds.advancedFilter}
                                params={{ correlationId: row.correlationId }}
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
      </PageFocus>
    </>
  );
}
