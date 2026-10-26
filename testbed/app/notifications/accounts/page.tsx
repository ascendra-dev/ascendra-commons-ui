'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardHeaderSubtitle,
  CardHeaderTitle,
  CardTable,
  DashboardContent,
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
  InputGroup,
  InputGroupTextarea,
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
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import { channelLabel, notificationApi, type CredentialCheck, type NotificationChannel } from '@/ascendra-commons-ui/notification.ui';
import { useNotificationScope } from '../_scope';
import { NOTIFICATION_TENANTS, tenantName } from '../tenants';

/**
 * Whether a tenant without its own account sends through the platform's — this app's own setting
 * (`NotificationModule.forRoot({ tenantCredentialFallback })`; ascendra-commons-sandbox turns it on).
 */
const TENANT_FALLBACK = true;

/** In-app needs no provider account. */
const CHANNELS: NotificationChannel[] = ['email', 'sms', 'whatsapp'];

const key = (channel: NotificationChannel, tenantId: string | null) => `${channel}:${tenantId ?? ''}`;

interface Check extends CredentialCheck {
  at: Date;
}

/**
 * Which account each tenant sends through on each channel — its own, or the platform's — and whether it works. Keys are
 * write-only: the screen shows only that one exists. Verify asks the provider; its answer is this session's (the API
 * keeps no verify history).
 */
export default function NotificationAccountsPage() {
  const { platform, tenantId: ownTenant, can } = useNotificationScope();
  const manage = can('notification.manage_config');
  const queryClient = useQueryClient();
  const credentials = useQuery({ queryKey: ['notification-credentials'], queryFn: () => notificationApi.credentials() });
  const [checks, setChecks] = useState<Record<string, Check>>({});
  const [setting, setSetting] = useState<{ channel: NotificationChannel; tenantId: string | null } | null>(null);
  const [removing, setRemoving] = useState<{ channel: NotificationChannel; tenantId: string } | null>(null);

  const has = (channel: NotificationChannel, tenantId: string | null) =>
    (credentials.data ?? []).some((c) => c.channel === channel && c.tenantId === tenantId);
  // A platform admin sees every tenant; a tenant admin its own — and the platform's, read-only.
  const tenants = platform ? NOTIFICATION_TENANTS : NOTIFICATION_TENANTS.filter((t) => t.id === ownTenant);
  const mayEdit = (tenantId: string | null) => manage && (platform || (tenantId !== null && tenantId === ownTenant));

  const verify = useMutation({
    mutationFn: ({ channel, tenantId }: { channel: NotificationChannel; tenantId: string | null }) => notificationApi.verifyCredential(channel, tenantId),
    onSuccess: (check, { channel, tenantId }) => setChecks((prev) => ({ ...prev, [key(channel, tenantId)]: { ...check, at: new Date() } })),
    onError: (error) => toast.error("Couldn't check it", { description: error instanceof Error ? error.message : undefined }),
  });
  const remove = useMutation({
    mutationFn: ({ channel, tenantId }: { channel: NotificationChannel; tenantId: string }) => notificationApi.deleteCredential(channel, tenantId),
    onSuccess: async (_v, { channel, tenantId }) => {
      toast.success(`${tenantName(tenantId)}'s ${channelLabel(channel)} account removed`, {
        description: TENANT_FALLBACK ? "Its sends use the platform's account now." : 'Its sends on that channel fail until one is set.',
      });
      setChecks(({ [key(channel, tenantId)]: _gone, ...rest }) => rest);
      setRemoving(null);
      await Promise.all(['notification-credentials', 'notification-gaps', 'notification-type'].map((k) => queryClient.invalidateQueries({ queryKey: [k] })));
    },
    onError: (error) => toast.error("Couldn't remove it", { description: error instanceof Error ? error.message : undefined }),
  });

  const cell = (channel: NotificationChannel, tenantId: string | null) => {
    const own = has(channel, tenantId);
    const check = checks[key(channel, tenantId)];
    const editable = mayEdit(tenantId);
    const actions = (
      <div className="mt-1 flex flex-wrap gap-x-2 text-xs">
        {own && editable && (
          <button type="button" className="text-primary cursor-pointer hover:underline" disabled={verify.isPending} onClick={() => verify.mutate({ channel, tenantId })}>
            Verify
          </button>
        )}
        {editable && (
          <button type="button" className="text-primary cursor-pointer hover:underline" onClick={() => setSetting({ channel, tenantId })}>
            {own ? 'Replace' : 'Set'}
          </button>
        )}
        {own && editable && tenantId !== null && (
          <button type="button" className="text-primary cursor-pointer hover:underline" onClick={() => setRemoving({ channel, tenantId })}>
            Remove
          </button>
        )}
      </div>
    );
    if (!own) {
      const inherited = tenantId !== null && TENANT_FALLBACK && has(channel, null);
      return (
        <>
          {inherited ? <span className="text-muted-foreground">platform&apos;s</span> : <SimpleBadge variant="orange">missing</SimpleBadge>}
          {actions}
        </>
      );
    }
    const label = tenantId === null ? 'set' : 'own';
    return (
      <>
        {!check ? (
          <SimpleBadge>{label}</SimpleBadge>
        ) : !check.supported ? (
          <SimpleBadge variant="secondary">{label} · can&apos;t check</SimpleBadge>
        ) : check.ok ? (
          <SimpleBadge variant="green">{label} · verified</SimpleBadge>
        ) : (
          <SimpleBadge variant="red">{label} · rejected</SimpleBadge>
        )}
        {check && (
          <div className="text-muted-foreground mt-1 text-xs">
            {check.detail ? `${check.detail} · ` : ''}checked {formatDateTime(check.at.toISOString(), { style: 'relative' })}
          </div>
        )}
        {actions}
      </>
    );
  };

  const rows: Array<{ tenantId: string | null; name: string; note?: string }> = [
    { tenantId: null, name: 'Platform', note: TENANT_FALLBACK ? 'tenantless sends · the fallback' : 'tenantless sends' },
    ...tenants.map((t) => ({ tenantId: t.id, name: t.name })),
  ];

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Provider accounts</PageTitle>
          <PageSubtitle>
            Which account each tenant sends through on each channel — its own, or the platform&apos;s — and whether it works. Keys are
            write-only: only that one exists shows here.
          </PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <DashboardContent>
        <Card>
          <CardHeader>
            <CardHeaderTitle>Accounts by tenant and channel</CardHeaderTitle>
            <CardHeaderSubtitle>
              {platform ? 'Every tenant' : `${tenantName(ownTenant)} and the platform's (read-only)`} · in-app needs none
            </CardHeaderSubtitle>
          </CardHeader>
          <CardTable>
            <Table>
              <TableHeader>
                {credentials.data && (
                  <TableHeaderRow>
                    <TableHead />
                    {CHANNELS.map((c) => (
                      <TableHead key={c}>{channelLabel(c)}</TableHead>
                    ))}
                  </TableHeaderRow>
                )}
              </TableHeader>
              {credentials.data && (
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.tenantId ?? 'platform'}>
                      <TableCell className="align-top">
                        <div className="font-medium">{r.name}</div>
                        {r.note && <div className="text-muted-foreground text-xs">{r.note}</div>}
                      </TableCell>
                      {CHANNELS.map((c) => (
                        <TableCell key={c} className="align-top">
                          {cell(c, r.tenantId)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
            <DataTableLoadingBody isLoading={credentials.isLoading} className="h-48" />
            <DataTableErrorBody isError={credentials.isError} error={credentials.error} onRetry={() => credentials.refetch()} className="h-48" />
          </CardTable>
          <CardFooter className="text-muted-foreground text-xs">
            {TENANT_FALLBACK ? "platform's — no own account; sends go through the platform's (the app allows the fallback). " : ''}
            Verify asks the provider whether the key works; a stub provider answers &ldquo;can&apos;t check&rdquo;.
          </CardFooter>
        </Card>
      </DashboardContent>
      {setting && (
        <SetAccountDialog
          channel={setting.channel}
          tenantId={setting.tenantId}
          onClose={() => setSetting(null)}
          onSaved={(check) => setChecks((prev) => ({ ...prev, [key(setting.channel, setting.tenantId)]: { ...check, at: new Date() } }))}
        />
      )}
      {removing && (
        <Dialog open onOpenChange={(open) => !open && setRemoving(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Remove {tenantName(removing.tenantId)}&apos;s {channelLabel(removing.channel)} account?
              </DialogTitle>
              <DialogDescription>
                {TENANT_FALLBACK && has(removing.channel, null)
                  ? `${tenantName(removing.tenantId)}'s ${channelLabel(removing.channel)} sends go through the platform's account from now on.`
                  : `${tenantName(removing.tenantId)}'s ${channelLabel(removing.channel)} sends fail until an account is set.`}{' '}
                Audited.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate(removing)}>
                {remove.isPending ? 'Removing…' : 'Remove'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

/** Set (or replace) an account — the provider's own JSON shape, stored as given, never returned; then checked. */
function SetAccountDialog({
  channel,
  tenantId,
  onClose,
  onSaved,
}: {
  channel: NotificationChannel;
  tenantId: string | null;
  onClose: () => void;
  onSaved: (check: CredentialCheck) => void;
}) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  let parsed: Record<string, unknown> | null = null;
  let parseError: string | null = null;
  if (text.trim()) {
    try {
      const value: unknown = JSON.parse(text);
      if (value && typeof value === 'object' && !Array.isArray(value)) parsed = value as Record<string, unknown>;
      else parseError = 'It must be a JSON object — { "provider": … }.';
    } catch {
      parseError = 'Not valid JSON yet.';
    }
  }
  const whose = tenantId ? `${tenantName(tenantId)}'s` : "the platform's";
  const save = useMutation({
    mutationFn: async () => {
      await notificationApi.setCredential(channel, tenantId, parsed!);
      return notificationApi.verifyCredential(channel, tenantId);
    },
    onSuccess: async (check) => {
      onSaved(check);
      if (check.supported && !check.ok) toast.error(`Saved — but the provider rejected it`, { description: check.detail });
      else toast.success(`Saved ${whose} ${channelLabel(channel)} account`, { description: check.supported ? check.detail : "The provider can't be asked whether it works." });
      await Promise.all(['notification-credentials', 'notification-gaps', 'notification-type'].map((k) => queryClient.invalidateQueries({ queryKey: [k] })));
      onClose();
    },
    onError: (error) => toast.error("Couldn't save it", { description: error instanceof Error ? error.message : undefined }),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl" focusField>
        <DialogHeader>
          <DialogTitle>
            Set {whose} {channelLabel(channel)} account
          </DialogTitle>
          <DialogDescription>Replaces the one there — the old key is never shown.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field>
            <FieldLabel htmlFor="account-config">Configuration</FieldLabel>
            <InputGroup>
              <InputGroupTextarea
                id="account-config"
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="font-mono text-xs"
                placeholder={channel === 'email' ? '{ "provider": "ses", "region": "eu-west-1", "accessKeyId": "…", "secretAccessKey": "…" }' : '{ "provider": "twilio", "accountSid": "AC…", "authToken": "…", "from": "+15550301" }'}
                spellCheck={false}
              />
            </InputGroup>
            {parseError ? (
              <p className="text-destructive text-xs">{parseError}</p>
            ) : (
              <FieldHint description="The provider's own shape. Stored as given, never returned; audited without the value." />
            )}
          </Field>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button disabled={!parsed || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : 'Save and verify'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
