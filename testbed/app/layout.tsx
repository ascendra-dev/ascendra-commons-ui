import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import { PersonaMenu } from "@/components/dev-sign-in/persona-menu";
import { AppNotificationBell } from "@/components/notification-bell/app-notification-bell";
import {
  Header,
  HeaderActions,
  HeaderLink,
  HeaderLinks,
  MainContainer,
  Nav,
  NavLink,
  PageLayout,
  SideBarOverlay,
  ThemeToggle,
} from "@/ascendra-ui";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ascendra Commons UI — Testbed",
  description: "Every ascendra-commons-ui module mounted the way a vertical would receive it",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="text-foreground font-sans text-sm font-normal tracking-normal antialiased">
        <AppProviders>
          <PageLayout>
            <SideBarOverlay />
            <Header>
              <HeaderLinks>
                <HeaderLink href="/">
                  <span className="truncate font-medium">Ascendra Commons UI — Testbed</span>
                </HeaderLink>
              </HeaderLinks>
              <HeaderActions>
                {/* notification.ui's in-app bell — the signed-in user's own inbox. */}
                <AppNotificationBell />
                <ThemeToggle />
                {/* Dev sign-in (testbed only) — a real app has its own account menu here. */}
                <PersonaMenu />
              </HeaderActions>
            </Header>
            <Nav>
              <NavLink href="/">Dashboard</NavLink>
              {/* The vertical's one link out to the observability shell — everything past
                  this point (routing, sidebar) belongs to packages/observability. */}
              <NavLink href="/observability">Observability</NavLink>
              {/* And to the access console (authorization) — its own shell, packages/access. */}
              <NavLink href="/access">Access</NavLink>
              {/* And to the notification console — its own shell, packages/notifications. */}
              <NavLink href="/notifications">Notifications</NavLink>
              {/* And to the file console — its own shell, packages/files. */}
              <NavLink href="/files">Files</NavLink>
            </Nav>
            <MainContainer>{children}</MainContainer>
          </PageLayout>
        </AppProviders>
      </body>
    </html>
  );
}
