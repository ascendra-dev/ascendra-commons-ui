"use client";

import { cn } from "@/ascendra-ui/shadcn";

export function ReportSectionHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="report-section-header"
      className={cn("pb-3 border-b mb-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}
