"use client";

import { cn } from "@/ascendra-ui/shadcn";
import { useCardContext } from "@/ascendra-ui/components/card/card";
import { useStepperContextSafe } from "@/ascendra-ui/providers/stepper/stepper.hook";

type CardHeaderSubtitleProps = React.ComponentProps<"p">;

export function CardHeaderSubtitle({
  className,
  children,
  ...props
}: CardHeaderSubtitleProps) {
  const { step } = useCardContext();
  const stepper = useStepperContextSafe();

  if (step !== undefined && stepper !== null && stepper.currentStep !== step) {
    return null;
  }

  return (
    <p
      data-slot="card-header-subtitle"
      className={cn("text-muted-foreground mt-0.5 text-xs", className)}
      {...props}
    >
      {children}
    </p>
  );
}
