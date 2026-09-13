import * as React from "react";
import { cn } from "@/ascendra-ui/shadcn";

// ─── Base ─────────────────────────────────────────────────────────────────────

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

// ─── Text lines ───────────────────────────────────────────────────────────────

function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3", i === lines - 1 && lines > 1 ? "w-3/5" : "w-full")}
        />
      ))}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 rounded-xl border bg-background p-4", className)}>
      {/* Header row */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-full shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <Skeleton className="h-3 w-2/5" />
          <Skeleton className="h-2.5 w-1/4" />
        </div>
      </div>
      {/* Body */}
      <SkeletonText lines={3} />
    </div>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function SkeletonTableRow({
  columns = 5,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4 px-4 py-3 border-b last:border-0", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-3 flex-1",
            i === 0 ? "max-w-[80px]" : "",
            i === columns - 1 ? "max-w-[60px]" : "",
          )}
        />
      ))}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

function SkeletonTable({
  rows = 5,
  columns = 5,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-background overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-b bg-muted/30">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-2.5 flex-1 bg-muted-foreground/20" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} />
      ))}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function SkeletonStat({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border bg-background p-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="size-7 rounded-md" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-2.5 w-32" />
    </div>
  );
}

// ─── Avatar + name row ────────────────────────────────────────────────────────

function SkeletonUser({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Skeleton className="size-9 rounded-full shrink-0" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-2.5 w-20" />
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonTable,
  SkeletonStat,
  SkeletonUser,
};
