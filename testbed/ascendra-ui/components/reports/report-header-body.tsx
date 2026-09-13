"use client";

import { cn } from "@/ascendra-ui/shadcn";

export function ReportHeaderBody({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="report-header-body"
      className={cn(
        "flex flex-wrap items-start justify-between gap-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
