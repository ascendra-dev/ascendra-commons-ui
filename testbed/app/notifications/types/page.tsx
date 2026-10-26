'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardHeader,
  CardHeaderSubtitle,
  CardHeaderTitle,
  CardList,
  CardListItem,
  CardListLink,
  CardPanel,
  DashboardContent,
  DataTableEmptyBody,
  DataTableErrorBody,
  DataTableLoadingBody,
  PageHeader,
  PageHeaderGroup,
  PageSubtitle,
  PageTitle,
  SimpleBadge,
} from '@/ascendra-ui';
import { channelLabel, notificationApi, notificationLinks, type NotificationTypeSummary } from '@/ascendra-commons-ui/notification.ui';
import { useNotificationScope } from '../_scope';

const NOT_DECLARED = 'Not declared';

/** The types grouped by who they reach, audiences A–Z; leftovers last. */
function byAudience(types: NotificationTypeSummary[]) {
  const groups = new Map<string, NotificationTypeSummary[]>();
  for (const t of types) {
    const key = t.declared ? (t.audience ?? 'Other') : NOT_DECLARED;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }
  return [...groups.entries()].sort(([a], [b]) => Number(a === NOT_DECLARED) - Number(b === NOT_DECLARED) || a.localeCompare(b));
}

/** What the app sends — each type with who gets it and its channels. The configuration's front door. */
export default function NotificationTypesPage() {
  const { platform } = useNotificationScope();
  const types = useQuery({ queryKey: ['notification-types'], queryFn: () => notificationApi.types(), staleTime: 5 * 60_000 });
  const groups = byAudience(types.data ?? []);

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Notification types</PageTitle>
          <PageSubtitle>
            What the app sends — who each type reaches and the channels it goes out on. A type opens its routing, templates and a test send.
          </PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <DashboardContent>
        {groups.map(([audience, rows]) => (
          <Card key={audience}>
            <CardHeader>
              <CardHeaderTitle className="capitalize">{audience}</CardHeaderTitle>
              {audience === NOT_DECLARED && <CardHeaderSubtitle>Configured, but the app no longer declares them — nothing sends these</CardHeaderSubtitle>}
            </CardHeader>
            <CardPanel>
              <CardList columns="minmax(0,1fr) auto">
                {rows.map((t) => (
                  <CardListItem key={t.name}>
                    <div>
                      <div>
                        <CardListLink href={notificationLinks.type(t.name)} className="font-medium">
                          {t.name}
                        </CardListLink>
                        {t.description && <span className="text-muted-foreground"> — {t.description}</span>}
                      </div>
                      <TypeBadges type={t} platform={platform} />
                    </div>
                    <div className="flex flex-wrap justify-end gap-1 self-start">
                      {(t.defaultChannels ?? []).map((c) => (
                        <SimpleBadge key={c}>{channelLabel(c)}</SimpleBadge>
                      ))}
                    </div>
                  </CardListItem>
                ))}
              </CardList>
            </CardPanel>
          </Card>
        ))}
        {(types.isLoading || types.isError || (types.data && types.data.length === 0)) && (
          <Card>
            <CardPanel>
              <DataTableLoadingBody isLoading={types.isLoading} className="h-48" />
              <DataTableErrorBody isError={types.isError} error={types.error} onRetry={() => types.refetch()} className="h-48" />
              <DataTableEmptyBody
                isLoading={types.isLoading}
                isEmpty={!!types.data && types.data.length === 0}
                title="No notification types"
                description="The app declares its types in NotificationModule.forRoot({ types })."
                className="h-48"
              />
            </CardPanel>
          </Card>
        )}
      </DashboardContent>
    </>
  );
}

/** What's notable about a type's configuration — its overrides, its gaps, whether a user can turn it off. */
function TypeBadges({ type: t, platform }: { type: NotificationTypeSummary; platform: boolean }) {
  const ownTemplates = t.templates.filter((x) => x.tenantId !== null).length;
  const badges: Array<{ label: string; variant: 'blue' | 'orange' | 'secondary' }> = [];
  if (!t.declared) badges.push({ label: 'leftover — nothing sends it', variant: 'orange' });
  if (t.required) badges.push({ label: "required — can't be turned off", variant: 'orange' });
  if (t.tenantRoutes > 0) badges.push({ label: platform ? `${t.tenantRoutes} tenant ${t.tenantRoutes === 1 ? 'route' : 'routes'}` : 'routed your own way', variant: 'blue' });
  if (ownTemplates > 0) badges.push({ label: platform ? `${ownTemplates} white-labelled ${ownTemplates === 1 ? 'template' : 'templates'}` : 'your own text', variant: 'blue' });
  if (t.declared && t.defaultChannels === null && t.tenantRoutes === 0) badges.push({ label: 'no route — never sent', variant: 'secondary' });
  if (t.gaps > 0) badges.push({ label: `${t.gaps} ${t.gaps === 1 ? 'gap' : 'gaps'}`, variant: 'orange' });
  if (badges.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {badges.map((b) => (
        <SimpleBadge key={b.label} variant={b.variant}>
          {b.label}
        </SimpleBadge>
      ))}
    </div>
  );
}
