'use client';

import { useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BackLink,
  Button,
  Card,
  CardFooter,
  CardFooterIcon,
  CardHeader,
  CardHeaderSubtitle,
  CardHeaderTitle,
  CardTable,
  DashboardContent,
  DataTableErrorBody,
  DataTableLoadingBody,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  PageHeader,
  PageHeaderAction,
  PageHeaderGroup,
  PageSubtitle,
  PageTitle,
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
import {
  categoryStatus,
  contentTypesLabel,
  durationLabel,
  fileStorageApi,
  fileStorageLinks,
  formatBytes,
  isTightened,
  retentionLabel,
  TUNABLE_FIELDS,
  type FileCategoryOverride,
  type FileCategoryRules,
  type FileCategoryView,
} from '@/ascendra-commons-ui/file-storage.ui';
import { TenantPicker, useFileScope } from '../../_scope';
import { tenantName } from '../../tenants';
import { RulesDialog } from './_rules-dialog';

const sizeBand = (rules: Pick<FileCategoryRules, 'minSizeBytes' | 'maxSizeBytes'>) =>
  rules.minSizeBytes && rules.minSizeBytes > 1 ? `${formatBytes(rules.minSizeBytes)} – ${formatBytes(rules.maxSizeBytes)}` : `up to ${formatBytes(rules.maxSizeBytes)}`;

const extensionsLabel = (exts: string[] | undefined) => (exts && exts.length > 0 ? exts.join(' ') : 'not checked');

interface RuleRow {
  key: string;
  label: string;
  base: ReactNode;
  /** The tenant's column: its own value (tightened), or how it relates to the base. */
  tenant: ReactNode;
  tightened?: boolean;
}

/** One rule side by side — the app's, and the tenant's own where it set one. */
function ruleRows(view: FileCategoryView): RuleRow[] {
  const { base } = view;
  const o: Partial<FileCategoryOverride> = view.override ?? {};
  const inherits = <span className="text-muted-foreground">inherits</span>;
  const own = (set: unknown, value: ReactNode) => (set != null ? value : inherits);
  return [
    { key: 'types', label: 'Content types', base: contentTypesLabel(base.allowedContentTypes), tenant: own(o.allowedContentTypes, contentTypesLabel(o.allowedContentTypes ?? [])), tightened: o.allowedContentTypes != null },
    { key: 'exts', label: 'Extensions', base: extensionsLabel(base.allowedExtensions), tenant: own(o.allowedExtensions, extensionsLabel(o.allowedExtensions ?? undefined)), tightened: o.allowedExtensions != null },
    {
      key: 'size',
      label: 'Size',
      base: sizeBand(base),
      tenant: o.maxSizeBytes != null || o.minSizeBytes != null ? sizeBand({ minSizeBytes: o.minSizeBytes ?? base.minSizeBytes, maxSizeBytes: o.maxSizeBytes ?? base.maxSizeBytes }) : inherits,
      tightened: o.maxSizeBytes != null || o.minSizeBytes != null,
    },
    { key: 'scan', label: 'If unscannable', base: base.onUnscannable === 'reject' ? 'refuse' : 'store', tenant: own(o.onUnscannable, o.onUnscannable === 'reject' ? 'refuse' : 'store'), tightened: o.onUnscannable != null },
    {
      key: 'link',
      label: 'Shared links last',
      base: base.signedLinkExpirySeconds ? durationLabel(base.signedLinkExpirySeconds) : 'the app’s default',
      tenant: own(o.signedLinkExpirySeconds, o.signedLinkExpirySeconds ? durationLabel(o.signedLinkExpirySeconds) : null),
      tightened: o.signedLinkExpirySeconds != null,
    },
    { key: 'kept', label: 'Kept', base: retentionLabel(base.retention), tenant: <span className="text-muted-foreground">the app&apos;s — not a tenant&apos;s to change</span> },
    { key: 'bucket', label: 'Bucket', base: <span className="font-mono text-xs">{base.bucket}</span>, tenant: <span className="text-muted-foreground">—</span> },
  ];
}

/**
 * One upload type's rules — the base the app declares beside a tenant's tightening — and the edit that may only narrow
 * them. A platform admin with no tenant picked sees the base alone and may turn the type off (or back on) for everyone.
 */
export default function UploadTypePage() {
  const { key: raw } = useParams<{ key: string }>();
  const key = decodeURIComponent(raw);
  const { platform, tenantId, can } = useFileScope();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<'edit' | 'off' | 'reset' | null>(null);
  const view = useQuery({ queryKey: ['file-category', key, tenantId ?? null], queryFn: () => fileStorageApi.category(key, tenantId) });
  const v = view.data;
  const manage = can('file.category.manage');
  // A tenant's own column: a tenant admin's, or a platform admin's with a tenant picked.
  const forTenant = !!tenantId;
  const tenant = tenantId ? tenantName(tenantId) : '';
  const status = v ? categoryStatus(v) : 'on';

  const refresh = () => queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith('file-categor') });
  const change = useMutation({
    mutationFn: async (what: 'off' | 'on' | 'reset') => {
      const t = platform ? tenantId : undefined;
      if (what === 'off') return fileStorageApi.deactivateCategory(key, t);
      if (what === 'on') return fileStorageApi.updateCategory(key, { active: true, ...(t ? { tenantId: t } : {}) });
      return fileStorageApi.updateCategory(key, { ...Object.fromEntries(TUNABLE_FIELDS.map((f) => [f, null])), ...(t ? { tenantId: t } : {}) });
    },
    onSuccess: async (_r, what) => {
      const label = v?.base.label ?? key;
      if (what === 'off') toast.success(`${label} turned off`, { description: forTenant ? `${tenant}'s uploads of it are refused.` : 'Every upload of it is refused, for every tenant.' });
      if (what === 'on') toast.success(`${label} turned back on`, { description: forTenant ? `${tenant} can upload it again.` : 'Every tenant can upload it again — unless it turned it off for itself.' });
      if (what === 'reset') toast.success(`${tenant} uses the app's rules again`, { description: `${label} — its own tightening is gone.` });
      setDialog(null);
      await refresh();
    },
    onError: (error) => toast.error("Couldn't change it", { description: error instanceof Error ? error.message : undefined }),
  });

  const rows = v ? ruleRows(v) : [];
  const offLabel = forTenant ? `Turn off for ${tenant}` : 'Turn off for everyone';
  const onLabel = forTenant ? `Turn back on for ${tenant}` : 'Turn back on';

  return (
    <>
      <BackLink href={fileStorageLinks.types()} label="Upload types">
        Back to upload types
      </BackLink>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>{v?.base.label ?? key}</PageTitle>
          <PageSubtitle>
            {v?.base.description ? `${v.base.description} · ` : ''}
            <span className="font-mono">{key}</span>
          </PageSubtitle>
        </PageHeaderGroup>
        {platform && (
          <PageHeaderAction className="flex w-fit gap-2">
            <TenantPicker />
          </PageHeaderAction>
        )}
      </PageHeader>
      <DashboardContent>
        {status === 'off' && <SimpleAlert variant="warning">Turned off for everyone — every upload of this type is refused, whatever a tenant set.</SimpleAlert>}
        {status === 'tenant-off' && <SimpleAlert variant="warning">Turned off for {tenant} — its uploads of this type are refused.</SimpleAlert>}
        <Card>
          <CardHeader>
            <CardHeaderTitle>Rules</CardHeaderTitle>
            <CardHeaderSubtitle>
              {forTenant ? `The app's rule beside ${tenant}'s — its own is highlighted` : 'The app declares these in code; a tenant may only tighten them'}
            </CardHeaderSubtitle>
          </CardHeader>
          <CardTable>
            <Table>
              <TableHeader>
                <TableHeaderRow>
                  <TableHead className="w-40" />
                  <TableHead>The app&apos;s rule</TableHead>
                  {forTenant && <TableHead>{tenant}</TableHead>}
                </TableHeaderRow>
              </TableHeader>
              {v && (
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.key}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{r.label}</TableCell>
                      <TableCell>{r.base}</TableCell>
                      {forTenant && <TableCell className={cn(r.tightened && 'text-primary font-medium')}>{r.tenant}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
            <DataTableLoadingBody isLoading={view.isLoading} className="h-65" />
            <DataTableErrorBody isError={view.isError} error={view.error} onRetry={() => view.refetch()} className="h-65" />
          </CardTable>
          {manage && v && (
            <CardFooter className="flex flex-wrap gap-2">
              {forTenant && status !== 'off' && (
                <Button disabled={status === 'tenant-off'} onClick={() => setDialog('edit')}>
                  Edit {tenant}&apos;s rules
                </Button>
              )}
              {(forTenant ? status === 'tenant-off' : status === 'off') ? (
                <Button variant="secondary" disabled={change.isPending} onClick={() => change.mutate('on')}>
                  {onLabel}
                </Button>
              ) : (
                status !== 'off' && (
                  <Button variant="secondary" onClick={() => setDialog('off')}>
                    {offLabel}
                  </Button>
                )
              )}
              {forTenant && isTightened(v) && (
                <Button variant="secondary" onClick={() => setDialog('reset')}>
                  Go back to the app&apos;s rules
                </Button>
              )}
            </CardFooter>
          )}
          {!forTenant && platform && (
            <CardFooter>
              <CardFooterIcon />
              <span>Pick a tenant to see or tighten its own rules.</span>
            </CardFooter>
          )}
        </Card>
        {v && <UsageNote view={v} tenantId={tenantId} />}
      </DashboardContent>

      {dialog === 'edit' && v && <RulesDialog view={v} tenantId={platform ? tenantId : undefined} tenant={tenant} onClose={() => setDialog(null)} onSaved={refresh} />}

      <Dialog open={dialog === 'off' || dialog === 'reset'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog === 'reset' ? `Go back to the app's rules for ${tenant}?` : `${offLabel}?`}</DialogTitle>
            <DialogDescription>
              {dialog === 'reset'
                ? `${tenant}'s own tightening of ${v?.base.label} goes; its uploads pass the app's rules again.`
                : forTenant
                  ? `${tenant}'s uploads of ${v?.base.label} are refused until it's turned back on. Files already stored stay.`
                  : `Every tenant's uploads of ${v?.base.label} are refused until it's turned back on. Files already stored stay.`}{' '}
              Audited, with what it was before.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button disabled={change.isPending} onClick={() => change.mutate(dialog === 'reset' ? 'reset' : 'off')}>
              {change.isPending ? 'Saving…' : dialog === 'reset' ? 'Go back' : 'Turn off'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** How much of this type there is — from the catalog list, which carries usage. */
function UsageNote({ view, tenantId }: { view: FileCategoryView; tenantId: string | undefined }) {
  const list = useQuery({ queryKey: ['file-categories', tenantId ?? null], queryFn: () => fileStorageApi.categories(tenantId) });
  const usage = list.data?.find((c) => c.key === view.key)?.usage;
  if (!usage) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SimpleBadge variant="secondary">
        {formatCount(usage.fileCount)} {usage.fileCount === 1 ? 'file' : 'files'} · {formatBytes(usage.totalBytes)}
      </SimpleBadge>
      {usage.lastUploadedAt && <SimpleBadge variant="secondary">last upload {formatDateTime(usage.lastUploadedAt)}</SimpleBadge>}
    </div>
  );
}
