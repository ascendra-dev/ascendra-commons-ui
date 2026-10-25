"use client";

import * as React from "react";
import { cn } from "@/ascendra-ui/shadcn";
import {
  buildBorderClasses,
  buildBgClasses,
  type BorderConfig,
  type BgConfig,
} from "@/ascendra-ui/components/ui/accent-styles";
import { useCardContext } from "@/ascendra-ui/components/card/card";
import { useStepperContextSafe } from "@/ascendra-ui/providers/stepper/stepper.hook";
import { useOverlayScrollbars } from "@/ascendra-ui/hooks/use-overlay-scrollbars";

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
  const { collapseable, collapsed: contextCollapsed, step, maximized } = useCardContext();
  const stepper = useStepperContextSafe();
  // Filling the screen, the body scrolls — with the library's floating scrollbar, as a list or table does at its size.
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  useOverlayScrollbars(bodyRef, viewportRef, { y: "scroll", enabled: maximized });

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
        // Filling the screen: the body takes the rest of the card's height and scrolls.
        maximized && "min-h-0",
        isCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "-m-2 flex flex-col overflow-hidden mask-[linear-gradient(to_bottom,black,black_calc(100%-8px),transparent)] p-2 transition-all duration-300",
          maximized && "min-h-0",
          isCollapsed ? "m-0 p-0" : "",
        )}
      >
        <div
          ref={bodyRef}
          data-slot="card-panel-body"
          className={cn(
            "bg-background mx-1 flex flex-1 flex-col rounded-lg ring-1 ring-(--color-umbra)/4 dark:ring-black/20",
            maximized && "min-h-0",
            "shadow-[0_1px_2px_0_rgba(25,28,33,0.06),0_0_2px_0_rgba(0,0,0,0.08)]",
            "dark:shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.01),0_1px_3px_0_rgba(0,0,0,0.4),0_0_3px_0_rgba(0,0,0,0.2)]",
            border && buildBorderClasses(border),
            bg && buildBgClasses(bg),
          )}
        >
          <div
            ref={viewportRef}
            // hides the native scrollbar until useOverlayScrollbars takes over
            data-overlayscrollbars-initialize={maximized ? "" : undefined}
            className={cn("flex flex-1 flex-col", maximized && "min-h-0 overflow-y-auto overscroll-y-none")}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
