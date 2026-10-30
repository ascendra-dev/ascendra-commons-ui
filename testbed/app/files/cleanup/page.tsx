'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useInfiniteQuery, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  CardFooter,
  CardFooterIcon,
  CardHeader,
  CardHeaderSubtitle,
  CardHeaderTitle,
  CardList,
  CardListItem,
  CardPanel,
  CardTable,
  DataTableEmptyBody,
  DataTableErrorBody,
  DataTableLoadingBody,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldHint,
  FieldLabel,
  IdText,
  Input,
  MainContent,
  PageHeader,
  PageHeaderAction,
  PageHeaderGroup,
  PageMain,
  PageSubtitle,
  PageTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SimpleAlert,
  Skeleton,
  TabContent,
  TabList,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
  Tabs,
  TabTrigger,
  toast,
  WithTooltip,
} from '@/ascendra-ui';
import { isApiError } from '@/ascendra-ui/lib/api';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  categoryLabel,
  fileName,
  fileStorageApi,
  formatBytes,
  shortRef,
  type DuplicateGroup,
  type FileCategorySummary,
  type FileRow,
  type StrayBlob,
} from '@/ascendra-commons-ui/file-storage.ui';
import { FileSheet } from '../_file-sheet';
import { TenantPicker, useFileScope } from '../_scope';
import { tenantName } from '../tenants';

const PAGE = 50;
const TABS = ['orphans', 'duplicates', 'stray-blobs'] as const;
type Tab = (typeof TABS)[number];

const errorText = (e: unknown) => (e instanceof Error ? e.message : undefined);

/** Every cleanup read the console holds — what a purge or a delete changed. */
const isCleanupKey = (key: unknown) => ['file-orphans', 'file-orphans-count', 'file-orphan-preview', 'file-stray-blobs', 'file-retention', 'data-table'].includes(String(key));

/**
 * Three kinds of leftover: files attached to nothing, the same bytes stored twice, and bytes in storage that no file
 * record holds. Stray blobs are a platform admin's — a bucket holds every tenant's bytes.
 */
export default function CleanupPage() {
  const { platform, tenantId } = useFileScope();
  const params = useSearchParams();
  const asked = params.get('tab') as Tab | null;
  const opening: Tab = asked && TABS.includes(asked) && (asked !== 'stray-blobs' || platform) ? asked : 'orphans';
  const [open, setOpen] = useState<Pick<FileRow, 'id' | 'filename'> | null>(null);
  const categories = useQuery({ queryKey: ['file-categories', null], queryFn: () => fileStorageApi.categories(), staleTime: 60_000 });
  const orphans = useQuery({ queryKey: ['file-orphans-count', tenantId ?? null], queryFn: () => fileStorageApi.orphans({ tenantId }, 200) });
  const duplicates = useQuery({ queryKey: ['file-duplicates', tenantId ?? null], queryFn: () => fileStorageApi.duplicates(tenantId) });
  const orphanCount = orphans.data ? `${orphans.data.data.length}${orphans.data.meta.nextCursor ? '+' : ''}` : null;
  const copies = duplicates.data?.reduce((n, g) => n + g.fileCount - 1, 0);

  return (
    <>
      <PageHeader>
        <PageHeaderGroup>
          <PageTitle>Cleanup</PageTitle>
          <PageSubtitle>Files attached to nothing, the same bytes stored twice, and bytes in storage that no file record holds.</PageSubtitle>
        </PageHeaderGroup>
        {platform && (
          <PageHeaderAction className="flex w-fit gap-2">
            <TenantPicker />
          </PageHeaderAction>
        )}
      </PageHeader>
      <PageMain>
        <Tabs key={opening} defaultValue={opening}>
          <TabList>
            <TabTrigger value="orphans">
              Orphaned files{orphanCount !== null && <span className="text-muted-foreground tabular-nums">{orphanCount}</span>}
            </TabTrigger>
            <TabTrigger value="duplicates">
              Duplicates{copies !== undefined && <span className="text-muted-foreground tabular-nums">{formatCount(copies)}</span>}
            </TabTrigger>
            {platform && <TabTrigger value="stray-blobs">Stray blobs</TabTrigger>}
          </TabList>
          <TabContent value="orphans">
            <MainContent>
              <OrphansTab categories={categories.data} onOpen={setOpen} />
            </MainContent>
          </TabContent>
          <TabContent value="duplicates">
            <MainContent>
              <DuplicatesTab groups={duplicates} onOpen={setOpen} />
            </MainContent>
          </TabContent>
          {platform && (
            <TabContent value="stray-blobs">
              <MainContent>
                <StrayBlobsTab categories={categories.data} initialBucket={params.get('bucket')} />
              </MainContent>
            </TabContent>
          )}
        </Tabs>
      </PageMain>
      {open && <FileSheet file={open} categories={categories.data} onClose={() => setOpen(null)} />}
    </>
  );
}

/** Files with no attachment, newest first — a row opens the file; the purge removes the old ones it may. */
function OrphansTab({ categories, onOpen }: { categories: FileCategorySummary[] | undefined; onOpen: (f: Pick<FileRow, 'id' | 'filename'>) => void }) {
  const { platform, tenantId, can } = useFileScope();
  const [purging, setPurging] = useState(false);
  const list = useInfiniteQuery({
    queryKey: ['file-orphans', tenantId ?? null],
    queryFn: ({ pageParam }) => fileStorageApi.orphans({ tenantId }, PAGE, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.meta.nextCursor ?? undefined,
  });
  const rows = list.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderTitle>Orphaned files</CardHeaderTitle>
        <CardHeaderSubtitle>Attached to nothing — a detach or a deleted record left them · a row opens the file</CardHeaderSubtitle>
      </CardHeader>
      <CardTable>
        <Table>
          <TableHeader>
            <TableHeaderRow>
              <TableHead>Uploaded</TableHead>
              <TableHead>File</TableHead>
              <TableHead className="text-right">Size</TableHead>
              {platform && <TableHead>Tenant</TableHead>}
            </TableHeaderRow>
          </TableHeader>
          {rows.length > 0 && (
            <TableBody>
              {rows.map((o) => (
                <TableRow key={o.id} className="cursor-pointer" onClick={() => onOpen(o)}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(o.createdAt, { time: true })}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {fileName(o)}
                    <div className="text-muted-foreground text-xs">{categoryLabel(o.category, categories)}</div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">{formatBytes(o.sizeBytes)}</TableCell>
                  {platform && <TableCell className="whitespace-nowrap">{tenantName(o.tenantId)}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
        <DataTableLoadingBody isLoading={list.isLoading} className="h-48" />
        <DataTableErrorBody isError={list.isError} error={list.error} onRetry={() => list.refetch()} className="h-48" />
        <DataTableEmptyBody isLoading={list.isLoading} isEmpty={!!list.data && rows.length === 0} title="No orphans" description="Every file is attached to something." className="h-48" />
      </CardTable>
      <CardFooter className="flex flex-wrap items-center gap-2">
        {can('file.delete') && rows.length > 0 && (
          <Button variant="secondary" onClick={() => setPurging(true)}>
            Purge old orphans…
          </Button>
        )}
        {list.hasNextPage && (
          <Button variant="secondary" disabled={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
            {list.isFetchingNextPage ? 'Loading…' : 'Show more'}
          </Button>
        )}
        <span className="text-muted-foreground text-xs">
          A purge leaves held files and files inside their retention date — the retention run takes those on their date.
        </span>
      </CardFooter>
      {purging && <PurgeDialog tenantId={tenantId} onClose={() => setPurging(false)} />}
    </Card>
  );
}

/** How old an orphan must be to go — and, before anything goes, what the purge would delete and what it leaves. */
function PurgeDialog({ tenantId, onClose }: { tenantId: string | undefined; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [days, setDays] = useState('30');
  const n = Number(days);
  const valid = Number.isInteger(n) && n >= 1 && n <= 3650;
  const preview = useQuery({
    queryKey: ['file-orphan-preview', n, tenantId ?? null],
    queryFn: () => fileStorageApi.previewOrphanPurge(n, tenantId),
    enabled: valid,
  });
  const p = preview.data;
  const purge = useMutation({
    mutationFn: () => fileStorageApi.purgeOrphans(n, tenantId),
    onSuccess: async (r) => {
      toast.success(`Purged ${formatCount(r.deleted)} ${r.deleted === 1 ? 'orphan' : 'orphans'}`, { description: `${formatBytes(r.bytesFreed)} freed — each audited.` });
      await queryClient.invalidateQueries({ predicate: (q) => isCleanupKey(q.queryKey[0]) });
      onClose();
    },
    onError: (e) => toast.error("Couldn't purge", { description: errorText(e) }),
  });
  const kept = p ? p.held + p.retained : 0;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent focusField>
        <DialogHeader>
          <DialogTitle>Purge old orphans{tenantId ? ` — ${tenantName(tenantId)}` : ''}</DialogTitle>
          <DialogDescription>The record and the bytes go, each audited. It can&apos;t be undone.</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="purge-days">Orphans older than (days)</FieldLabel>
            <Input id="purge-days" type="number" min={1} max={3650} step={1} value={days} onChange={(e) => setDays(e.target.value)} full />
            <FieldHint description="A file only just uploaded may be mid-attach — leave a margin." />
          </Field>
          {!valid ? (
            <p className="text-destructive text-xs">A whole number of days, 1 to 3650.</p>
          ) : !p ? (
            <Skeleton className="h-14 w-full" />
          ) : (
            <SimpleAlert variant={p.purgeable.count > 0 ? 'warning' : 'secondary'}>
              <span>
                {p.purgeable.count > 0
                  ? `${formatCount(p.purgeable.count)} ${p.purgeable.count === 1 ? 'file goes' : 'files go'} (${formatBytes(p.purgeable.bytes)}).`
                  : 'Nothing would go.'}{' '}
                {kept > 0 &&
                  `${formatCount(kept)} ${kept === 1 ? 'stays' : 'stay'}: ${[
                    p.retained > 0 && `${formatCount(p.retained)} inside ${p.retained === 1 ? 'its' : 'their'} retention date`,
                    p.held > 0 && `${formatCount(p.held)} on legal hold`,
                  ]
                    .filter(Boolean)
                    .join(', ')}.`}
              </span>
            </SimpleAlert>
          )}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" disabled={!p || p.purgeable.count === 0 || purge.isPending} onClick={() => purge.mutate()}>
            {purge.isPending ? 'Purging…' : p && p.purgeable.count > 0 ? `Purge ${formatCount(p.purgeable.count)}` : 'Purge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Same bytes, stored more than once — reported, never merged: each copy has its own attachments, retention and hold. */
function DuplicatesTab({
  groups,
  onOpen,
}: {
  groups: { data?: DuplicateGroup[]; isLoading: boolean; isError: boolean; error: unknown; refetch: () => unknown };
  onOpen: (f: Pick<FileRow, 'id' | 'filename'>) => void;
}) {
  const { platform } = useFileScope();
  const [shown, setShown] = useState<string | null>(null);
  const rows = groups.data ?? [];
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderTitle>Same content, stored more than once</CardHeaderTitle>
        <CardHeaderSubtitle>The most wasted first · reported, never merged — each copy has its own attachments, retention and hold</CardHeaderSubtitle>
      </CardHeader>
      <CardPanel>
        {rows.length > 0 && (
          <CardList columns="minmax(0,1fr) auto">
            {rows.map((g) => {
              const key = `${g.tenantId}:${g.contentHash}`;
              return (
                <CardListItem key={key}>
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {formatCount(g.fileCount)} copies
                      <IdText value={g.contentHash} className="text-muted-foreground" />
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {platform ? `${tenantName(g.tenantId)} · ` : ''}
                      {formatDateTime(g.firstUploadedAt)}
                      {g.lastUploadedAt !== g.firstUploadedAt ? ` – ${formatDateTime(g.lastUploadedAt)}` : ''} ·{' '}
                      <button type="button" className="text-primary cursor-pointer underline-offset-2 hover:underline" onClick={() => setShown(shown === key ? null : key)}>
                        {shown === key ? 'hide the copies' : 'show the copies'}
                      </button>
                    </div>
                    {shown === key && <Copies ids={g.fileIds} onOpen={onOpen} />}
                  </div>
                  <div className="self-start text-right whitespace-nowrap tabular-nums">
                    {formatBytes(g.wastedBytes)} <span className="text-muted-foreground">wasted</span>
                  </div>
                </CardListItem>
              );
            })}
          </CardList>
        )}
        <DataTableLoadingBody isLoading={groups.isLoading} className="h-48" />
        <DataTableErrorBody isError={groups.isError} error={groups.error as Error} onRetry={() => groups.refetch()} className="h-48" />
        <DataTableEmptyBody isLoading={groups.isLoading} isEmpty={!!groups.data && rows.length === 0} title="No duplicates" description="No two files hold the same bytes." className="h-48" />
      </CardPanel>
      <CardFooter>
        <CardFooterIcon />
        <span>To keep one copy, open the others and detach or delete them — merging would make one delete remove both.</span>
      </CardFooter>
    </Card>
  );
}

/** A group's copies by name, oldest first — each opens its file. */
function Copies({ ids, onOpen }: { ids: string[]; onOpen: (f: Pick<FileRow, 'id' | 'filename'>) => void }) {
  const files = useQueries({ queries: ids.map((id) => ({ queryKey: ['file', id], queryFn: () => fileStorageApi.file(id) })) });
  return (
    <ul className="mt-1 flex flex-col divide-y rounded-md border">
      {ids.map((id, i) => {
        const f = files[i]?.data?.fileRecord;
        return (
          <li key={id}>
            <button type="button" className="hover:bg-muted flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left" onClick={() => onOpen({ id, filename: f?.filename ?? null })}>
              <span className="min-w-0 truncate">{f ? fileName(f) : <Skeleton className="h-4 w-40" />}</span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {f && `${formatDateTime(f.createdAt)} · ${files[i].data!.attachments.length === 0 ? 'orphan' : `attached to ${files[i].data!.attachments.length}`}`}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Bytes in a bucket no file record holds (older than an hour) — a failed upload's leftovers. Platform admins. */
function StrayBlobsTab({ categories, initialBucket }: { categories: FileCategorySummary[] | undefined; initialBucket: string | null }) {
  const { can } = useFileScope();
  const queryClient = useQueryClient();
  const buckets = [...new Set((categories ?? []).map((c) => c.base.bucket))].sort();
  const [picked, setPicked] = useState<string | null>(initialBucket);
  const bucket = picked && buckets.includes(picked) ? picked : buckets[0];
  const [deleting, setDeleting] = useState<StrayBlob | null>(null);
  const list = useInfiniteQuery({
    queryKey: ['file-stray-blobs-list', bucket],
    queryFn: ({ pageParam }) => fileStorageApi.strayBlobs(bucket!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.meta.nextCursor ?? undefined,
    enabled: !!bucket,
    retry: false,
  });
  const rows = list.data?.pages.flatMap((p) => p.data) ?? [];
  const unsupported = list.isError && isApiError(list.error) && list.error.status === 501;
  const remove = useMutation({
    mutationFn: (b: StrayBlob) => fileStorageApi.deleteStrayBlob(b.fileRef),
    onSuccess: async (_v, b) => {
      toast.success('Stray blob deleted', { description: `${formatBytes(b.sizeBytes)} freed in ${bucket} — audited.` });
      setDeleting(null);
      await queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith('file-stray-blobs') });
    },
    onError: (e) => toast.error("Couldn't delete it", { description: errorText(e) }),
  });

  return (
    <>
    <Select value={bucket ?? ''} onValueChange={setPicked}>
      <SelectTrigger className="w-56" aria-label="Bucket">
        <SelectValue placeholder="Bucket" />
      </SelectTrigger>
      <SelectContent>
        {buckets.map((b) => (
          <SelectItem key={b} value={b}>
            {b}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <Card className="w-full">
      <CardHeader>
        <CardHeaderTitle>Stray blobs{bucket ? ` — ${bucket}` : ''}</CardHeaderTitle>
        <CardHeaderSubtitle>Bytes no file record holds, older than an hour — a failed upload left them</CardHeaderSubtitle>
      </CardHeader>
      <CardTable>
        <Table>
          <TableHeader>
            <TableHeaderRow>
              <TableHead>Path</TableHead>
              <TableHead className="text-right">Size</TableHead>
              <TableHead>Written</TableHead>
              {can('file.delete') && <TableHead />}
            </TableHeaderRow>
          </TableHeader>
          {rows.length > 0 && (
            <TableBody>
              {rows.map((b) => (
                <TableRow key={b.fileRef}>
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    <WithTooltip tooltip={b.fileRef}>
                      <span>{shortRef(b.fileRef)}</span>
                    </WithTooltip>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">{formatBytes(b.sizeBytes)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDateTime(b.modifiedAt, { time: true })}</TableCell>
                  {can('file.delete') && (
                    <TableCell className="text-right">
                      <Button size="sm" variant="secondary" onClick={() => setDeleting(b)}>
                        Delete
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
        <DataTableLoadingBody isLoading={list.isLoading} className="h-40" />
        {unsupported ? (
          <DataTableEmptyBody isLoading={false} isEmpty title="This store can't list its objects" description="Stray blobs need a store that lists a bucket — local disk and S3 do." className="h-40" />
        ) : (
          <DataTableErrorBody isError={list.isError} error={list.error} onRetry={() => list.refetch()} className="h-40" />
        )}
        <DataTableEmptyBody
          isLoading={list.isLoading}
          isEmpty={!!list.data && rows.length === 0 && !list.hasNextPage}
          title="No stray blobs"
          description={`Every object in ${bucket} belongs to a file.`}
          className="h-40"
        />
      </CardTable>
      <CardFooter className="flex flex-wrap items-center gap-2">
        {list.hasNextPage && (
          <Button variant="secondary" disabled={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
            {list.isFetchingNextPage ? 'Looking…' : 'Look further'}
          </Button>
        )}
        <span className="text-muted-foreground text-xs">
          The bucket is read a page at a time{list.hasNextPage ? ' — there’s more of it to look through' : ''}. Deleting re-checks first.
        </span>
      </CardFooter>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this stray blob?</DialogTitle>
            <DialogDescription>
              {deleting && `${formatBytes(deleting.sizeBytes)} in ${bucket}, written ${formatDateTime(deleting.modifiedAt)}.`} It&apos;s checked again first — if a file record
              holds it after all, nothing is deleted. Audited.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" disabled={remove.isPending} onClick={() => deleting && remove.mutate(deleting)}>
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
    </>
  );
}
