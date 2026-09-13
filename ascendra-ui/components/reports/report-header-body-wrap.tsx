"use client";

import { cn } from "@/ascendra-ui/shadcn";

export function ReportHeaderBodyWrap({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="report-header-body-wrap"
      className={cn("", className)}
      {...props}
    >
      {children}
    </div>
  );
}
