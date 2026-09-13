"use client";

import { cn } from "@/ascendra-ui/shadcn";

export function ReportTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="report-title"
      className={cn(
        "text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}
