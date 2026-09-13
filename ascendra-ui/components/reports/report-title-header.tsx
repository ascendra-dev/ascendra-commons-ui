"use client";

import { cn } from "@/ascendra-ui/shadcn";

export function ReportTitleHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="report-title-header"
      className={cn(
        "mt-1.5 text-3xl font-bold tracking-tight text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}
