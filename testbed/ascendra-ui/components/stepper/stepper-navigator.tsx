"use client";

import { Button } from "@/ascendra-ui/components/ui/button";
import { useStepperContext } from "@/ascendra-ui/providers/stepper/stepper.hook";

export function StepperNavigator() {
  const { steps, currentStep, handlePrevious, handleNext, isSubmitting } =
    useStepperContext();
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div
      data-slot="stepper-navigator"
      className="flex items-center justify-between pt-2"
    >
      <Button
        type="button"
        variant="ghost"
        onClick={handlePrevious}
        disabled={currentStep === 0}
      >
        Previous
      </Button>
      <Button type="button" onClick={handleNext} disabled={isSubmitting}>
        {isLastStep ? (isSubmitting ? "Submitting…" : "Submit") : "Next"}
      </Button>
    </div>
  );
}
