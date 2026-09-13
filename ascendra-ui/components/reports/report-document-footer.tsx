"use client";

import { cn } from "@/ascendra-ui/shadcn";

export function ReportDocumentFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="report-document-footer"
      className={cn(
        "flex flex-col gap-4 border-t pt-6 text-xs text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function ReportDocumentFooterNote({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="report-document-footer-note"
      className={cn(className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function ReportDocumentFooterLine({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="report-document-footer-line"
      className={cn(
        "flex flex-wrap items-center justify-between gap-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function ReportDocumentFooterLineLeft({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="report-document-footer-line-left"
      className={cn("font-medium text-foreground/60", className)}
      {...props}
    >
      {children}
    </span>
  );
}

export function ReportDocumentFooterLineRight({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="report-document-footer-line-right"
      className={cn("flex items-center gap-4 text-muted-foreground/60", className)}
      {...props}
    >
      {children}
    </div>
  );
}
