'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from '@/ascendra-ui';
import { channelLabel, NOTIFICATION_CHANNELS, notificationApi, type NotificationChannel } from '@/ascendra-commons-ui/notification.ui';
import { tenantName } from '../tenants';

/** Everything a config change can move — the type page, the types list, the overview's gaps. */
export function useInvalidateConfig() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(['notification-type', 'notification-types', 'notification-gaps'].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
}

/**
 * Which channels a type goes out on — the default (`tenantId` null, platform admins) or one tenant's own, which
 * replaces the default for that tenant. Saving is audited; the next send uses it.
 */
export function RouteDialog({
  notificationType,
  tenantId,
  channels: current,
  onClose,
}: {
  notificationType: string;
  tenantId: string | null;
  channels: NotificationChannel[];
  onClose: () => void;
}) {
  const [channels, setChannels] = useState<NotificationChannel[]>(current);
  const invalidate = useInvalidateConfig();
  const whose = tenantId ? `${tenantName(tenantId)}'s route` : 'The default route';
  const save = useMutation({
    mutationFn: () => notificationApi.setRoute({ notificationType, tenantId, channels }),
    onSuccess: async () => {
      toast.success(`${whose} saved`, { description: `${notificationType} goes out by ${channels.map(channelLabel).join(', ')}.` });
      await invalidate();
      onClose();
    },
    onError: (error) => toast.error("Couldn't save the route", { description: error instanceof Error ? error.message : undefined }),
  });
  const toggle = (channel: NotificationChannel, on: boolean) =>
    setChannels((prev) => NOTIFICATION_CHANNELS.filter((c) => (c === channel ? on : prev.includes(c))));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {whose} — {notificationType}
          </DialogTitle>
          <DialogDescription>
            {tenantId
              ? `Replaces the default for ${tenantName(tenantId)} — remove it to use the default again.`
              : 'Every tenant without its own route gets this one.'}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-2">
          {NOTIFICATION_CHANNELS.map((c) => (
            <label key={c} className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5">
              <Checkbox checked={channels.includes(c)} onCheckedChange={(on) => toggle(c, on === true)} />
              {channelLabel(c)}
            </label>
          ))}
          <p className="text-muted-foreground text-xs">A channel needs a template (but WhatsApp) and a provider account, or its sends fail.</p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button disabled={channels.length === 0 || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
