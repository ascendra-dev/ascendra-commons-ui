"use client";

import { cn } from "@/ascendra-ui/shadcn";

export function ReportHeaderContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="report-header-content"
      className={cn("p-8 pb-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}
