'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
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
  Field,
  FieldHint,
  FieldLabel,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SimpleBadge,
  toast,
} from '@/ascendra-ui';
import {
  channelLabel,
  notificationApi,
  notificationLinks,
  notificationQueryIds,
  reasonLabel,
  type NotificationChannel,
  type NotificationTypeDetail,
  type SendResult,
  type TestRecipient,
} from '@/ascendra-commons-ui/notification.ui';
import { useNotificationScope } from '../_scope';
import { NOTIFICATION_TENANTS, tenantName } from '../tenants';

type To = 'me' | 'colleague' | 'address';
const NO_TENANT = '__none__';

/**
 * Check a route, its templates and the provider account end to end with a real send — marked as a test, hidden from the
 * log unless asked for, left out of the numbers. A tenant admin sends to itself or a colleague in its tenant; a platform
 * admin may also type an address and pick the tenant whose configuration to use.
 */
export function TestSendDialog({ type, onClose }: { type: NotificationTypeDetail; onClose: () => void }) {
  const { platform, actorId, tenantId: scopeTenant } = useNotificationScope();
  const [to, setTo] = useState<To>('me');
  const [colleague, setColleague] = useState('');
  const [address, setAddress] = useState('');
  const [tenant, setTenant] = useState<string>(scopeTenant ?? NO_TENANT);
  const [variables, setVariables] = useState<Record<string, string>>(() =>
    Object.fromEntries(type.variables.map((v) => [v.name, v.sample === undefined ? '' : String(v.sample)])),
  );
  const [result, setResult] = useState<SendResult | null>(null);

  const recipient = (): TestRecipient =>
    to === 'me'
      ? { type: 'user', id: actorId! }
      : to === 'colleague'
        ? { type: 'user', id: colleague.trim() }
        : address.includes('@')
          ? { type: 'raw', email: address.trim() }
          : { type: 'raw', phone: address.trim() };
  const ready = to === 'me' ? !!actorId : to === 'colleague' ? colleague.trim() !== '' : address.trim() !== '';
  const configOf = platform ? (tenant === NO_TENANT ? null : tenant) : undefined;

  const send = useMutation({
    mutationFn: () =>
      notificationApi.testSend({
        recipient: recipient(),
        notificationType: type.name,
        variables,
        ...(platform ? { tenantId: configOf } : {}),
      }),
    onSuccess: (r) => setResult(r),
    onError: (error) => toast.error("Couldn't send the test", { description: error instanceof Error ? error.message : undefined }),
  });

  const channels = Object.entries(result?.channels ?? {}) as Array<[NotificationChannel, NonNullable<SendResult['channels']>[NotificationChannel]]>;
  const logLink = notificationLinks.deliveries({ queryId: notificationQueryIds.advancedFilter, params: { notificationType: type.name, test: 'only' } });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Test send — {type.name}</DialogTitle>
          <DialogDescription>
            A real send through {platform ? (configOf ? `${tenantName(configOf)}'s` : "the platform's") : 'your tenant’s'} routes,
            templates and accounts — marked as a test.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Field>
            <FieldLabel>To</FieldLabel>
            <RadioGroup value={to} onValueChange={(v) => setTo(v as To)} className="grid-cols-1 gap-1" aria-label="To">
              <label className="flex cursor-pointer items-center gap-2">
                <RadioGroupItem value="me" /> Me — {actorId}
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <RadioGroupItem value="colleague" /> {platform ? 'A user' : 'A colleague in my tenant'}
              </label>
              {platform && (
                <label className="flex cursor-pointer items-center gap-2">
                  <RadioGroupItem value="address" /> An email address or phone number
                </label>
              )}
            </RadioGroup>
          </Field>
          {to === 'colleague' && (
            <Field>
              <FieldLabel htmlFor="test-colleague">User id</FieldLabel>
              <Input id="test-colleague" value={colleague} onChange={(e) => setColleague(e.target.value)} placeholder="hana.ito@acme.test" full />
            </Field>
          )}
          {to === 'address' && (
            <Field>
              <FieldLabel htmlFor="test-address">Address</FieldLabel>
              <Input id="test-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="qa@example.test or +15550100" full />
            </Field>
          )}
          {platform && (
            <Field>
              <FieldLabel>Whose configuration</FieldLabel>
              <Select value={tenant} onValueChange={setTenant}>
                <SelectTrigger aria-label="Whose configuration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TENANT}>The platform&apos;s — no tenant</SelectItem>
                  {NOTIFICATION_TENANTS.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          {type.variables.length > 0 && (
            <Field>
              <FieldLabel>Variables</FieldLabel>
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
                {type.variables.map((v) => (
                  <label key={v.name} className="contents">
                    <span className="font-mono text-xs">{v.name}</span>
                    <Input value={variables[v.name] ?? ''} onChange={(e) => setVariables((prev) => ({ ...prev, [v.name]: e.target.value }))} full />
                  </label>
                ))}
              </div>
              <FieldHint description="The type's samples — edit any." />
            </Field>
          )}
          {result && (
            <div className="flex flex-col gap-2 rounded-md border p-3">
              <div className="font-medium">
                Result — {result.status}
                {result.status === 'partial' && <span className="text-muted-foreground font-normal"> · one channel went, one didn&apos;t</span>}
              </div>
              {channels.length === 0 && result.reason && <div className="text-muted-foreground">{reasonLabel(result.reason)}</div>}
              {channels.map(([channel, r]) => (
                <div key={channel} className="flex items-start justify-between gap-3">
                  <div>
                    <div>{channelLabel(channel)}</div>
                    <div className="text-muted-foreground text-xs">{r?.status === 'sent' ? (r.providerMessageId ?? 'sent') : reasonLabel(r?.reason ?? null)}</div>
                  </div>
                  <SimpleBadge variant={r?.status === 'sent' ? 'green' : r?.status === 'skipped' ? 'secondary' : 'red'}>{r?.status}</SimpleBadge>
                </div>
              ))}
              <Link href={logLink} className="text-primary text-xs underline-offset-2 hover:underline">
                See the test sends in the log
              </Link>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
          <Button disabled={!ready || send.isPending} onClick={() => send.mutate()}>
            {send.isPending ? 'Sending…' : result ? 'Send again' : 'Send test'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
