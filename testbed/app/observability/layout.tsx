'use client';

import type { ReactNode } from 'react';
import {
  ContentArea,
  SideBar,
  SideBarMain,
  SideBarMenuItem,
  SideBarMenuItemGroup,
  SideBarMenuSet,
  SideBarMenuSetTitle,
  SideBarSearch,
  SideBarLayoutToggle,
  SideBarToggle,
} from '@/ascendra-ui';
import { auditLoggingNav } from '@/ascendra-commons-ui/audit-logging.ui/nav';
import { backgroundJobsNav } from '@/ascendra-commons-ui/background-jobs.ui/nav';
import { domainEventsNav } from '@/ascendra-commons-ui/domain-events.ui/nav';
import { idempotencyNav } from '@/ascendra-commons-ui/idempotency-key.ui/nav';
import { rateLimitingNav } from '@/ascendra-commons-ui/rate-limiting.ui/nav';
import type { ModuleNavEntry } from '@/ascendra-commons-ui/shared/nav';
import { useSession } from './auth/use-session';

/**
 * Every module this shell bundles, ships in full — no cherry-picking.
 * Add a new module's nav here (and only here) as it ships.
 */
const moduleNavEntries: ModuleNavEntry[] = [...auditLoggingNav, ...rateLimitingNav, ...idempotencyNav, ...domainEventsNav, ...backgroundJobsNav];

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
 * `useSession` / `session-auth.adapter.ts`) — an entry is hidden entirely, never shown
 * disabled, for an action the user doesn't hold. While the permission check
 * is still loading, entries stay visible rather than flashing empty (same
 * choice `ascendra-pay-web`'s own claims-gated nav makes).
 */
export default function ObservabilityLayout({ children }: { children: ReactNode }) {
  const { data: session, isLoading } = useSession();
  const allowedActions = session?.allowedActions;

  const visibleEntries =
    isLoading || !allowedActions
      ? moduleNavEntries
      : moduleNavEntries.filter((entry) => allowedActions.includes(entry.requiredAction));

  return (
    <>
      <SideBarToggle />
      <SideBar>
        <SideBarLayoutToggle />
        {/* Searches the items below by label — a module's nav entry is searchable as soon as it's listed. */}
        <SideBarSearch>
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
        </SideBarSearch>
      </SideBar>
      <ContentArea>{children}</ContentArea>
    </>
  );
}
