'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  DashboardContent,
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
  Input,
  PageHeader,
  PageHeaderAction,
  PageHeaderGroup,
  PageSubtitle,
  PageTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SimpleAlert,
  SimpleBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
  toast,
} from '@/ascendra-ui';
import { cn } from '@/ascendra-ui/shadcn';
import { formatCount, formatDateTime } from '@/ascendra-ui/utils/common.util';
import { categoryLabel, fileStorageApi, formatBytes, type StorageQuota, type StorageUsageRow } from '@/ascendra-commons-ui/file-storage.ui';
import { TenantPicker, useFileScope } from '../_scope';
import { FILE_TENANTS, tenantName } from '../tenants';

const UNITS = { MB: 1024 ** 2, GB: 1024 ** 3 } as const;
type Unit = keyof typeof UNITS;

/** A tenant this near its limit is called out. */
const NEAR_FULL = 0.9;

interface TenantRow {
  tenantId: string;
  fileCount: number;
  usedBytes: number;
  quota: StorageQuota | null;
}

/**
 * One row per tenant — its files, its bytes, its limit. A limit's own count of what's used wins (it's what the upload
 * check enforces). A platform admin sees every tenant the app has, even one with nothing stored, so a limit can be
 * set before the first upload.
 */
function tenantRows(usage: StorageUsageRow[], quotas: StorageQuota[], every: string[]): TenantRow[] {
  const map = new Map<string, TenantRow>(every.map((id) => [id, { tenantId: id, fileCount: 0, usedBytes: 0, quota: null }]));
  for (const u of usage) {
    const t = map.get(u.tenantId) ?? { tenantId: u.tenantId, fileCount: 0, usedBytes: 0, quota: null };
    map.set(u.tenantId, { ...t, fileCount: t.fileCount + u.fileCount, usedBytes: t.usedBytes + u.totalBytes });
  }
  for (const q of quotas) {
    const t = map.get(q.tenantId) ?? { tenantId: q.tenantId, fileCount: 0, usedBytes: 0, quota: null };
    map.set(q.tenantId, { ...t, fileCount: q.fileCount, usedBytes: q.usedBytes, quota: q });
  }
  return [...map.values()].sort((a, b) => b.usedBytes - a.usedBytes);
}

/** Who uses how much, of what — and each tenant's limit. An upload that would pass it is refused. */
export default function StoragePage() {
  const { platform, tenantId, can } = useFileScope();
  const queryClient = useQueryClient();
  const usage = useQuery({ queryKey: ['file-storage-usage', tenantId ?? null], queryFn: () => fileStorageApi.storageUsage(tenantId) });
  const quotas = useQuery({ queryKey: ['file-quotas', tenantId ?? null], queryFn: () => fileStorageApi.quotas(tenantId) });
  const categories = useQuery({ queryKey: ['file-categories', null], queryFn: () => fileStorageApi.categories(), staleTime: 60_000 });
  const every = platform ? (tenantId ? [tenantId] : FILE_TENANTS.map((t) => t.id)) : [];
  const rows = usage.data && quotas.data ? tenantRows(usage.data, quotas.data, every) : [];
  const [picked, setPicked] = useState<string | null>(null);
  const shown = rows.find((r) => r.tenantId === picked) ?? rows[0];
  const [editing, setEditing] = useState<TenantRow | null>(null);
  const [removing, setRemoving] = useState<TenantRow | null>(null);
  const manage = platform && can('file.quota.manage');
  const isLoading = usage.isLoading || quotas.isLoading;
  const error = usage.isError ? usage : quotas.isError ? quotas : null;

  const refresh = () => queryClient.invalidateQueries({ predicate: (q) => ['file-quotas', 'file-storage-usage'].includes(String(q.queryKey[0])) });
  const remove = useMutation({
    mutationFn: (t: TenantRow) => fileStorageApi.clearQuota(t.tenantId),
    onSuccess: async (_v, t) => {
      toast.success(`${tenantName(t.tenantId)} has no limit now`, { description: 'Its uploads are only checked against each type’s own size.' });
      setRemoving(null);
      await refresh();
    },
    onError: (e) => toast.error("Couldn't remove the limit", { description: e instanceof Error ? e.message : undefined }),
  });

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Storage &amp; limits</PageTitle>
          <PageSubtitle>
            Who uses how much, of what — and each tenant&apos;s limit. An upload that would pass the limit is refused, and shows in Refused uploads.
          </PageSubtitle>
        </PageHeaderGroup>
        {platform && (
          <PageHeaderAction className="flex w-fit gap-2">
            <TenantPicker />
          </PageHeaderAction>
        )}
      </PageHeader>
      <DashboardContent>
        <Card>
          <CardHeader>
            <CardHeaderTitle>{platform && !tenantId ? 'By tenant' : 'Storage'}</CardHeaderTitle>
            <CardHeaderSubtitle>{rows.length > 1 ? 'The fullest first · a row shows its upload types below' : 'Its files against its limit'}</CardHeaderSubtitle>
          </CardHeader>
          <CardTable>
            <Table>
              <TableHeader>
                <TableHeaderRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="text-right">Files</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead>Limit</TableHead>
                  {manage && <TableHead />}
                </TableHeaderRow>
              </TableHeader>
              {rows.length > 0 && (
                <TableBody>
                  {rows.map((t) => {
                    const share = t.quota ? t.usedBytes / t.quota.maxBytes : 0;
                    const full = share >= NEAR_FULL;
                    return (
                      <TableRow
                        key={t.tenantId}
                        className={cn('cursor-pointer', shown?.tenantId === t.tenantId && 'bg-muted/50')}
                        onClick={() => setPicked(t.tenantId)}
                      >
                        <TableCell className="whitespace-nowrap">{tenantName(t.tenantId)}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{formatCount(t.fileCount)}</TableCell>
                        <TableCell className="text-right whitespace-nowrap tabular-nums">{formatBytes(t.usedBytes)}</TableCell>
                        <TableCell className="min-w-64">
                          {t.quota ? (
                            <div className="flex items-center gap-3">
                              <div className="bg-muted flex h-2 w-40 shrink-0 overflow-hidden rounded-full">
                                <div className={full ? 'bg-red-500/80' : 'bg-primary/60'} style={{ width: `${Math.min(100, Math.max(1, share * 100))}%` }} />
                              </div>
                              {full ? (
                                <SimpleBadge variant="red">
                                  of {formatBytes(t.quota.maxBytes)} — {Math.round(share * 100)}%
                                </SimpleBadge>
                              ) : (
                                <span className="text-muted-foreground whitespace-nowrap">
                                  of {formatBytes(t.quota.maxBytes)} — {Math.round(share * 100)}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">no limit</span>
                          )}
                        </TableCell>
                        {manage && (
                          <TableCell className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="secondary" onClick={() => setEditing(t)}>
                                {t.quota ? 'Change' : 'Set a limit'}
                              </Button>
                              {t.quota && (
                                <Button size="sm" variant="secondary" onClick={() => setRemoving(t)}>
                                  Remove
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              )}
            </Table>
            <DataTableLoadingBody isLoading={isLoading} className="h-48" />
            <DataTableErrorBody isError={!!error} error={error?.error} onRetry={() => error?.refetch()} className="h-48" />
            <DataTableEmptyBody isLoading={isLoading} isEmpty={!isLoading && !error && rows.length === 0} title="Nothing stored" className="h-48" />
          </CardTable>
          <CardFooter>
            <CardFooterIcon />
            <span>
              {platform
                ? 'A limit is the platform’s to set — changes are audited with before and after.'
                : 'Your limit is set by the platform. Ask it to raise the limit before uploads are refused.'}
            </span>
          </CardFooter>
        </Card>

        {shown && (
          <TypesCard tenantId={shown.tenantId} usage={(usage.data ?? []).filter((u) => u.tenantId === shown.tenantId)} categories={categories.data} />
        )}
      </DashboardContent>

      {editing && <LimitDialog row={editing} onClose={() => setEditing(null)} onSaved={refresh} />}

      <Dialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removing ? tenantName(removing.tenantId) : ''}&apos;s limit?</DialogTitle>
            <DialogDescription>
              Its uploads are no longer checked against a total — only against each upload type&apos;s own size. Audited, with the limit it had.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button disabled={remove.isPending} onClick={() => removing && remove.mutate(removing)}>
              {remove.isPending ? 'Removing…' : 'Remove the limit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** One tenant's bytes by upload type, the heaviest first. */
function TypesCard({ tenantId, usage, categories }: { tenantId: string; usage: StorageUsageRow[]; categories: Parameters<typeof categoryLabel>[1] }) {
  const rows = [...usage].sort((a, b) => b.totalBytes - a.totalBytes);
  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle>By upload type — {tenantName(tenantId)}</CardHeaderTitle>
        <CardHeaderSubtitle>What its space goes on</CardHeaderSubtitle>
      </CardHeader>
      <CardPanel>
        {rows.length > 0 && (
          <CardList columns="minmax(0,1fr) auto">
            {rows.map((r) => (
              <CardListItem key={r.category}>
                <div>{categoryLabel(r.category, categories)}</div>
                <div className="text-right tabular-nums">
                  {formatBytes(r.totalBytes)} <span className="text-muted-foreground">· {formatCount(r.fileCount)} {r.fileCount === 1 ? 'file' : 'files'}</span>
                </div>
              </CardListItem>
            ))}
          </CardList>
        )}
        <DataTableEmptyBody isLoading={false} isEmpty={rows.length === 0} title="Nothing stored" description="This tenant hasn't uploaded anything yet." className="h-32" />
      </CardPanel>
    </Card>
  );
}

/** Set or change a tenant's limit — in MB or GB, against what it uses now. */
function LimitDialog({ row, onClose, onSaved }: { row: TenantRow; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const start = row.quota?.maxBytes ?? 0;
  const startUnit: Unit = start >= UNITS.GB && start % UNITS.GB === 0 ? 'GB' : 'MB';
  const [amount, setAmount] = useState(start ? String(+(start / UNITS[startUnit]).toFixed(2)) : '');
  const [unit, setUnit] = useState<Unit>(startUnit);
  const bytes = Math.round(Number(amount) * UNITS[unit]);
  const valid = amount.trim() !== '' && Number.isFinite(bytes) && bytes >= 1;
  const under = valid && bytes < row.usedBytes;
  const who = tenantName(row.tenantId);

  const save = useMutation({
    mutationFn: () => fileStorageApi.setQuota(row.tenantId, bytes),
    onSuccess: async () => {
      toast.success(`${who}'s limit is ${formatBytes(bytes)}`, { description: `It uses ${formatBytes(row.usedBytes)} now.` });
      await onSaved();
      onClose();
    },
    onError: (e) => toast.error("Couldn't set the limit", { description: e instanceof Error ? e.message : undefined }),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent focusField>
        <DialogHeader>
          <DialogTitle>{row.quota ? `Change ${who}'s limit` : `Set a limit for ${who}`}</DialogTitle>
          <DialogDescription>
            {who} uses {formatBytes(row.usedBytes)} across {formatCount(row.fileCount)} {row.fileCount === 1 ? 'file' : 'files'}
            {row.quota ? ` — limit ${formatBytes(row.quota.maxBytes)}, set ${formatDateTime(row.quota.updatedAt)}` : ''}. Audited.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="limit-amount">Limit</FieldLabel>
            <div className="flex gap-2">
              <Input id="limit-amount" type="number" min={0} step="any" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} full />
              <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
                <SelectTrigger className="w-24" aria-label="Unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MB">MB</SelectItem>
                  <SelectItem value="GB">GB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FieldHint description="Every upload is checked against it — one that would pass it is refused." />
          </Field>
          {under && (
            <SimpleAlert variant="warning">
              That&apos;s under what {who} uses now ({formatBytes(row.usedBytes)}) — every upload is refused until files are deleted.
            </SimpleAlert>
          )}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button disabled={!valid || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
