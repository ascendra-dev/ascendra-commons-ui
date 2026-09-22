import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import {
  Header,
  HeaderActions,
  HeaderLink,
  HeaderLinks,
  MainContainer,
  NameAvatar,
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
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
                <ThemeToggle />
                <NameAvatar href="#" name="Dev User" />
              </HeaderActions>
            </Header>
            <Nav>
              <NavLink href="/">Dashboard</NavLink>
              {/* The vertical's one link out to the observability shell — everything past
                  this point (routing, sidebar) belongs to packages/observability. */}
              <NavLink href="/observability">Observability</NavLink>
            </Nav>
            <MainContainer>{children}</MainContainer>
          </PageLayout>
        </AppProviders>
      </body>
    </html>
  );
}
