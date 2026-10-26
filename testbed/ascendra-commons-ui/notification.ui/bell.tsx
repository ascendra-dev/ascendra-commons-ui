'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LuBell } from 'react-icons/lu';
import {
  BubbleBadge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ascendra-ui';
import { cn } from '@/ascendra-ui/shadcn';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import { notificationApi } from './api';
import type { InboxItem } from './api';
import { notificationLinks } from './links';

/** The badge polls this often — there's no push yet. */
const POLL_MS = 30_000;
/** The dropdown's last few; the Inbox page has the rest. */
const RECENT = 5;

/** Everything that changes when an item is read — the badge, the dropdown, the Inbox page. */
export function useInvalidateInbox() {
  const queryClient = useQueryClient();
  return () => Promise.all(['notification-unread', 'notification-inbox'].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
}

/**
 * The in-app channel's bell, for the app's top bar: the unread count, and the last few messages. Opening it marks
 * nothing read; clicking a message does. `enabled` — someone is signed in (the bell reads their own inbox).
 */
export function NotificationBell({ enabled }: { enabled: boolean }) {
  const invalidate = useInvalidateInbox();
  const unread = useQuery({
    queryKey: ['notification-unread'],
    queryFn: () => notificationApi.unreadCount(),
    enabled,
    refetchInterval: POLL_MS,
    retry: false,
  });
  const recent = useQuery({
    queryKey: ['notification-inbox', 'recent'],
    queryFn: () => notificationApi.inbox({ limit: RECENT }),
    enabled,
    retry: false,
  });
  const markRead = useMutation({ mutationFn: (id: string) => notificationApi.markRead(id), onSuccess: invalidate });
  const markAll = useMutation({ mutationFn: () => notificationApi.markAllRead(), onSuccess: invalidate });

  // Signed out, or an app without an inbox (the API answers 404/401): no bell at all.
  if (!enabled || unread.isError) return null;
  const count = unread.data?.unread ?? 0;
  const items = recent.data?.data ?? [];

  return (
    <DropdownMenu onOpenChange={(open) => open && recent.refetch()}>
      <DropdownMenuTrigger asChild>
        {/* The top bar's round icon button, as its theme toggle draws it. */}
        <button
          type="button"
          className="focus-visible:outline-primary bg-background border-border relative flex min-h-7 min-w-7 cursor-pointer items-center justify-center rounded-full border focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label={count ? `Notifications — ${count} unread` : 'Notifications'}
        >
          <LuBell className="size-3.5 text-gray-400" />
          {count > 0 && (
            <BubbleBadge color="red" className="absolute -top-1.5 -right-1.5">
              {count > 99 ? '99+' : count}
            </BubbleBadge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="font-medium">Notifications</span>
          {count > 0 && (
            <button type="button" className="text-primary cursor-pointer text-xs hover:underline" onClick={() => markAll.mutate()}>
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="text-muted-foreground px-2 py-6 text-center text-sm">{recent.isLoading ? 'Loading…' : 'You’re all caught up.'}</p>
        ) : (
          items.map((item) => <BellItem key={item.id} item={item} onRead={() => !item.readAt && markRead.mutate(item.id)} />)
        )}
        <DropdownMenuSeparator />
        <div className="flex gap-3 px-2 py-1.5 text-xs">
          <Link href={notificationLinks.inbox()} className="text-primary hover:underline">
            See all
          </Link>
          <Link href={notificationLinks.preferences()} className="text-primary hover:underline">
            Notification settings
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BellItem({ item, onRead }: { item: InboxItem; onRead: () => void }) {
  return (
    <DropdownMenuItem onSelect={onRead} className="flex items-start gap-2 py-2">
      <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', item.readAt ? 'bg-transparent' : 'bg-primary')} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn('truncate', !item.readAt && 'font-medium')}>{item.title ?? item.notificationType}</span>
        <span className="text-muted-foreground line-clamp-2 text-xs">{item.body}</span>
      </span>
      <span className="text-muted-foreground shrink-0 text-xs">{formatDateTime(item.createdAt, { style: 'relative' })}</span>
    </DropdownMenuItem>
  );
}
