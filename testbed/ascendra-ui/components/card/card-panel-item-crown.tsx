import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/ascendra-ui/shadcn";

const crownLabelVariants = cva(
  "bg-background absolute -top-3 left-2 z-10 ml-2 rounded-full border border-dashed px-1.5 py-0.5 text-2xs",
  {
    variants: {
      variant: {
        default: "border-info/50 text-info",
        secondary: "border-gray-400/50 text-muted-foreground",
        destructive: "border-negative/50 text-negative",
        success: "border-positive/50 text-positive",
        warning: "border-orange-400/50 text-orange-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const lineVariantClasses: Record<string, string> = {
  default: "border-info/50",
  secondary: "border-gray-400/50",
  destructive: "border-negative/50",
  success: "border-positive/50",
  warning: "border-orange-400/50",
};

const nudgeActiveClasses: Record<string, string> = {
  default: "border-info text-info",
  secondary: "border-gray-400 text-muted-foreground",
  destructive: "border-negative text-negative",
  success: "border-positive text-positive",
  warning: "border-orange-400 text-orange-500",
};

const lineNudgeActiveClasses: Record<string, string> = {
  default: "border-info",
  secondary: "border-gray-400",
  destructive: "border-negative",
  success: "border-positive",
  warning: "border-orange-400",
};

export interface CardPanelItemCrownProps
  extends React.ComponentProps<"div">, VariantProps<typeof crownLabelVariants> {
  nudge?: boolean;
  nudgeVariant?: keyof typeof nudgeActiveClasses;
}

export function CardPanelItemCrown({
  className,
  children,
  variant,
  nudge = false,
  nudgeVariant = "warning",
  ...props
}: CardPanelItemCrownProps) {
  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 -top-px border-t border-dashed",
          nudge
            ? lineNudgeActiveClasses[nudgeVariant]
            : lineVariantClasses[variant ?? "secondary"],
        )}
      />
      <div
        data-slot="card-panel-item-crown"
        className={cn(
          crownLabelVariants({ variant }),
          nudge && "animate-nudge",
          nudge && nudgeActiveClasses[nudgeVariant],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
}
