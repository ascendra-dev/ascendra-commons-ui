"use client";

import * as React from "react";
import { cn } from "@/ascendra-ui/shadcn";

const ReportHeaderFooterContext = React.createContext(false);

export function useReportHeaderFooter() {
  return React.useContext(ReportHeaderFooterContext);
}

export function ReportHeaderFooter({
  stacked = false,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { stacked?: boolean }) {
  return (
    <ReportHeaderFooterContext.Provider value={stacked}>
      <div
        data-slot="report-header-footer"
        className={cn(
          "mt-5 border-t pt-4 text-xs",
          stacked
            ? "grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3"
            : "flex flex-wrap gap-4",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </ReportHeaderFooterContext.Provider>
  );
}
