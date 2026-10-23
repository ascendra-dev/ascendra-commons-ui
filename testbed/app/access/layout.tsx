'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Button,
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
import { authorizationLinks } from '@/ascendra-commons-ui/authorization.ui/links';
import { authorizationNav, authorizationSelfNav } from '@/ascendra-commons-ui/authorization.ui/nav';
import { useSession } from '../observability/auth/use-session';
import { AccessScopeProvider } from './_scope';

/**
 * The access console's shell — its own sidebar (authorization.api/mocks.html): the admin screens for anyone with
 * `authz.view`, My access for everyone. Like the observability shell it owns no top bar; it nests inside the app's
 * root layout, which links here ("Access"). Entries are hidden, never shown disabled, for an action the user lacks;
 * while the session loads they stay visible rather than flash empty.
 */
export default function AccessLayout({ children }: { children: ReactNode }) {
  const { data: session, isLoading } = useSession();
  const pathname = usePathname();
  const allowed = session?.allowedActions;
  // The admin screens need authz.view; without it, say so once instead of every read answering 403.
  const own = pathname === authorizationLinks.mine();
  const shut = !isLoading && !allowed?.includes('authz.view') && !own;
  // An admin screen waits for the session — mounted earlier, its reads would go out (and 403) before we know.
  const waiting = isLoading && !own;
  const admin = isLoading || !allowed ? authorizationNav : authorizationNav.filter((e) => allowed.includes(e.requiredAction));

  return (
    <AccessScopeProvider>
      <SideBarToggle />
      <SideBar>
        <SideBarLayoutToggle />
        <SideBarSearch>
          <SideBarMain>
            {admin.length > 0 && (
              <SideBarMenuSet>
                <SideBarMenuSetTitle>Access console</SideBarMenuSetTitle>
                <SideBarMenuItemGroup>
                  {admin.map((entry) => (
                    <SideBarMenuItem key={entry.id} alternate="stand-alone" icon={entry.icon} path={entry.href}>
                      {entry.label}
                    </SideBarMenuItem>
                  ))}
                </SideBarMenuItemGroup>
              </SideBarMenuSet>
            )}
            <SideBarMenuSet>
              <SideBarMenuSetTitle>Everyone</SideBarMenuSetTitle>
              <SideBarMenuItemGroup>
                {authorizationSelfNav.map((entry) => (
                  <SideBarMenuItem key={entry.id} alternate="stand-alone" icon={entry.icon} path={entry.href}>
                    {entry.label}
                  </SideBarMenuItem>
                ))}
              </SideBarMenuItemGroup>
            </SideBarMenuSet>
          </SideBarMain>
        </SideBarSearch>
      </SideBar>
      <ContentArea>
        {shut ? (
          <DashboardContent>
            <SimpleAlert variant="primary">
              The access console is for admins — you can see your own access instead.
            </SimpleAlert>
            <div>
              <Button asChild>
                <Link href={authorizationLinks.mine()}>My access</Link>
              </Button>
            </div>
          </DashboardContent>
        ) : waiting ? null : (
          children
        )}
      </ContentArea>
    </AccessScopeProvider>
  );
}
