'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LuCopy } from 'react-icons/lu';
import {
  DataTable,
  DataTableBar,
  DataTableBarContent,
  DataTableBody,
  DataTableCell,
  DataTableColumnManager,
  DataTableCopyValueAction,
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
  PageFocus,
  PageFocusToggle,
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
  WithTooltip,
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  categoryLabel,
  contentTypeLabel,
  fileStorageApi,
  formatBytes,
  REJECTION_REASONS,
  rejectionColumns,
  rejectionFieldOptions,
  rejectionQueryDefs,
  rejectionQueryFunctions,
  rejectionQueryIds,
  rejectionSummary,
  type FileCategorySummary,
  type RejectionRow,
} from '@/ascendra-commons-ui/file-storage.ui';
import { useFileScope } from '../_scope';
import { FILE_TENANTS, tenantName } from '../tenants';

const viewerTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** "Why can't I upload this?" — every refused attempt, newest first, the reason in plain words. Nothing was stored. */
export default function RefusedUploadsPage() {
  const { platform, tenantId } = useFileScope();
  // The viewer's effective catalog — "turned off for this tenant" vs "for everyone" depends on whose.
  const categories = useQuery({ queryKey: ['file-categories', tenantId ?? null], queryFn: () => fileStorageApi.categories(tenantId), staleTime: 60_000 });
  // Keys refused but not declared (an integration's misspelling) — the refusals over the log's life name them.
  const stats = useQuery({ queryKey: ['file-stats', '90', tenantId ?? null], queryFn: () => fileStorageApi.stats(90, viewerTimeZone(), tenantId), staleTime: 60_000 });
  const retention = useQuery({ queryKey: ['file-retention', tenantId ?? null], queryFn: () => fileStorageApi.retention(tenantId), staleTime: 60_000 });
  const fieldOptions = useMemo(
    () => rejectionFieldOptions(categories.data ?? [], FILE_TENANTS, (stats.data?.byCategory ?? []).filter((c) => c.rejected > 0).map((c) => c.category)),
    [categories.data, stats.data],
  );
  const queries = useMemo(() => rejectionQueryDefs(platform), [platform]);
  const columns = useMemo(() => {
    const all = rejectionColumns(categories.data);
    return platform ? all : all.filter((c) => c.key !== 'tenantId');
  }, [platform, categories.data]);
  const kept = retention.data?.policy.rejectionLogDays;

  return (
    <PageFocus>
      <PageHeader>
        <PageHeaderGroup>
          <PageTitle>Refused uploads</PageTitle>
          <PageSubtitle>
            &ldquo;Why can&apos;t I upload this?&rdquo; — every refused attempt, newest first, with the reason. Nothing was stored for these
            {kept ? `; they're kept ${kept} days (they carry filenames)` : ''}.
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
                queries={queries}
                fieldOptions={fieldOptions}
                queryFunctions={rejectionQueryFunctions}
                columns={columns}
                getRowId={(row) => row.id}
                tableId="file-storage-rejections-table"
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
                        <DataTableHead column="occurredAt">When</DataTableHead>
                        <DataTableHead column="filename">File</DataTableHead>
                        <DataTableHead column="reason">Why</DataTableHead>
                        <DataTableHead column="category">Upload type</DataTableHead>
                        <DataTableHead column="actorName">By</DataTableHead>
                        {platform && <DataTableHead column="tenantId">Tenant</DataTableHead>}
                        <DataTableHeadAction />
                      </DataTableHeaderRow>
                    </DataTableHeader>
                    <DataTableBody>
                      {(row: RejectionRow) => (
                        <DataTableRow key={row.id}>
                          <DataTableCell column="occurredAt" className="whitespace-nowrap">
                            <DataTableHighlight text={formatDateTime(row.occurredAt, { time: true })} item={row} itemKey="occurredAt" />
                          </DataTableCell>
                          <DataTableCell column="filename" className="whitespace-nowrap">
                            <DataTableHighlight text={row.filename} item={row} itemKey="filename" />
                            <div className="text-muted-foreground text-xs">
                              {formatBytes(row.sizeBytes)} · {contentTypeLabel(row.contentType)}
                            </div>
                          </DataTableCell>
                          <DataTableCell column="reason" className="min-w-72">
                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                              <SimpleBadge variant={REJECTION_REASONS[row.reason].variant}>{REJECTION_REASONS[row.reason].badge}</SimpleBadge>
                              {/* The API's own words on hover — the plain words are a shortening of them. */}
                              <WithTooltip tooltip={row.message}>
                                <span className="text-muted-foreground">{rejectionSummary(row, categories.data)}</span>
                              </WithTooltip>
                            </div>
                          </DataTableCell>
                          <DataTableCell column="category" className="whitespace-nowrap">
                            <CategoryCell row={row} categories={categories.data} />
                          </DataTableCell>
                          <DataTableCell column="actorName" className="whitespace-nowrap">
                            <DataTableHighlight text={row.actorName ?? row.actorId} item={row} itemKey="actorName" />
                          </DataTableCell>
                          {platform && (
                            <DataTableCell column="tenantId" className="whitespace-nowrap">
                              {tenantName(row.tenantId)}
                            </DataTableCell>
                          )}
                          <DataTableRowAction>
                            <DropdownMenuLabel>Row actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DataTableRunQueryAction title="Filter by why" queryId={rejectionQueryIds.advancedFilter} params={{ reason: row.reason }} />
                            <DataTableRunQueryAction title="Filter by upload type" queryId={rejectionQueryIds.advancedFilter} params={{ category: row.category }} />
                            <DataTableCopyValueAction title="Copy the API's message" value={row.message} icon={<LuCopy />} />
                          </DataTableRowAction>
                        </DataTableRow>
                      )}
                    </DataTableBody>
                  </DataTable>
                  <DataTableLoadingBody />
                  <DataTableErrorBody />
                  <DataTableEmptyBody title="Nothing refused" description="Every upload matching this was stored." />
                  <DataTableFoot />
                </DataTableWrapper>
              </DataTableWithQueryProvider>
            </MainContent>
          </PageContent>
        </PageWrapper>
      </PageMain>
    </PageFocus>
  );
}

/** The type's label — or its key, marked, when the app doesn't declare it. */
function CategoryCell({ row, categories }: { row: RejectionRow; categories: FileCategorySummary[] | undefined }) {
  const known = !categories || categories.some((c) => c.key === row.category);
  if (known) return <DataTableHighlight text={categoryLabel(row.category, categories)} item={row} itemKey="category" />;
  return (
    <span>
      <span className="font-mono text-xs">{row.category}</span>
      <SimpleBadge variant="orange" className="ml-1.5">
        not a type
      </SimpleBadge>
    </span>
  );
}
