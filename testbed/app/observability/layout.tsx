'use client';

import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ContentArea,
  Header,
  HeaderActions,
  HeaderLink,
  HeaderLinks,
  MainContainer,
  Nav,
  NavLink,
  PageLayout,
  SideBar,
  SideBarMain,
  SideBarOverlay,
  SideBarToggle,
  ThemeToggle,
} from '@/ascendra-ui';
import { auditLoggingNav } from '@/ascendra-commons-ui/audit-logging.ui/nav';
import type { ModuleNavEntry } from '@/ascendra-commons-ui/shared/nav';
import { sessionAuthAdapter } from './auth/session-auth.adapter';

/**
 * Every module this shell bundles, ships in full — no cherry-picking.
 * Add a new module's nav here (and only here) as it ships.
 */
const moduleNavEntries: ModuleNavEntry[] = [...auditLoggingNav];

/**
 * The one shell every bundled module mounts under — replaces the old
 * per-vertical DashboardShell + hand-aggregated nav. Copying this whole
 * `packages/observability` folder into a vertical's `app/` tree *is* what
 * installs the admin UI; the vertical adds one link to this shell's mount
 * path and never touches routing or nav again.
 *
 * Nav visibility is filtered by the current user's allowedActions (via
 * `session-auth.adapter.ts`) — an entry is hidden entirely, never shown
 * disabled, for an action the user doesn't hold. While the permission check
 * is still loading, entries stay visible rather than flashing empty (same
 * choice `ascendra-pay-web`'s own claims-gated nav makes).
 */
export default function ObservabilityLayout({ children }: { children: ReactNode }) {
  const { data: allowedActions, isLoading } = useQuery({
    queryKey: ['observability-allowed-actions'],
    queryFn: () => sessionAuthAdapter.getAllowedActions(),
  });

  const visibleEntries =
    isLoading || !allowedActions
      ? moduleNavEntries
      : moduleNavEntries.filter((entry) => allowedActions.includes(entry.requiredAction));

  return (
    <PageLayout>
      <SideBarOverlay />
      <Header>
        <HeaderLinks>
          <HeaderLink href="/observability">Observability</HeaderLink>
        </HeaderLinks>
        <HeaderActions>
          <ThemeToggle />
        </HeaderActions>
      </Header>
      <Nav>
        {visibleEntries.map((entry) => (
          <NavLink key={entry.id} href={entry.href}>
            <entry.icon className="mr-1.5 inline size-3.5" />
            {entry.label}
          </NavLink>
        ))}
      </Nav>
      <MainContainer>
        <SideBarToggle />
        <SideBar>
          <SideBarMain />
        </SideBar>
        <ContentArea>{children}</ContentArea>
      </MainContainer>
    </PageLayout>
  );
}
