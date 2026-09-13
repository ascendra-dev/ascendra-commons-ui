"use client";

import { cn } from "@/ascendra-ui/shadcn";

export function ReportSummary({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="report-summary"
      className={cn(
        "flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
