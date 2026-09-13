"use client";

import { cn } from "@/ascendra-ui/shadcn";
import { useCardContext } from "@/ascendra-ui/components/card/card";
import { useStepperContextSafe } from "@/ascendra-ui/providers/stepper/stepper.hook";

type CardHeaderTitleProps = React.ComponentProps<"label">;

export function CardHeaderTitle({
  className,
  children,
  ...props
}: CardHeaderTitleProps) {
  const { step } = useCardContext();
  const stepper = useStepperContextSafe();
  const isCompleted =
    step !== undefined && stepper !== null && step < stepper.currentStep;

  if (isCompleted) {
    return (
      <button
        type="button"
        data-slot="card-header-title"
        onClick={() => stepper.goToStep(step)}
        className={cn(
          "text-base font-medium text-foreground cursor-pointer hover:opacity-70 transition-opacity text-left",
          className,
        )}
      >
        {children}
      </button>
    );
  }

  return (
    <label
      data-slot="card-header-title"
      className={cn("text-base font-medium text-foreground", className)}
      {...props}
    >
      {children}
    </label>
  );
}
