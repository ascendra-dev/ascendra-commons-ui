"use client";

import { cn } from "@/ascendra-ui/shadcn";

export function ReportSubTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="report-subtitle"
      className={cn("mt-1 text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
}
