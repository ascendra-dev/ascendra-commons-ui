"use client";

import { cn } from "@/ascendra-ui/shadcn";
import { useReportHeaderFooter } from "./report-header-footer";

export function ReportHeaderField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const stacked = useReportHeaderFooter();

  if (stacked) {
    return (
      <div className={cn("flex flex-col gap-0.5", className)}>
        <span className="text-[0.6875rem] text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{children}</span>
      </div>
    );
  }

  return (
    <span className={cn("text-muted-foreground", className)}>
      <span className="font-medium text-foreground">{label}:</span> {children}
    </span>
  );
}
