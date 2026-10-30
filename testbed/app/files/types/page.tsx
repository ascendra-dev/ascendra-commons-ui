'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardFooter,
  CardFooterIcon,
  CardHeader,
  CardHeaderSubtitle,
  CardHeaderTitle,
  CardTable,
  DashboardContent,
  DataTableEmptyBody,
  DataTableErrorBody,
  DataTableLoadingBody,
  PageHeader,
  PageHeaderAction,
  PageHeaderGroup,
  PageSubtitle,
  PageTitle,
  SimpleBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
  TableRowLink,
} from '@/ascendra-ui';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  categoryStatus,
  contentTypesLabel,
  fileStorageApi,
  fileStorageLinks,
  formatBytes,
  isTightened,
  retentionLabel,
  type FileCategorySummary,
} from '@/ascendra-commons-ui/file-storage.ui';
import { TenantPicker, useFileScope } from '../_scope';
import { tenantName } from '../tenants';

/** Types that take uploads first, the busiest first; a type turned off last. */
const byWeight = (a: FileCategorySummary, b: FileCategorySummary) =>
  Number(categoryStatus(a) !== 'on') - Number(categoryStatus(b) !== 'on') || b.usage.fileCount - a.usage.fileCount || a.base.label.localeCompare(b.base.label);

/**
 * Every kind of file the app accepts — the one place that says what a valid upload of each is, how long it's kept and
 * how much of it there is. Types are declared in code (no "New type"); a tenant may only tighten them.
 */
export default function UploadTypesPage() {
  const { platform, tenantId } = useFileScope();
  const categories = useQuery({ queryKey: ['file-categories', tenantId ?? null], queryFn: () => fileStorageApi.categories(tenantId) });
  const rows = [...(categories.data ?? [])].sort(byWeight);
  // A platform admin with no tenant picked sees the app's base rules; a tenant's view is what its uploads must pass.
  const whose = tenantId ? `${tenantName(tenantId)}'s` : 'the app’s';

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Upload types</PageTitle>
          <PageSubtitle>
            Every kind of file the app accepts — what a valid one is, how long it&apos;s kept, and how much of it there is. These are {whose} rules
            {tenantId ? ', with its own tightening marked' : ''}.
          </PageSubtitle>
        </PageHeaderGroup>
        {platform && (
          <PageHeaderAction className="flex w-fit gap-2">
            <TenantPicker />
          </PageHeaderAction>
        )}
      </PageHeader>
      <DashboardContent>
        <Card collapseable="expanded" maximizable>
          <CardHeader>
            <CardHeaderTitle>Every upload type</CardHeaderTitle>
            <CardHeaderSubtitle>The busiest first · a type turned off last · a row opens its rules</CardHeaderSubtitle>
          </CardHeader>
          <CardTable>
            <Table>
              <TableHeader>
                <TableHeaderRow>
                  <TableHead>Upload type</TableHead>
                  <TableHead>Accepts</TableHead>
                  <TableHead className="text-right">Max size</TableHead>
                  <TableHead>Kept</TableHead>
                  <TableHead>If unscannable</TableHead>
                  <TableHead className="text-right">Files</TableHead>
                  <TableHead>Last upload</TableHead>
                </TableHeaderRow>
              </TableHeader>
              {rows.length > 0 && (
                <TableBody>
                  {rows.map((c) => {
                    const status = categoryStatus(c);
                    const sizeTightened = c.effective.maxSizeBytes < c.base.maxSizeBytes;
                    return (
                      <TableRow key={c.key}>
                        <TableCell className="whitespace-nowrap">
                          <TableRowLink href={fileStorageLinks.type(c.key)}>{c.base.label}</TableRowLink>
                          {status === 'off' && (
                            <SimpleBadge variant="secondary" className="ml-1.5">
                              off for everyone
                            </SimpleBadge>
                          )}
                          {status === 'tenant-off' && (
                            <SimpleBadge variant="secondary" className="ml-1.5">
                              off for {tenantId ? tenantName(tenantId) : 'this tenant'}
                            </SimpleBadge>
                          )}
                          {status === 'on' && isTightened(c) && (
                            <SimpleBadge variant="blue" className="ml-1.5">
                              tightened
                            </SimpleBadge>
                          )}
                          <div className="text-muted-foreground font-mono text-xs">{c.key}</div>
                        </TableCell>
                        <TableCell className="min-w-48">{contentTypesLabel(c.effective.allowedContentTypes)}</TableCell>
                        <TableCell className="text-right whitespace-nowrap tabular-nums">
                          {formatBytes(c.effective.maxSizeBytes)}
                          {sizeTightened && <span className="text-muted-foreground"> of {formatBytes(c.base.maxSizeBytes)}</span>}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{retentionLabel(c.base.retention)}</TableCell>
                        <TableCell>{c.effective.onUnscannable === 'reject' ? 'refuse' : 'store'}</TableCell>
                        <TableCell className="text-right whitespace-nowrap tabular-nums">
                          {formatCount(c.usage.fileCount)}
                          {c.usage.fileCount > 0 && <span className="text-muted-foreground"> · {formatBytes(c.usage.totalBytes)}</span>}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {c.usage.lastUploadedAt ? formatDateTime(c.usage.lastUploadedAt) : <span className="text-muted-foreground">never</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              )}
            </Table>
            <DataTableLoadingBody isLoading={categories.isLoading} className="h-65" />
            <DataTableErrorBody isError={categories.isError} error={categories.error} onRetry={() => categories.refetch()} className="h-65" />
            <DataTableEmptyBody
              isLoading={categories.isLoading}
              isEmpty={!!categories.data && rows.length === 0}
              title="No upload types"
              description="The app declares them in code — its deploy seeds them."
              className="h-65"
            />
          </CardTable>
          <CardFooter>
            <CardFooterIcon />
            <span>Types are declared in code — there&apos;s no &ldquo;New type&rdquo;. A tenant may only tighten one, or turn it off for itself.</span>
          </CardFooter>
        </Card>
      </DashboardContent>
    </>
  );
}
