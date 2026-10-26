'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  BackLink,
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardHeaderSubtitle,
  CardHeaderTitle,
  CardList,
  CardListItem,
  CardPanel,
  DashboardContent,
  ErrorMessage,
  PageHeader,
  PageHeaderAction,
  PageHeaderGroup,
  PageSubtitle,
  PageTitle,
  SimpleBadge,
  Skeleton,
  toast,
} from '@/ascendra-ui';
import {
  channelLabel,
  NOTIFICATION_CHANNELS,
  needsTemplate,
  notificationApi,
  notificationLinks,
  notificationQueryIds,
  type ChannelRoute,
  type NotificationChannel,
  type NotificationTypeDetail,
  type Template,
} from '@/ascendra-commons-ui/notification.ui';
import { TenantPicker, useNotificationScope } from '../../_scope';
import { tenantName } from '../../tenants';
import { RouteDialog, useInvalidateConfig } from '../_route-dialog';
import { TemplateDialog } from '../_template-dialog';
import { TestSendDialog } from '../_test-send-dialog';

type Editing =
  | { kind: 'route'; tenantId: string | null; channels: NotificationChannel[] }
  | { kind: 'template'; channel: NotificationChannel; tenantId: string | null; existing?: Template; fallback?: Template }
  | { kind: 'test' };

/** A small text action inside a card row. */
function RowAction({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="text-primary cursor-pointer text-xs underline-offset-2 hover:underline">
      {children}
    </button>
  );
}

const firstLine = (t: Template) => t.subject ?? t.body.split('\n')[0];

/**
 * Everything that decides how one type goes out: its routes (the default and each tenant's), its text per channel, its
 * variables, and whether every tenant it reaches can actually be sent to. A tenant admin sees the defaults and its own
 * rows and edits its own; the defaults are the platform's.
 */
export default function NotificationTypePage() {
  const { name: raw } = useParams<{ name: string }>();
  const name = decodeURIComponent(raw);
  const { platform, tenantId: target, can } = useNotificationScope();
  const [editing, setEditing] = useState<Editing | null>(null);
  const type = useQuery({ queryKey: ['notification-type', name], queryFn: () => notificationApi.type(name) });
  const t = type.data;
  const manage = can('notification.manage_config');

  return (
    <>
      <BackLink href={notificationLinks.types()} label="Notification types">
        Back to types
      </BackLink>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>{name}</PageTitle>
          <PageSubtitle>
            {t ? (t.declared ? `${t.description ?? 'No description'}${t.audience ? ` — reaches ${t.audience}` : ''}` : 'Not declared — a leftover route; nothing sends it') : ' '}
          </PageSubtitle>
        </PageHeaderGroup>
        <PageHeaderAction className="flex w-fit flex-wrap gap-2">
          <TenantPicker />
          <Button variant="secondary" asChild>
            <Link href={notificationLinks.deliveries({ queryId: notificationQueryIds.advancedFilter, params: { notificationType: name } })}>
              Deliveries of this type
            </Link>
          </Button>
          {t?.declared && can('notification.test_send') && <Button onClick={() => setEditing({ kind: 'test' })}>Test send</Button>}
        </PageHeaderAction>
      </PageHeader>
      <DashboardContent>
        {type.isError ? (
          <Card>
            <CardPanel>
              <ErrorMessage title="Couldn't load this type" error={type.error} onRetry={() => type.refetch()} />
            </CardPanel>
          </Card>
        ) : !t ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-6">
              <RoutingCard type={t} target={target} platform={platform} manage={manage} edit={setEditing} />
            </div>
            <div className="col-span-12 lg:col-span-6">
              <TemplatesCard type={t} target={target} platform={platform} manage={manage} edit={setEditing} />
            </div>
            <div className="col-span-12 lg:col-span-6">
              <VariablesCard type={t} />
            </div>
            <div className="col-span-12 lg:col-span-6">
              <CoverageCard type={t} />
            </div>
          </div>
        )}
      </DashboardContent>
      {t && editing?.kind === 'route' && (
        <RouteDialog notificationType={t.name} tenantId={editing.tenantId} channels={editing.channels} onClose={() => setEditing(null)} />
      )}
      {t && editing?.kind === 'template' && (
        <TemplateDialog
          type={t}
          channel={editing.channel}
          tenantId={editing.tenantId}
          existing={editing.existing}
          fallback={editing.fallback}
          onClose={() => setEditing(null)}
        />
      )}
      {t && editing?.kind === 'test' && <TestSendDialog type={t} onClose={() => setEditing(null)} />}
    </>
  );
}

interface CardProps {
  type: NotificationTypeDetail;
  /** A tenant admin's own tenant, or the one a platform admin picked. */
  target: string | undefined;
  platform: boolean;
  manage: boolean;
  edit: (editing: Editing) => void;
}

/** The default route and each tenant's own — a tenant's replaces the default for it. */
function RoutingCard({ type: t, target, platform, manage, edit }: CardProps) {
  const invalidate = useInvalidateConfig();
  const remove = useMutation({
    mutationFn: (tenantId: string) => notificationApi.deleteRoute(t.name, tenantId),
    onSuccess: async (_v, tenantId) => {
      toast.success(`${tenantName(tenantId)} uses the default route again`);
      await invalidate();
    },
    onError: (error) => toast.error("Couldn't remove the route", { description: error instanceof Error ? error.message : undefined }),
  });
  const fallback = t.routes.find((r) => r.tenantId === null);
  const tenantRoutes = t.routes.filter((r) => r.tenantId !== null);
  const canOverride = manage && !!target && !tenantRoutes.some((r) => r.tenantId === target);

  const channels = (r: ChannelRoute) => (
    <div className="flex flex-wrap justify-end gap-1 self-start">
      {r.channels.map((c) => (
        <SimpleBadge key={c}>{channelLabel(c)}</SimpleBadge>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle>Routing</CardHeaderTitle>
        <CardHeaderSubtitle>Which channels it goes out on</CardHeaderSubtitle>
      </CardHeader>
      <CardPanel>
        <CardList columns="minmax(0,1fr) auto">
          {fallback ? (
            <CardListItem>
              <div>
                <div>Default · every tenant</div>
                {platform && manage && (
                  <div className="mt-1">
                    <RowAction onClick={() => edit({ kind: 'route', tenantId: null, channels: fallback.channels })}>Edit</RowAction>
                  </div>
                )}
              </div>
              {channels(fallback)}
            </CardListItem>
          ) : (
            <CardListItem>
              <div>
                <div>No default route</div>
                <div className="text-muted-foreground mt-1 text-xs">Only a tenant with its own route gets it.</div>
                {platform && manage && (
                  <div className="mt-1">
                    <RowAction onClick={() => edit({ kind: 'route', tenantId: null, channels: ['email'] })}>Add the default route</RowAction>
                  </div>
                )}
              </div>
              <div />
            </CardListItem>
          )}
          {tenantRoutes.map((r) => (
            <CardListItem key={r.tenantId}>
              <div>
                <div>{tenantName(r.tenantId)}</div>
                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 text-xs">
                  {fallback ? 'overrides the default' : 'its own route'}
                  {manage && (
                    <>
                      <RowAction onClick={() => edit({ kind: 'route', tenantId: r.tenantId, channels: r.channels })}>Edit</RowAction>
                      <RowAction onClick={() => remove.mutate(r.tenantId!)}>Remove (use the default)</RowAction>
                    </>
                  )}
                </div>
              </div>
              {channels(r)}
            </CardListItem>
          ))}
        </CardList>
      </CardPanel>
      <CardFooter className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
        <span>{platform ? 'Pick a tenant to route it its own way.' : 'You see the default and your own route; the default is the platform’s.'}</span>
        {canOverride && (
          <Button size="sm" variant="secondary" onClick={() => edit({ kind: 'route', tenantId: target!, channels: fallback?.channels ?? ['email'] })}>
            Route {tenantName(target)} its own way
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/** The text per routed channel — the default, and each tenant's own, which wins for that tenant. */
function TemplatesCard({ type: t, target, platform, manage, edit }: CardProps) {
  const routed = NOTIFICATION_CHANNELS.filter((c) => t.routes.some((r) => r.channels.includes(c)));
  const missing = (channel: NotificationChannel) => t.gaps.filter((g) => g.channel === channel && g.kind === 'missing_template');

  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle>Templates</CardHeaderTitle>
        <CardHeaderSubtitle>The text per channel — a tenant&apos;s own wins over the default</CardHeaderSubtitle>
      </CardHeader>
      <CardPanel>
        <CardList columns="minmax(0,1fr) auto">
          {routed.map((channel) => {
            if (!needsTemplate(channel)) {
              return (
                <CardListItem key={channel}>
                  <div>
                    <div>{channelLabel(channel)}</div>
                    <div className="text-muted-foreground mt-1 text-xs">Pre-approved at the provider — nothing to write here</div>
                  </div>
                  <div className="self-start">
                    <SimpleBadge variant="secondary">on the provider&apos;s side</SimpleBadge>
                  </div>
                </CardListItem>
              );
            }
            const fallback = t.templates.find((x) => x.channel === channel && x.tenantId === null);
            const own = t.templates.filter((x) => x.channel === channel && x.tenantId !== null);
            const gaps = missing(channel);
            const canWriteOwn = manage && !!target && !own.some((x) => x.tenantId === target);
            return [
              <CardListItem key={`${channel}-default`}>
                <div className="min-w-0">
                  <div>{channelLabel(channel)} · default</div>
                  <div className="text-muted-foreground mt-1 truncate text-xs">
                    {fallback ? firstLine(fallback) : gaps.length ? `Missing — ${gaps.map((g) => (g.tenantId ? tenantName(g.tenantId) : 'every tenant')).join(', ')} can't be sent to` : 'None — each tenant writes its own'}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-2">
                    {platform && manage && (
                      <RowAction onClick={() => edit({ kind: 'template', channel, tenantId: null, existing: fallback })}>
                        {fallback ? 'Edit' : `Write the ${channelLabel(channel)} template`}
                      </RowAction>
                    )}
                    {canWriteOwn && (
                      <RowAction onClick={() => edit({ kind: 'template', channel, tenantId: target!, fallback })}>Write {tenantName(target)}&apos;s own</RowAction>
                    )}
                  </div>
                </div>
                <div className="self-start">{!fallback && gaps.length > 0 && <SimpleBadge variant="orange">missing</SimpleBadge>}</div>
              </CardListItem>,
              ...own.map((x) => (
                <CardListItem key={`${channel}-${x.tenantId}`}>
                  <div className="min-w-0">
                    <div>
                      {channelLabel(channel)} · {tenantName(x.tenantId)}&apos;s own
                    </div>
                    <div className="text-muted-foreground mt-1 truncate text-xs">{firstLine(x)}</div>
                    {manage && (
                      <div className="mt-1">
                        <RowAction onClick={() => edit({ kind: 'template', channel, tenantId: x.tenantId, existing: x })}>Edit</RowAction>
                      </div>
                    )}
                  </div>
                  <div className="self-start">
                    <SimpleBadge variant="blue">white-labelled</SimpleBadge>
                  </div>
                </CardListItem>
              )),
            ];
          })}
        </CardList>
        {routed.length === 0 && <p className="text-muted-foreground p-5 text-sm">No route sends it on any channel.</p>}
      </CardPanel>
    </Card>
  );
}

function VariablesCard({ type: t }: { type: NotificationTypeDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle>Variables</CardHeaderTitle>
        <CardHeaderSubtitle>What its templates may use — with the samples a preview and a test send fill in</CardHeaderSubtitle>
      </CardHeader>
      <CardPanel>
        {t.variables.length > 0 ? (
          <CardList columns="auto minmax(0,1fr)">
            {t.variables.map((v) => (
              <CardListItem key={v.name}>
                <SimpleBadge variant="violet" className="w-fit font-mono">
                  {v.name}
                </SimpleBadge>
                <div className="text-muted-foreground truncate text-right">{v.sample === undefined ? '—' : String(v.sample)}</div>
              </CardListItem>
            ))}
          </CardList>
        ) : (
          <p className="text-muted-foreground p-5 text-sm">{t.declared ? 'It declares none.' : 'Not declared — no variables are known.'}</p>
        )}
      </CardPanel>
    </Card>
  );
}

/** Can it be sent — to every tenant it reaches, on every channel? Each hole links to the sends it already failed. */
function CoverageCard({ type: t }: { type: NotificationTypeDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle>Coverage</CardHeaderTitle>
        <CardHeaderSubtitle>Can it be sent — to every tenant it reaches, on every channel?</CardHeaderSubtitle>
      </CardHeader>
      <CardPanel>
        <CardList columns="minmax(0,1fr) auto">
          {t.gaps.map((g) => (
            <CardListItem key={`${g.tenantId}-${g.channel}-${g.kind}`}>
              <div>
                <div>
                  {g.tenantId ? tenantName(g.tenantId) : 'Every tenant'} · {channelLabel(g.channel)}
                </div>
                <Link
                  className="text-primary mt-1 inline-block text-xs underline-offset-2 hover:underline"
                  href={notificationLinks.deliveries({
                    queryId: notificationQueryIds.advancedFilter,
                    params: {
                      notificationType: t.name,
                      channel: g.channel,
                      reason: g.kind === 'missing_template' ? 'template_not_found' : 'no_provider_config',
                      ...(g.tenantId ? { tenantId: g.tenantId } : {}),
                      attemptedRange: { from: '-29d', to: 'today' },
                    },
                  })}
                >
                  The sends it failed — past 30 days
                </Link>
              </div>
              <div className="self-start">
                <SimpleBadge variant="orange">{g.kind === 'missing_template' ? 'no template' : 'no account'}</SimpleBadge>
              </div>
            </CardListItem>
          ))}
          {t.gaps.length === 0 && (
            <CardListItem>
              <div>{t.routes.length ? 'Every tenant it reaches can be sent to, on every channel' : 'Nothing routes it'}</div>
              <div className="self-start">{t.routes.length > 0 && <SimpleBadge variant="green">ready</SimpleBadge>}</div>
            </CardListItem>
          )}
        </CardList>
      </CardPanel>
    </Card>
  );
}
