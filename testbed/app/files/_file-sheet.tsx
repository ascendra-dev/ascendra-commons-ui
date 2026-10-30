'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorState,
  Field,
  FieldHint,
  FieldLabel,
  IdText,
  InputGroup,
  InputGroupTextarea,
  NormalState,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetKey,
  SheetProperties,
  SheetSection,
  SheetTitle,
  SheetValue,
  SimpleAlert,
  SimpleBadge,
  Skeleton,
  SkeletonState,
  WithEmptyValue,
  WithSkeleton,
  WithState,
  toast,
} from '@/ascendra-ui';
import { isApiError } from '@/ascendra-ui/lib/api';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import { resolveEntityLink } from '@/ascendra-commons-ui/shared/links';
import {
  categoryLabel,
  contentTypeLabel,
  deleteBlocker,
  fileName,
  fileStorageApi,
  formatBytes,
  insideRetention,
  retentionLabel,
  type Attachment,
  type FileCategorySummary,
  type FileDetail,
  type FileRow,
} from '@/ascendra-commons-ui/file-storage.ui';
import { useFileScope } from './_scope';
import { tenantName } from './tenants';

const ACCESS_PAGE = 20;

/** Every file-storage read the console holds — what a hold, a detach or a delete may have changed. */
const refreshFiles = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'data-table' || String(q.queryKey[0]).startsWith('file') });

const errorText = (error: unknown) => (error instanceof Error ? error.message : undefined);

/**
 * One file in full — what it is, where it's attached, how long it's kept and who opened it — and what the viewer may
 * do with it: open it, hold it, detach it, delete it. Each button is there only with its action; one the API would
 * refuse (a held file, a tenant inside retention) stays visible, disabled, with the reason under it.
 */
export function FileSheet({
  file: row,
  categories,
  onClose,
}: {
  /** What the opener already knows — the sheet reads the rest. */
  file: Pick<FileRow, 'id' | 'filename'>;
  categories: FileCategorySummary[] | undefined;
  onClose: () => void;
}) {
  const query = useQuery({ queryKey: ['file', row.id], queryFn: () => fileStorageApi.file(row.id), retry: (n, e) => !(isApiError(e) && e.status === 404) && n < 2 });
  const gone = query.isError && isApiError(query.error) && query.error.status === 404;
  const d = query.data;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <WithState>
          <ErrorState if={query.isError && !gone} title="Couldn't load this file" error={query.error} onRetry={() => query.refetch()} />
          <NormalState if={gone}>
            <SheetHeader>
              <SheetTitle>{fileName(row)}</SheetTitle>
              <SheetDescription>This file was deleted — the audit log says by whom and when.</SheetDescription>
            </SheetHeader>
          </NormalState>
          <NormalState if={!query.isError}>
            <WithSkeleton>
              <SkeletonState if={!d}>
                <SheetHeader>
                  <SheetTitle>{fileName(row)}</SheetTitle>
                  <Skeleton className="h-4 w-56" />
                </SheetHeader>
              </SkeletonState>
              <NormalState if={!!d}>{d && <FileDetailView d={d} categories={categories} onClose={onClose} />}</NormalState>
            </WithSkeleton>
          </NormalState>
        </WithState>
      </SheetContent>
    </Sheet>
  );
}

function FileDetailView({ d, categories, onClose }: { d: FileDetail; categories: FileCategorySummary[] | undefined; onClose: () => void }) {
  const { platform, can } = useFileScope();
  const queryClient = useQueryClient();
  const f = d.fileRecord;
  const [dialog, setDialog] = useState<'hold' | 'release' | 'delete' | null>(null);
  const [detaching, setDetaching] = useState<Attachment | null>(null);
  const category = categories?.find((c) => c.key === f.category);
  const keptUntil = f.retainUntil ? formatDateTime(f.retainUntil) : 'indefinite';
  const blocker = deleteBlocker(f, platform, keptUntil);
  const erasure = platform && insideRetention(f);
  const name = fileName(f);

  const open = useMutation({
    // A window opened in the click itself — a popup blocker allows that one, not one opened after the request returns.
    mutationFn: async () => {
      const tab = window.open('', '_blank');
      try {
        const { url } = await fileStorageApi.downloadUrl(f.id);
        if (tab) {
          tab.opener = null;
          tab.location.href = url;
        } else window.location.assign(url);
      } catch (e) {
        tab?.close();
        throw e;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['file-access-log', f.id] }),
    onError: (error) => toast.error("Couldn't open it", { description: errorText(error) }),
  });

  const release = useMutation({
    mutationFn: () => fileStorageApi.releaseHold(f.id),
    onSuccess: async () => {
      toast.success('Hold released', { description: f.retainUntil ? `${name} is kept until ${keptUntil} again.` : undefined });
      setDialog(null);
      await refreshFiles(queryClient);
    },
    onError: (error) => toast.error("Couldn't release the hold", { description: errorText(error) }),
  });

  const [why, setWhy] = useState('');
  const remove = useMutation({
    mutationFn: () => fileStorageApi.deleteFile(f.id, erasure ? why.trim() : undefined),
    onSuccess: async () => {
      toast.success('File deleted', { description: `${name} and its bytes are gone — audited.` });
      onClose();
      await refreshFiles(queryClient);
    },
    onError: (error) => toast.error("Couldn't delete it", { description: errorText(error) }),
  });

  const detach = useMutation({
    mutationFn: (a: Attachment) => fileStorageApi.detach(f.id, a.id),
    onSuccess: async (_v, a) => {
      toast.success('Detached', { description: `${name} no longer belongs to ${a.attachedToType} ${a.attachedToId}.` });
      setDetaching(null);
      await refreshFiles(queryClient);
    },
    onError: (error) => toast.error("Couldn't detach it", { description: errorText(error) }),
  });

  const actions = can('file.view_content') || can('file.hold') || can('file.delete');

  return (
    <>
      <SheetHeader>
        <SheetTitle className="break-all">{name}</SheetTitle>
        <SheetDescription>
          {categoryLabel(f.category, categories)}
          {platform && ` · ${tenantName(f.tenantId)}`} · {formatBytes(f.sizeBytes)} · {contentTypeLabel(f.contentType)}
        </SheetDescription>
      </SheetHeader>
      <SheetBody>
        {f.legalHold && (
          <SimpleAlert variant="warning">
            <span>
              <span className="font-medium">On legal hold</span> — {f.legalHold.reason}. Placed by {d.heldByName ?? f.legalHold.heldBy},{' '}
              {formatDateTime(f.legalHold.heldAt, { time: true })}. Nobody can delete it, and retention skips it.
            </span>
          </SimpleAlert>
        )}
        <SheetSection>
          <SheetProperties>
            <SheetKey>Uploaded</SheetKey>
            <SheetValue>
              {formatDateTime(f.createdAt, { time: true })} <span className="text-muted-foreground">by {d.uploadedByName ?? f.uploadedBy}</span>
            </SheetValue>
            <SheetKey>Kept until</SheetKey>
            <SheetValue>
              {keptUntil}
              {category && f.retainUntil && <span className="text-muted-foreground"> · {retentionLabel(category.base.retention)}, fixed at upload</span>}
            </SheetValue>
            <SheetKey>Scan</SheetKey>
            <SheetValue>
              {f.scanVerdict === 'clean' && <SimpleBadge variant="green">clean</SimpleBadge>}
              {f.scanVerdict === 'unscannable' && (
                <div className="flex flex-col items-start gap-1">
                  <SimpleBadge variant="orange">not scanned</SimpleBadge>
                  <span className="text-muted-foreground text-xs">
                    The scanner couldn&apos;t read this file (password-protected?). {categoryLabel(f.category, categories)} allows that.
                  </span>
                </div>
              )}
              {f.scanVerdict === null && <span className="text-muted-foreground">not recorded</span>}
            </SheetValue>
            <SheetKey>SHA-256</SheetKey>
            <SheetValue>
              <WithEmptyValue value={f.contentHash}>
                <IdText value={f.contentHash ?? ''} size="lg" />
              </WithEmptyValue>
            </SheetValue>
            <SheetKey>File</SheetKey>
            <SheetValue>
              <IdText value={f.id} size="lg" />
            </SheetValue>
          </SheetProperties>
        </SheetSection>
        <SheetSection>
          <Attachments d={d} canDetach={can('file.delete')} onDetach={setDetaching} />
        </SheetSection>
        <SheetSection>
          <AccessLog fileId={f.id} />
        </SheetSection>
        {!actions && (
          <p className="text-muted-foreground text-xs">
            Opening a file takes <code className="font-mono">file.view_content</code>.
          </p>
        )}
        {can('file.delete') && blocker && <p className="text-muted-foreground mt-2 text-xs">Delete is off: {blocker}</p>}
      </SheetBody>
      {actions && (
        <SheetFooter>
          {can('file.view_content') && (
            <Button disabled={open.isPending} onClick={() => open.mutate()}>
              {open.isPending ? 'Opening…' : 'Open'}
            </Button>
          )}
          {can('file.hold') && (
            <Button variant="secondary" onClick={() => setDialog(f.legalHold ? 'release' : 'hold')}>
              {f.legalHold ? 'Release hold' : 'Place legal hold'}
            </Button>
          )}
          {can('file.delete') && (
            <Button variant="secondary" disabled={!!blocker} onClick={() => setDialog('delete')}>
              Delete
            </Button>
          )}
        </SheetFooter>
      )}

      {dialog === 'hold' && <HoldDialog fileId={f.id} name={name} onClose={() => setDialog(null)} />}

      <Dialog open={dialog === 'release'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release the legal hold?</DialogTitle>
            <DialogDescription>
              {f.retainUntil && new Date(f.retainUntil) <= new Date()
                ? `Its retention date (${keptUntil}) has passed — the next retention run deletes it.`
                : f.retainUntil
                  ? `It can be deleted again from ${keptUntil}, and the retention run deletes it then.`
                  : 'It can be deleted again.'}{' '}
              Audited.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button disabled={release.isPending} onClick={() => release.mutate()}>
              {release.isPending ? 'Releasing…' : 'Release hold'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'delete'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{erasure ? 'Delete before its retention date?' : `Delete ${name}?`}</DialogTitle>
            <DialogDescription>
              The record, every attachment and the bytes go — it can&apos;t be undone.{' '}
              {erasure ? `It's kept until ${keptUntil}; deleting it now is an erasure, and the audit log records it as one.` : 'Audited.'}
            </DialogDescription>
          </DialogHeader>
          {(d.attachments.length > 0 || erasure) && (
            <DialogBody className="flex flex-col gap-4">
              {d.attachments.length > 0 && (
                <SimpleAlert variant="warning">
                  {d.attachments.length === 1 ? `It's still attached to ${d.attachments[0].attachedToType} ${d.attachments[0].attachedToId}.` : `It's still attached to ${d.attachments.length} records.`}
                </SimpleAlert>
              )}
              {erasure && (
                <Field>
                  <FieldLabel htmlFor="erasure-reason">Why it goes early</FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea id="erasure-reason" rows={3} maxLength={500} value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Erasure request ER-2210 from the data subject" />
                  </InputGroup>
                  <FieldHint description="Required — the audit log records it with the deletion." />
                </Field>
              )}
            </DialogBody>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" disabled={remove.isPending || (erasure && !why.trim())} onClick={() => remove.mutate()}>
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detaching} onOpenChange={(o) => !o && setDetaching(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detach from {detaching?.attachedToType}?</DialogTitle>
            <DialogDescription>
              {detaching?.attachedToType} {detaching?.attachedToId} no longer has this file; the file itself stays.{' '}
              {d.attachments.length === 1 ? 'It’s the last one — the file becomes an orphan, which Cleanup can purge.' : ''} Audited.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button disabled={detach.isPending} onClick={() => detaching && detach.mutate(detaching)}>
              {detach.isPending ? 'Detaching…' : 'Detach'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** What holds the file — each entity, linked when the app registered a route for its type. */
function Attachments({ d, canDetach, onDetach }: { d: FileDetail; canDetach: boolean; onDetach: (a: Attachment) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-medium">Attached to</h3>
      {d.attachments.length === 0 ? (
        <p className="text-muted-foreground">Nothing — it&apos;s an orphan. Cleanup can purge it once it&apos;s past its retention date.</p>
      ) : (
        <ul className="flex flex-col divide-y rounded-md border">
          {d.attachments.map((a) => {
            const href = resolveEntityLink(a.attachedToType, a.attachedToId);
            return (
              <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <span className="capitalize">{a.attachedToType}</span>{' '}
                  {href ? (
                    <Link href={href} className="text-primary font-mono text-xs underline-offset-2 hover:underline">
                      {a.attachedToId}
                    </Link>
                  ) : (
                    <span className="font-mono text-xs">{a.attachedToId}</span>
                  )}
                  <div className="text-muted-foreground text-xs">since {formatDateTime(a.createdAt)}</div>
                </div>
                {canDetach && (
                  <Button size="sm" variant="secondary" onClick={() => onDetach(a)}>
                    Detach
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Who opened it, newest first — a person in the app, or a shared link (no person). */
function AccessLog({ fileId }: { fileId: string }) {
  const log = useInfiniteQuery({
    queryKey: ['file-access-log', fileId],
    queryFn: ({ pageParam }) => fileStorageApi.accessLog(fileId, ACCESS_PAGE, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.meta.nextCursor ?? undefined,
  });
  const rows = log.data?.pages.flatMap((p) => p.data) ?? [];

  let body;
  if (log.isError) body = <p className="text-destructive">Couldn&apos;t load who opened it{errorText(log.error) ? ` — ${errorText(log.error)}` : ''}.</p>;
  else if (!log.data) body = <Skeleton className="h-16 w-full" />;
  else if (rows.length === 0) body = <p className="text-muted-foreground">Nobody has opened it.</p>;
  else {
    body = (
      <>
        <ul className="flex flex-col divide-y rounded-md border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <span>
                {r.via === 'signed-link' ? 'Via a shared link' : (r.actorName ?? r.actorId)}
                {r.via === 'actor' && <span className="text-muted-foreground"> · {r.purpose === 'in-app' ? 'in the app' : r.purpose}</span>}
              </span>
              <span className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">{formatDateTime(r.occurredAt, { time: true })}</span>
            </li>
          ))}
        </ul>
        {log.hasNextPage && (
          <Button variant="secondary" size="sm" className="self-start" disabled={log.isFetchingNextPage} onClick={() => log.fetchNextPage()}>
            {log.isFetchingNextPage ? 'Loading…' : 'Show more'}
          </Button>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-medium">Opened</h3>
      {body}
    </div>
  );
}

/** A reason is required — it shows on the file and in the audit log. */
function HoldDialog({ fileId, name, onClose }: { fileId: string; name: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const hold = useMutation({
    mutationFn: () => fileStorageApi.placeHold(fileId, reason.trim()),
    onSuccess: async () => {
      toast.success('Legal hold placed', { description: `Nobody can delete ${name} until it's released.` });
      onClose();
      await refreshFiles(queryClient);
    },
    onError: (error) => toast.error("Couldn't place the hold", { description: errorText(error) }),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent focusField>
        <DialogHeader>
          <DialogTitle>Place a legal hold</DialogTitle>
          <DialogDescription>While held, nobody can delete this file and retention skips it. You can release it later.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field>
            <FieldLabel htmlFor="hold-reason">Reason</FieldLabel>
            <InputGroup>
              <InputGroupTextarea
                id="hold-reason"
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Data-protection investigation INV-77 — do not delete"
              />
            </InputGroup>
            <FieldHint description="Required — it shows on the file and in the audit log." />
          </Field>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button disabled={!reason.trim() || hold.isPending} onClick={() => hold.mutate()}>
            {hold.isPending ? 'Placing…' : 'Place hold'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
