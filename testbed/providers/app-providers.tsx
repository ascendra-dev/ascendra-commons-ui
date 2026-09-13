"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/ascendra-ui/shadcn";
import { QueryProvider, ScrollToTop, Toaster } from "@/ascendra-ui";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <ScrollToTop />
      <QueryProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </QueryProvider>
    </>
  );
}
