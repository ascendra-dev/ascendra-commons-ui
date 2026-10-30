'use client';

import { useMemo, useState } from 'react';
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
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  categoryLabel,
  fileColumns,
  fileFieldOptions,
  fileName,
  fileQueryDefs,
  fileQueryFunctions,
  fileStorageApi,
  fileStorageQueryIds,
  formatBytes,
  pastRetention,
  type FileRow,
} from '@/ascendra-commons-ui/file-storage.ui';
import { useFileScope } from '../_scope';
import { FILE_TENANTS, tenantName } from '../tenants';
import { FileSheet } from '../_file-sheet';

/** Every stored file, newest first — "which documents did Acme upload last week", "what is under legal hold". */
export default function FilesListPage() {
  const { platform } = useFileScope();
  const [selected, setSelected] = useState<FileRow | null>(null);
  // The base catalog — every type's label, whichever tenant's files are listed.
  const categories = useQuery({ queryKey: ['file-categories', null], queryFn: () => fileStorageApi.categories(), staleTime: 60_000 });
  const fieldOptions = useMemo(() => fileFieldOptions(categories.data ?? [], FILE_TENANTS), [categories.data]);
  const queries = useMemo(() => fileQueryDefs(platform), [platform]);
  // A tenant admin's files are all its own tenant's — no Tenant column.
  const columns = useMemo(() => {
    const all = fileColumns(categories.data);
    return platform ? all : all.filter((c) => c.key !== 'tenantId');
  }, [platform, categories.data]);

  return (
    <PageFocus>
      <PageHeader>
        <PageHeaderGroup>
          <PageTitle>Files</PageTitle>
          <PageSubtitle>Every stored file, newest first — what it is, whose, how long it&apos;s kept and what holds it. A row opens the file.</PageSubtitle>
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
                queryFunctions={fileQueryFunctions}
                columns={columns}
                getRowId={(row) => row.id}
                tableId="file-storage-files-table"
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
                        <DataTableHead column="createdAt">Uploaded</DataTableHead>
                        <DataTableHead column="filename">File</DataTableHead>
                        <DataTableHead column="sizeBytes">Size</DataTableHead>
                        <DataTableHead column="uploadedByName">Uploaded by</DataTableHead>
                        {platform && <DataTableHead column="tenantId">Tenant</DataTableHead>}
                        <DataTableHead column="retainUntil">Kept until</DataTableHead>
                        <DataTableHead column="attachmentCount">Attached to</DataTableHead>
                        <DataTableHeadAction />
                      </DataTableHeaderRow>
                    </DataTableHeader>
                    <DataTableBody>
                      {(row: FileRow) => (
                        <DataTableRow key={row.id} active={row.id === selected?.id} opensSheet className="cursor-pointer" onClick={() => setSelected(row)}>
                          <DataTableCell column="createdAt" className="whitespace-nowrap">
                            <DataTableHighlight text={formatDateTime(row.createdAt, { time: true })} item={row} itemKey="createdAt" />
                          </DataTableCell>
                          <DataTableCell column="filename" className="whitespace-nowrap">
                            <div>
                              <DataTableHighlight text={fileName(row)} item={row} itemKey="filename" />
                              {row.scanVerdict === 'unscannable' && (
                                <SimpleBadge variant="orange" className="ml-1.5">
                                  not scanned
                                </SimpleBadge>
                              )}
                            </div>
                            <div className="text-muted-foreground text-xs">{categoryLabel(row.category, categories.data)}</div>
                          </DataTableCell>
                          <DataTableCell column="sizeBytes" className="text-right whitespace-nowrap tabular-nums">
                            {formatBytes(row.sizeBytes)}
                          </DataTableCell>
                          <DataTableCell column="uploadedByName" className="whitespace-nowrap">
                            <DataTableHighlight text={row.uploadedByName ?? row.uploadedBy} item={row} itemKey="uploadedByName" />
                          </DataTableCell>
                          {platform && (
                            <DataTableCell column="tenantId" className="whitespace-nowrap">
                              {tenantName(row.tenantId)}
                            </DataTableCell>
                          )}
                          <DataTableCell column="retainUntil" className="whitespace-nowrap">
                            <KeptUntil row={row} />
                          </DataTableCell>
                          <DataTableCell column="attachmentCount" className="text-right tabular-nums">
                            {row.attachmentCount === 0 ? <SimpleBadge variant="secondary">orphan</SimpleBadge> : row.attachmentCount}
                          </DataTableCell>
                          <DataTableRowAction>
                            <DropdownMenuLabel>Row actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DataTableRunQueryAction title="Filter by upload type" queryId={fileStorageQueryIds.advancedFilter} params={{ category: row.category }} />
                            <DataTableRunQueryAction title={`Everything ${row.uploadedByName ?? row.uploadedBy} uploaded`} queryId={fileStorageQueryIds.advancedFilter} params={{ uploadedBy: row.uploadedBy }} />
                            <DataTableCopyValueAction title="Copy file ID" value={row.id} icon={<LuCopy />} />
                          </DataTableRowAction>
                        </DataTableRow>
                      )}
                    </DataTableBody>
                  </DataTable>
                  <DataTableLoadingBody />
                  <DataTableErrorBody />
                  <DataTableEmptyBody title="No files match" description="Clear a filter or widen the range." />
                  <DataTableFoot />
                </DataTableWrapper>
                {selected && <FileSheet file={selected} categories={categories.data} onClose={() => setSelected(null)} />}
              </DataTableWithQueryProvider>
            </MainContent>
          </PageContent>
        </PageWrapper>
      </PageMain>
    </PageFocus>
  );
}

/** The retention date fixed at upload — "held" while under legal hold (with the date it passed), "indefinite" without one. */
function KeptUntil({ row }: { row: FileRow }) {
  if (row.heldAt) {
    return (
      <span>
        <SimpleBadge variant="blue">held</SimpleBadge>
        {row.retainUntil && pastRetention(row) && <span className="text-muted-foreground"> · was {formatDateTime(row.retainUntil)}</span>}
      </span>
    );
  }
  if (!row.retainUntil) return <span className="text-muted-foreground">indefinite</span>;
  return <DataTableHighlight text={formatDateTime(row.retainUntil)} item={row} itemKey="retainUntil" />;
}
