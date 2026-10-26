'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeaderSubtitle,
  CardHeaderTitle,
  CardTable,
  DashboardContent,
  DataTableErrorBody,
  DataTableLoadingBody,
  PageHeader,
  PageHeaderGroup,
  PageSubtitle,
  PageTitle,
  SimpleBadge,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
  toast,
} from '@/ascendra-ui';
import { channelLabel, NOTIFICATION_CHANNELS, notificationApi, type NotificationChannel } from '@/ascendra-commons-ui/notification.ui';

const ANY = '*';

/**
 * What reaches me, and how — every type routed to me, on each channel it goes out on, a switch each; and a row that
 * turns a channel off for every type. The most specific rule wins (a type's own switch over "every notification"). A
 * type the app requires (a password reset) is always on. Changes save as you switch.
 */
export default function MyNotificationsPage() {
  const queryClient = useQueryClient();
  const prefs = useQuery({ queryKey: ['notification-preferences'], queryFn: () => notificationApi.myPreferences() });
  const save = useMutation({
    mutationFn: notificationApi.setPreference,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-preferences'] }),
    onError: (error) => toast.error("Couldn't save that", { description: error instanceof Error ? error.message : undefined }),
  });

  const types = (prefs.data?.types ?? []).filter((t) => t.channels.length > 0);
  const channels = NOTIFICATION_CHANNELS.filter((c) => types.some((t) => t.channels.some((x) => x.channel === c)));
  const everyOn = (channel: NotificationChannel) =>
    prefs.data?.rules.find((r) => r.notificationType === ANY && r.channel === channel)?.enabled ?? true;
  const pending = (type: string, channel: string) =>
    save.isPending && save.variables?.notificationType === type && save.variables?.channel === channel;

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>My notifications</PageTitle>
          <PageSubtitle>What reaches you, and how — each notification on the channels it goes out on. Changes save as you switch.</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <DashboardContent>
        <Card>
          <CardHeader>
            <CardHeaderTitle>Notifications and channels</CardHeaderTitle>
            <CardHeaderSubtitle>A notification&apos;s own switch wins over “every notification”</CardHeaderSubtitle>
          </CardHeader>
          <CardTable>
            <Table>
              <TableHeader>
                {types.length > 0 && (
                  <TableHeaderRow>
                    <TableHead>Notification</TableHead>
                    {channels.map((c) => (
                      <TableHead key={c}>{channelLabel(c)}</TableHead>
                    ))}
                  </TableHeaderRow>
                )}
              </TableHeader>
              {types.length > 0 && (
                <TableBody>
                  <TableRow className="bg-muted/40">
                    <TableCell>
                      <span className="font-medium">Every notification</span> <span className="text-muted-foreground">— a channel off for all</span>
                    </TableCell>
                    {channels.map((c) => (
                      <TableCell key={c}>
                        <Switch
                          checked={everyOn(c)}
                          disabled={pending(ANY, c)}
                          aria-label={`Every notification by ${channelLabel(c)}`}
                          onCheckedChange={(on) => save.mutate({ notificationType: ANY, channel: c, enabled: on })}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                  {types.map((t) => (
                    <TableRow key={t.name}>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {t.name}
                          {t.required && <SimpleBadge variant="secondary">always sent</SimpleBadge>}
                        </div>
                        {t.description && <div className="text-muted-foreground text-xs">{t.description}</div>}
                      </TableCell>
                      {channels.map((c) => {
                        const on = t.channels.find((x) => x.channel === c);
                        return (
                          <TableCell key={c}>
                            {on ? (
                              <Switch
                                checked={on.enabled}
                                disabled={t.required || pending(t.name, c)}
                                aria-label={`${t.name} by ${channelLabel(c)}`}
                                onCheckedChange={(enabled) => save.mutate({ notificationType: t.name, channel: c, enabled })}
                              />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
            <DataTableLoadingBody isLoading={prefs.isLoading} className="h-48" />
            <DataTableErrorBody isError={prefs.isError} error={prefs.error} onRetry={() => prefs.refetch()} className="h-48" />
          </CardTable>
          <CardFooter className="text-muted-foreground text-xs">“—”: that notification doesn&apos;t go out on that channel.</CardFooter>
        </Card>
      </DashboardContent>
    </>
  );
}
