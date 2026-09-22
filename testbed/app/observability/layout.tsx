'use client';

import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ContentArea,
  SideBar,
  SideBarMain,
  SideBarMenuItem,
  SideBarMenuItemGroup,
  SideBarMenuSet,
  SideBarMenuSetTitle,
  SideBarToggle,
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
 * The sidebar shell every bundled module mounts under, styled the same way
 * ascendra-ui's own showcase app builds its sidebar (`SideBarMain` >
 * `SideBarMenuSet` > `SideBarMenuItemGroup` > `SideBarMenuItem`, see
 * ascendra-ui/app/showcase/layout.tsx). Copying this whole
 * `packages/observability` folder into a vertical's `app/` tree *is* what
 * installs the admin UI; the vertical adds one link to this shell's mount
 * path and never touches routing or nav again.
 *
 * Deliberately owns no top bar/top nav — those belong to the vertical's own
 * root layout (its own branding, avatar, theme toggle, the app-wide Nav bar
 * with the one link in here) and this layout nests inside it (Next.js
 * layout composition: this file's return value becomes the vertical's
 * MainContainer's children), contributing only the module sidebar.
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
    <>
      <SideBarToggle />
      <SideBar>
        <SideBarMain>
          <SideBarMenuSet>
            <SideBarMenuSetTitle>Modules</SideBarMenuSetTitle>
            <SideBarMenuItemGroup>
              {visibleEntries.map((entry) => (
                <SideBarMenuItem key={entry.id} alternate="stand-alone" icon={entry.icon} path={entry.href}>
                  {entry.label}
                </SideBarMenuItem>
              ))}
            </SideBarMenuItemGroup>
          </SideBarMenuSet>
        </SideBarMain>
      </SideBar>
      <ContentArea>{children}</ContentArea>
    </>
  );
}
