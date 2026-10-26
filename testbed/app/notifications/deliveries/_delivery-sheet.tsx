'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  IdText,
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
  StatusDot,
  WithEmptyValue,
  WithSkeleton,
  WithState,
  toast,
  useQueryContext,
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  canRetry,
  channelLabel,
  deliveryStatusVariant,
  isGuest,
  isTransient,
  notificationApi,
  notificationLinks,
  notificationQueryIds,
  reasonLabel,
  recipientFilter,
  recipientLabel,
  recipientUserId,
  retryBlocker,
  splitReason,
  type Delivery,
  type DeliveryContent,
} from '@/ascendra-commons-ui/notification.ui';
import { useNotificationScope } from '../_scope';
import { tenantName } from '../tenants';

/**
 * One attempt in full — what happened when, the message as sent, and what to do about it: retry it, or see
 * everything sent to the same recipient (the list behind, filtered). A retry and the delivery it retries open here in
 * place of this one, never on top. Reading the message is `notification.view_content` and audited, so it loads only
 * when asked for.
 */
export function DeliverySheet({ delivery: row, onClose }: { delivery: Delivery; onClose: () => void }) {
  const [id, setId] = useState(row.id);
  const query = useQuery({
    queryKey: ['notification-delivery', id],
    queryFn: () => notificationApi.delivery(id),
    initialData: id === row.id ? row : undefined,
  });
  const d = query.data;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <WithState>
          <ErrorState if={query.isError && !d} title="Couldn't load this delivery" error={query.error} onRetry={() => query.refetch()} />
          <NormalState if={!query.isError || !!d}>
            <WithSkeleton>
              <SkeletonState if={!d}>
                <SheetHeader>
                  <SheetTitle className="sr-only">Delivery</SheetTitle>
                  <Skeleton className="h-6 w-56" />
                  <Skeleton className="h-4 w-40" />
                </SheetHeader>
              </SkeletonState>
              <NormalState if={!!d}>{d && <DeliveryDetail key={d.id} d={d} open={setId} onClose={onClose} />}</NormalState>
            </WithSkeleton>
          </NormalState>
        </WithState>
      </SheetContent>
    </Sheet>
  );
}

function DeliveryDetail({ d, open, onClose }: { d: Delivery; open: (id: string) => void; onClose: () => void }) {
  const { platform, can } = useNotificationScope();
  const { runQuery } = useQueryContext();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const who = recipientLabel(d);
  const filter = recipientFilter(d);
  const blocker = retryBlocker(d);
  const mayRetry = can('notification.retry') && canRetry(d);

  const retry = useMutation({
    mutationFn: () => notificationApi.retry(d.id),
    onSuccess: async (result) => {
      const channel = result.channels?.[d.channel];
      const reason = reasonLabel(channel?.reason ?? result.reason ?? null);
      if (result.status === 'sent') toast.success('Retried — sent', { description: `${d.notificationType} went to ${who} by ${channelLabel(d.channel)}.` });
      else if (result.status === 'skipped') toast.info('Retried — skipped', { description: reason ?? undefined });
      else toast.error('The retry failed too', { description: reason ?? undefined });
      setConfirming(false);
      await Promise.all(['data-table', 'notification-delivery'].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
    },
    onError: (error) => toast.error("Couldn't retry it", { description: error instanceof Error ? error.message : undefined }),
  });

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          {d.notificationType} · {channelLabel(d.channel)}
        </SheetTitle>
        <SheetDescription className="flex flex-wrap items-center gap-1.5">
          <SimpleBadge variant={deliveryStatusVariant(d.status)}>{d.status}</SimpleBadge>
          {d.isTest && <SimpleBadge variant="violet">Test</SimpleBadge>}
          {platform && tenantName(d.tenantId)}
          {platform && ' · '}to {isGuest(d) ? 'a guest' : who}
        </SheetDescription>
      </SheetHeader>
      <SheetBody>
        <SheetSection>
          <DeliveryTimeline d={d} open={open} />
        </SheetSection>
        <SheetSection>
          <SheetProperties>
            <SheetKey>Recipient</SheetKey>
            <SheetValue>
              {isGuest(d) ? (
                <span>
                  Guest <span className="text-muted-foreground">· address hidden</span>
                </span>
              ) : (
                <span>
                  {who} <span className="text-muted-foreground text-xs">· {recipientUserId(d)}</span>
                </span>
              )}
            </SheetValue>
            <SheetKey>Provider id</SheetKey>
            <SheetValue>
              <WithEmptyValue value={d.providerMessageId}>
                <IdText value={d.providerMessageId ?? ''} />
              </WithEmptyValue>
            </SheetValue>
            <SheetKey>Correlation</SheetKey>
            <SheetValue>
              <WithEmptyValue value={d.correlationId}>
                <IdText value={d.correlationId ?? ''} size="lg" />
              </WithEmptyValue>
            </SheetValue>
            <SheetKey>Delivery</SheetKey>
            <SheetValue>#{d.id}</SheetValue>
          </SheetProperties>
        </SheetSection>
        <SheetSection>
          <MessageSection d={d} />
        </SheetSection>
        {d.status === 'skipped' && splitReason(d.reason).code === 'suppressed' && <SuppressedNote d={d} />}
        {blocker && <p className="text-muted-foreground text-xs">{blocker}</p>}
      </SheetBody>
      {(mayRetry || filter) && (
        <SheetFooter>
          {mayRetry && <Button onClick={() => setConfirming(true)}>Retry</Button>}
          {filter && (
            <Button
              variant="secondary"
              onClick={() => {
                runQuery(notificationQueryIds.advancedFilter, filter);
                onClose();
              }}
            >
              Everything to {isGuest(d) ? 'this address' : who}
            </Button>
          )}
        </SheetFooter>
      )}
      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retry this delivery?</DialogTitle>
            <DialogDescription>
              It resends {d.notificationType} to {who} by {channelLabel(d.channel)} now — through the same rules (their
              preferences, the suppression list). Once only; the retry is audited.
            </DialogDescription>
          </DialogHeader>
          {!isTransient(d.reason) && (
            <DialogBody>
              <SimpleAlert variant="warning">
                It failed with “{reasonLabel(d.reason)}” — unless that&apos;s been fixed since, the retry fails the same way.
              </SimpleAlert>
            </DialogBody>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button disabled={retry.isPending} onClick={() => retry.mutate()}>
              {retry.isPending ? 'Sending…' : 'Retry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** What happened, oldest first: the retry it is, the attempt, the provider's callback, and the retry of it. */
function DeliveryTimeline({ d, open }: { d: Delivery; open: (id: string) => void }) {
  const retry = useQuery({
    queryKey: ['notification-delivery', d.retriedBy],
    queryFn: () => notificationApi.delivery(d.retriedBy!),
    enabled: !!d.retriedBy,
  });
  const { detail } = splitReason(d.reason);
  const reason = reasonLabel(d.reason);
  const sentLine = d.channel === 'in_app' ? 'Sent — put in their inbox' : 'Sent — accepted by the provider';

  const items: Array<{ key: string; at?: string; dot: ReactNode; body: ReactNode }> = [];
  if (d.retryOf) {
    items.push({
      key: 'retry-of',
      dot: <StatusDot variant="sky" />,
      body: (
        <span>
          A retry of <DeliveryLink id={d.retryOf} open={open} />
        </span>
      ),
    });
  }
  const attempt =
    d.status === 'failed' ? (
      <span>Failed — {reason}</span>
    ) : d.status === 'skipped' ? (
      <span>Skipped — {reason}</span>
    ) : (
      <span>{sentLine}</span>
    );
  items.push({
    key: 'attempt',
    at: d.attemptedAt,
    dot: <StatusDot variant={d.status === 'failed' ? 'red' : d.status === 'skipped' ? 'gray' : 'primary'} />,
    body: (
      <>
        {attempt}
        {d.status === 'failed' && detail && reason !== detail && <div className="text-muted-foreground text-xs">{detail}</div>}
      </>
    ),
  });
  if (d.status === 'delivered') {
    items.push({ key: 'delivered', at: d.updatedAt, dot: <StatusDot variant="emerald" />, body: "Delivered — the provider's callback" });
  }
  if (d.status === 'bounced') {
    items.push({ key: 'bounced', at: d.updatedAt, dot: <StatusDot variant="red" />, body: <span>Bounced — {detail ?? reason}</span> });
  }
  if (d.retriedBy) {
    items.push({
      key: 'retried',
      at: retry.data?.attemptedAt,
      dot: <StatusDot variant="sky" />,
      body: (
        <span className="flex flex-wrap items-center gap-1.5">
          Retried → <DeliveryLink id={d.retriedBy} open={open} />
          {retry.data && <SimpleBadge variant={deliveryStatusVariant(retry.data.status)}>{retry.data.status}</SimpleBadge>}
        </span>
      ),
    });
  }

  return (
    <ol className="flex flex-col">
      {items.map((item, i) => (
        <li key={item.key} className="flex gap-3">
          <div className="flex w-2 flex-col items-center">
            <div className="mt-1.5 flex">{item.dot}</div>
            {i < items.length - 1 && <div className="bg-border mt-1 w-px flex-1" />}
          </div>
          <div className="min-w-0 flex-1 pb-4">
            {item.at && <div className="text-muted-foreground text-xs tabular-nums">{formatDateTime(item.at, { time: true })}</div>}
            <div>{item.body}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Another delivery — opens here, in place of this one. */
function DeliveryLink({ id, open }: { id: string; open: (id: string) => void }) {
  return (
    <button type="button" className="text-primary cursor-pointer underline-offset-2 hover:underline" onClick={() => open(id)}>
      delivery #{id}
    </button>
  );
}

/**
 * The message as sent — or, for a send that failed before it rendered, the variables kept for a retry. Behind
 * `notification.view_content`, and loaded only on request: every read is audited.
 */
function MessageSection({ d }: { d: Delivery }) {
  const { can } = useNotificationScope();
  const [asked, setAsked] = useState(false);
  const content = useQuery({
    queryKey: ['notification-delivery-content', d.id],
    queryFn: () => notificationApi.deliveryContent(d.id),
    enabled: asked,
    staleTime: Infinity,
  });

  let body: ReactNode;
  if (d.status === 'skipped') {
    body = <p className="text-muted-foreground">Nothing was sent, so there&apos;s no message.</p>;
  } else if (!d.hasContent) {
    body = <p className="text-muted-foreground">The message is no longer kept — it&apos;s cleared after 30 days; this record stays.</p>;
  } else if (!can('notification.view_content')) {
    body = (
      <p className="text-muted-foreground">
        Reading the message takes <code className="font-mono text-xs">notification.view_content</code>.
      </p>
    );
  } else if (!asked) {
    body = (
      <div className="flex flex-col items-start gap-2">
        <p className="text-muted-foreground">It may hold personal details — each read is recorded in the audit log.</p>
        <Button variant="secondary" size="sm" onClick={() => setAsked(true)}>
          Show the message
        </Button>
      </div>
    );
  } else if (content.isError) {
    body = <p className="text-destructive">Couldn&apos;t load the message{content.error instanceof Error ? ` — ${content.error.message}` : ''}.</p>;
  } else if (!content.data) {
    body = <Skeleton className="h-24 w-full" />;
  } else {
    body = <Message content={content.data.content} />;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-medium">Message</h3>
      {body}
    </div>
  );
}

function Message({ content }: { content: DeliveryContent['content'] }) {
  const variables = Object.entries(content.variables);
  if (content.body === null) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground">Not rendered — the send failed first. Its variables, kept for a retry:</p>
        <Variables entries={variables} />
      </div>
    );
  }
  return (
    <div className="bg-muted/50 flex flex-col gap-2 rounded-md border p-3">
      {content.subject && <div className="font-medium">{content.subject}</div>}
      {content.isHtml ? (
        // Stored HTML is shown inert — no scripts, no requests out of the sheet.
        <iframe title="The message" sandbox="" srcDoc={content.body} className="h-64 w-full rounded bg-white" />
      ) : (
        <div className="whitespace-pre-wrap">{content.body}</div>
      )}
    </div>
  );
}

function Variables({ entries }: { entries: Array<[string, unknown]> }) {
  if (entries.length === 0) return <p className="text-muted-foreground">None.</p>;
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([name, value]) => (
        <SimpleBadge key={name} variant="violet" className="font-mono">
          {name} = {String(value)}
        </SimpleBadge>
      ))}
    </div>
  );
}

/** A send skipped as suppressed — when the address was suppressed and why, and where to send to it again. */
function SuppressedNote({ d }: { d: Delivery }) {
  const entry = useQuery({
    queryKey: ['notification-suppression-of', d.recipientKey, d.channel],
    queryFn: () => notificationApi.suppressions(1, undefined, { recipientKey: d.recipientKey!, channel: d.channel }),
    enabled: !!d.recipientKey,
  });
  const s = entry.data?.data[0];
  if (!s) return null;
  return (
    <SimpleAlert variant="secondary">
      <span>
        This address {s.reason === 'complaint' ? 'reported spam' : 'bounced'} on {formatDateTime(s.firstAt)}
        {s.detail ? ` (${s.detail})` : ''} and is suppressed — {s.eventCount} {s.eventCount === 1 ? 'time' : 'times'} since.{' '}
        <Link href={notificationLinks.suppressions()} className="text-primary underline-offset-2 hover:underline">
          Suppressions
        </Link>
      </span>
    </SimpleAlert>
  );
}
