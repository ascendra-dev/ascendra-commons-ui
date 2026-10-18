"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/ascendra-ui";
import { QueryProvider, ScrollToTop, Toaster } from "@/ascendra-ui";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ScrollToTop />
      <QueryProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
