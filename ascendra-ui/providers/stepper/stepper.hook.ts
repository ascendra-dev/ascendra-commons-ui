"use client";

import { useContext } from "react";
import { StepperContext } from "./stepper.provider";
import type { StepperContextValue } from "./stepper.types";

export function useStepperContext(): StepperContextValue {
  const ctx = useContext(StepperContext);
  if (!ctx) throw new Error("useStepperContext must be used inside StepperProvider");
  return ctx;
}

export function useStepperContextSafe(): StepperContextValue | null {
  return useContext(StepperContext);
}
