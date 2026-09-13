"use client";

import type { ReactNode } from "react";
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
} from "@/ascendra-ui";
import { moduleNavEntries } from "@/lib/modules";

/**
 * The one dashboard shell every shipped module.ui's nav.ts registers into —
 * see packages/README.md's "one dashboard link per module" convention.
 *
 * Imports moduleNavEntries directly rather than receiving it as a prop: a
 * nav entry's `icon` is a component reference, and React Server Components
 * can't pass a function as a prop from a server page into this ("use
 * client") component — only a value a client component imports and uses
 * itself is exempt from that serialization boundary.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <PageLayout>
      <SideBarOverlay />
      <Header>
        <HeaderLinks>
          <HeaderLink href="/">Ascendra Commons UI — Testbed</HeaderLink>
        </HeaderLinks>
        <HeaderActions>
          <ThemeToggle />
        </HeaderActions>
      </Header>
      <Nav>
        {moduleNavEntries.map((entry) => (
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
