"use client";

import { cn } from "@/ascendra-ui/shadcn";
import {
  buildBorderClasses,
  buildBgClasses,
  type BorderConfig,
  type BgConfig,
} from "@/ascendra-ui/components/ui/accent-styles";
import { useCardContext } from "@/ascendra-ui/components/card/card";
import { useStepperContextSafe } from "@/ascendra-ui/providers/stepper/stepper.hook";

export function CardPanel({
  collapsed,
  border,
  bg,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  collapsed?: boolean;
  border?: BorderConfig;
  bg?: BgConfig;
}) {
  const { collapseable, collapsed: contextCollapsed, step } = useCardContext();
  const stepper = useStepperContextSafe();

  const isCollapsed =
    step !== undefined && stepper !== null
      ? stepper.currentStep !== step
      : (collapsed ?? (collapseable ? contextCollapsed : false));

  return (
    <div
      data-slot="card-panel"
      data-section-body
      data-collapsed={isCollapsed ? "true" : "false"}
      inert={isCollapsed}
      className={cn(
        "grid flex-1 transition-all duration-300",
        isCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "-m-2 flex flex-col overflow-hidden mask-[linear-gradient(to_bottom,black,black_calc(100%-8px),transparent)] p-2 transition-all duration-300",
          isCollapsed ? "m-0 p-0" : "",
        )}
      >
        <div
          className={cn(
            "bg-background mx-1 flex flex-1 flex-col rounded-lg ring-1 ring-(--color-umbra)/4 dark:ring-black/20",
            "shadow-[0_1px_2px_0_rgba(25,28,33,0.06),0_0_2px_0_rgba(0,0,0,0.08)]",
            "dark:shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.01),0_1px_3px_0_rgba(0,0,0,0.4),0_0_3px_0_rgba(0,0,0,0.2)]",
            border && buildBorderClasses(border),
            bg && buildBgClasses(bg),
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
