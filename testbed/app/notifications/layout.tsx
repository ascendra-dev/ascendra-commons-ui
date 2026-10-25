'use client';

import type { ReactNode } from 'react';
import {
  ContentArea,
  DashboardContent,
  SimpleAlert,
  SideBar,
  SideBarLayoutToggle,
  SideBarMain,
  SideBarMenuItem,
  SideBarMenuItemGroup,
  SideBarMenuSet,
  SideBarMenuSetTitle,
  SideBarSearch,
  SideBarToggle,
} from '@/ascendra-ui';
import { notificationNav } from '@/ascendra-commons-ui/notification.ui/nav';
import { useSession } from '../observability/auth/use-session';
import { NotificationScopeProvider } from './_scope';

/**
 * The notification console's shell — its own sidebar (notification.api/mocks.html). Like the access console it owns
 * no top bar; it nests inside the app's root layout, which links here ("Notifications"). Entries are hidden, never
 * shown disabled, for an action the user lacks; while the session loads they stay visible rather than flash empty.
 */
export default function NotificationsLayout({ children }: { children: ReactNode }) {
  const { data: session, isLoading } = useSession();
  const allowed = session?.allowedActions;
  // The console needs notification.view; without it, say so once instead of every read answering 403.
  const shut = !isLoading && !allowed?.includes('notification.view');
  const entries = isLoading || !allowed ? notificationNav : notificationNav.filter((e) => allowed.includes(e.requiredAction));

  return (
    <NotificationScopeProvider>
      <SideBarToggle />
      <SideBar>
        <SideBarLayoutToggle />
        <SideBarSearch>
          <SideBarMain>
            {entries.length > 0 && (
              <SideBarMenuSet>
                <SideBarMenuSetTitle>Notification console</SideBarMenuSetTitle>
                <SideBarMenuItemGroup>
                  {entries.map((entry) => (
                    <SideBarMenuItem key={entry.id} alternate="stand-alone" icon={entry.icon} path={entry.href}>
                      {entry.label}
                    </SideBarMenuItem>
                  ))}
                </SideBarMenuItemGroup>
              </SideBarMenuSet>
            )}
          </SideBarMain>
        </SideBarSearch>
      </SideBar>
      <ContentArea>
        {shut ? (
          <DashboardContent>
            <SimpleAlert variant="primary">The notification console is for admins.</SimpleAlert>
          </DashboardContent>
        ) : isLoading ? null : (
          children
        )}
      </ContentArea>
    </NotificationScopeProvider>
  );
}
