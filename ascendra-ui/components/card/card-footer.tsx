"use client";

import { cn } from "@/ascendra-ui/shadcn";
import { useCardContext } from "@/ascendra-ui/components/card/card";
import { useStepperContextSafe } from "@/ascendra-ui/providers/stepper/stepper.hook";

type CardFooterProps = React.ComponentProps<"footer">;

/**
 * Notes about the card's body — so a collapsed card hides it with the body (and the separator above it), folding in
 * the same 300ms: collapsed is just the header, whatever sits beside or below it.
 */
export function CardFooter({ className, children, ...props }: CardFooterProps) {
  const { step, collapseable, collapsed } = useCardContext();
  const stepper = useStepperContextSafe();

  if (step !== undefined && stepper !== null && stepper.currentStep !== step) {
    return null;
  }

  const hidden = collapseable && collapsed;

  return (
    <div
      data-slot="card-footer-frame"
      inert={hidden}
      className={cn("grid transition-all duration-300", hidden ? "grid-rows-[0fr]" : "grid-rows-[1fr]")}
    >
      <div className="min-h-0 overflow-hidden">
        <footer
          data-slot="card-footer"
          className={cn(
            "text-muted-foreground flex items-start px-5 pt-4 pb-3 text-xs transition-colors duration-300",
            "border-border border-t",
            "group-[:has(>[data-section-body][data-collapsed='false'])]:border-t-0",
            // Folding away with the body: no separator sliding up with it.
            hidden && "border-t-0",
            className,
          )}
          {...props}
        >
          {children}
        </footer>
      </div>
    </div>
  );
}
