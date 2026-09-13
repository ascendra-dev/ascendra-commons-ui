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
  PageLayout,
  SideBar,
  SideBarMain,
  SideBarOverlay,
  SideBarToggle,
  ThemeToggle,
} from "@/ascendra-ui";

/**
 * The one dashboard shell every shipped module.ui's nav.ts registers into —
 * see packages/README.md's "one dashboard link per module" convention.
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
      <Nav>{/* one NavLink per shipped module — added as packages/*.ui ship */}</Nav>
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
