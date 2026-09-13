"use client";

import { cn } from "@/ascendra-ui/shadcn";
import { useCardContext } from "@/ascendra-ui/components/card/card";
import { useStepperContextSafe } from "@/ascendra-ui/providers/stepper/stepper.hook";

type CardFooterProps = React.ComponentProps<"footer">;

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  const { step } = useCardContext();
  const stepper = useStepperContextSafe();

  if (step !== undefined && stepper !== null && stepper.currentStep !== step) {
    return null;
  }

  return (
    <footer
      data-slot="card-footer"
      className={cn(
        "text-muted-foreground flex items-start px-5 pt-4 pb-3 text-xs transition-colors duration-300",
        "border-border border-t",
        "group-[:has(>[data-section-body][data-collapsed='false'])]:border-t-0",
        "group-[:has(>[data-table-container])]:border-t-0",
        className,
      )}
      {...props}
    >
      {children}
    </footer>
  );
}
