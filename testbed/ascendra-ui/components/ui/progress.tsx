"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";
import { cn } from "@/ascendra-ui/shadcn";

// ─── Variants ────────────────────────────────────────────────────────────────

const sizeClasses = {
  xs: "h-0.5",
  sm: "h-1",
  md: "h-1.5",
  lg: "h-2.5",
} as const;

const colorClasses = {
  default: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  destructive: "bg-destructive",
  info: "bg-sky-500",
} as const;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProgressBarProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  size?: keyof typeof sizeClasses;
  color?: keyof typeof colorClasses;
  indeterminate?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProgressBar({
  value,
  size = "md",
  color = "default",
  indeterminate = false,
  className,
  ...props
}: ProgressBarProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress-bar"
      value={indeterminate ? undefined : value}
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-secondary",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "size-full flex-1 transition-all duration-500 ease-out",
          colorClasses[color],
          indeterminate && "animate-progress-indeterminate origin-left",
        )}
        style={
          indeterminate
            ? undefined
            : { transform: `translateX(-${100 - (value ?? 0)}%)` }
        }
      />
    </ProgressPrimitive.Root>
  );
}
