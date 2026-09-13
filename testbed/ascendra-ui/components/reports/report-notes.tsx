"use client";

import { cn } from "@/ascendra-ui/shadcn";

export function ReportNotes({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="report-notes"
      className={cn(
        "flex flex-col gap-5 text-sm leading-relaxed text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function ReportNote({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div data-slot="report-note" className={cn(className)} {...props}>
      {children}
    </div>
  );
}

export function ReportNoteHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="report-note-header"
      className={cn("mb-1 font-medium text-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function ReportNoteText({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p data-slot="report-note-text" className={cn(className)} {...props}>
      {children}
    </p>
  );
}
