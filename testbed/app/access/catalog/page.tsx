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
  toast,
  WithTooltip,
} from '@/ascendra-ui';
import { authorizationApi, groupByModule, useActionCatalog, type CatalogAction } from '@/ascendra-commons-ui/authorization.ui';
import { Tile } from '../_tile';
import { useAccessScope } from '../_scope';

/**
 * Every action the app checks, by module — what it means, where it may be granted, which roles grant it — and where
 * the app's code and the catalog table disagree. A platform admin describes actions here; nothing else changes.
 */
export default function AccessCatalogPage() {
  const { platform, can } = useAccessScope();
  const catalog = useActionCatalog();
  const health = useQuery({ queryKey: ['authz-catalog-health'], queryFn: () => authorizationApi.catalogHealth() });
  const [editing, setEditing] = useState<CatalogAction | null>(null);
  const h = health.data;
  const groups = groupByModule(catalog.data ?? [], (a) => a.name);
  const drifted = new Set(h?.inDbNotInCode ?? []);
  const canDescribe = platform && can('authz.manage_catalog');

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Action catalog</PageTitle>
          <PageSubtitle>Every action the app checks — what it means, where it may be granted, which roles grant it.</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <DashboardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Described" value={h ? h.describedCount : null} caption={h ? `of ${h.totalCount} actions` : '…'} loading={health.isLoading} />
          <Tile
            label="Granted, no description"
            value={h ? h.grantedButUndescribed.length : null}
            caption={h?.grantedButUndescribed.join(', ') || 'every granted action is described'}
            tone={h?.grantedButUndescribed.length ? 'warn' : undefined}
            loading={health.isLoading}
          />
          <Tile
            label="In the table, not in code"
            value={h ? h.inDbNotInCode.length : null}
            caption={h?.inDbNotInCode.join(', ') || 'none — renamed or removed actions show here'}
            tone={h?.inDbNotInCode.length ? 'warn' : undefined}
            loading={health.isLoading}
          />
          <Tile
            label="In code, not in the table"
            value={h ? h.inCodeNotInDb.length : null}
            caption={h?.inCodeNotInDb.join(', ') || 'none — the deploy synced the catalog'}
            tone={h?.inCodeNotInDb.length ? 'alert' : undefined}
            loading={health.isLoading}
          />
        </div>

        <Card collapseable="expanded" maximizable>
          <CardHeader>
            <CardHeaderTitle>Actions</CardHeaderTitle>
            <CardHeaderSubtitle>By module · a platform action reads or changes every tenant&apos;s data</CardHeaderSubtitle>
          </CardHeader>
          <CardTable>
            <Table>
              <TableHeader>
                <TableHeaderRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Granted by</TableHead>
                  <TableHead>What it means</TableHead>
                </TableHeaderRow>
              </TableHeader>
              {groups.length > 0 && (
                <TableBody>
                  {groups.flatMap((g) => [
                    // A heading between the actions, not a row of its own — no hover tint.
                    <TableRow key={`group-${g.module}`} className="hover:bg-transparent">
                      <TableCell colSpan={4} className="text-muted-foreground bg-muted/40 py-2 text-[0.6875rem] tracking-wide uppercase">
                        {g.label}
                      </TableCell>
                    </TableRow>,
                    ...g.items.map((a) => (
                      <TableRow key={a.name}>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {a.name}
                          {drifted.has(a.name) && (
                            <WithTooltip tooltip="Not in the app's code any more — renamed or removed. Verify, then a migration deletes it.">
                              <SimpleBadge variant="orange" className="ml-2">
                                not in code
                              </SimpleBadge>
                            </WithTooltip>
                          )}
                        </TableCell>
                        <TableCell>
                          <SimpleBadge variant={a.scope === 'platform' ? 'amber' : 'secondary'}>{a.scope}</SimpleBadge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {a.roleIds.length === 0 ? <span className="text-muted-foreground text-xs">no role</span> : a.roleIds.map((r) => <SimpleBadge key={r}>{r}</SimpleBadge>)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-between gap-2">
                            {a.description ? <span className="text-sm">{a.description}</span> : <SimpleBadge variant="orange">no description</SimpleBadge>}
                            {canDescribe && (
                              <Button variant="ghost" size="sm" onClick={() => setEditing(a)}>
                                {a.description ? 'Edit' : 'Add'}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )),
                  ])}
                </TableBody>
              )}
            </Table>
            <DataTableLoadingBody isLoading={catalog.isLoading} className="h-65" />
            <DataTableErrorBody isError={catalog.isError} error={catalog.error} onRetry={() => catalog.refetch()} className="h-65" />
            <DataTableEmptyBody isLoading={catalog.isLoading} isEmpty={!!catalog.data && groups.length === 0} title="No actions" description="The deploy syncs the app's catalog — none has run." className="h-65" />
          </CardTable>
          <CardFooter>
            <CardFooterIcon />
            <span>
              A role grants actions as the app ships it; &ldquo;all&rdquo;-granting roles aren&apos;t listed per action. Descriptions are the only thing changed here.
            </span>
          </CardFooter>
        </Card>
      </DashboardContent>
      {editing && <DescribeDialog action={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function DescribeDialog({ action, onClose }: { action: CatalogAction; onClose: () => void }) {
  const [text, setText] = useState(action.description ?? '');
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: () => authorizationApi.describeAction(action.name, text.trim() || null),
    onSuccess: async () => {
      toast.success(`${action.name} described`);
      await Promise.all(['authz-actions', 'authz-catalog-health'].map((k) => queryClient.invalidateQueries({ queryKey: [k] })));
      onClose();
    },
    onError: (error) => toast.error("Couldn't save it", { description: error instanceof Error ? error.message : undefined }),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Describe {action.name}</DialogTitle>
          <DialogDescription>What it lets someone do — the people and role screens show this beside it.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field>
            <FieldLabel htmlFor="action-description">Description</FieldLabel>
            <Input id="action-description" value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder="Approve an outbound payout" full />
            <FieldHint description="Up to 500 characters. Empty clears it." />
          </Field>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
