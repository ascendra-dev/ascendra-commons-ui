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
import { fileStorageNav } from '@/ascendra-commons-ui/file-storage.ui/nav';
import { useSession } from '../observability/auth/use-session';
import { FileScopeProvider } from './_scope';

/**
 * The file console's shell — its own sidebar (file-storage.api/mocks.html). Like the notification console it owns no
 * top bar; it nests inside the app's root layout, which links here ("Files"). Entries are hidden, never shown
 * disabled, for an action the user lacks; while the session loads they stay visible rather than flash empty.
 */
export default function FilesLayout({ children }: { children: ReactNode }) {
  const { data: session, isLoading } = useSession();
  const allowed = session?.allowedActions;
  // Every screen needs file.view; without it, say so once instead of every read answering 403.
  const shut = !isLoading && !allowed?.includes('file.view');
  const entries = isLoading || !allowed ? fileStorageNav : fileStorageNav.filter((e) => allowed.includes(e.requiredAction));

  return (
    <FileScopeProvider>
      <SideBarToggle />
      <SideBar>
        <SideBarLayoutToggle />
        <SideBarSearch>
          <SideBarMain>
            {entries.length > 0 && (
              <SideBarMenuSet>
                <SideBarMenuSetTitle>File console</SideBarMenuSetTitle>
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
            <SimpleAlert variant="primary">The file console is for admins — it takes file.view.</SimpleAlert>
          </DashboardContent>
        ) : isLoading ? null : (
          children
        )}
      </ContentArea>
    </FileScopeProvider>
  );
}
