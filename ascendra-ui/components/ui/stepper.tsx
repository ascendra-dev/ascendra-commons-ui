"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/ascendra-ui/shadcn";
import { useStepperContextSafe } from "@/ascendra-ui/providers/stepper/stepper.hook";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StepStatus = "pending" | "active" | "completed" | "error";

export interface StepperItem {
  label: string;
  description?: string;
  status?: StepStatus;
}

export interface StepperProps {
  steps?: StepperItem[];
  currentStep?: number;
  onStepClick?: (index: number) => void;
  className?: string;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({
  index,
  status,
}: {
  index: number;
  status: StepStatus;
}) {
  return (
    <div
      className={cn(
        "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors duration-200",
        status === "completed" &&
          "border-primary bg-primary text-primary-foreground",
        status === "active" && "border-primary bg-background text-primary",
        status === "error" &&
          "border-destructive bg-destructive text-destructive-foreground",
        status === "pending" &&
          "border-border bg-background text-muted-foreground",
      )}
    >
      {status === "completed" && <Check className="size-3.5 stroke-[2.5]" />}
      {status === "error" && <X className="size-3.5 stroke-[2.5]" />}
      {(status === "active" || status === "pending") && (
        <span>{index + 1}</span>
      )}
    </div>
  );
}

// ─── Connector line ───────────────────────────────────────────────────────────

function StepConnector({ filled }: { filled: boolean }) {
  return (
    <div className="relative mx-1 mt-3.5 h-0.5 flex-1">
      <div className="absolute inset-0 rounded-full bg-border" />
      <div
        className={cn(
          "absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500",
          filled ? "right-0" : "right-full",
        )}
      />
    </div>
  );
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

export function Stepper({
  steps: stepsProp,
  currentStep: currentStepProp,
  onStepClick,
  className,
}: StepperProps) {
  const ctx = useStepperContextSafe();

  const steps: StepperItem[] =
    stepsProp ??
    ctx?.steps.map(({ label, description }) => ({ label, description })) ??
    [];
  const currentStep = currentStepProp ?? ctx?.currentStep;
  const handleStepClick =
    onStepClick ??
    (ctx
      ? (i: number) => {
          if (i < ctx.currentStep) ctx.goToStep(i);
        }
      : undefined);

  const resolved: StepperItem[] = steps.map((step, i) => {
    if (step.status) return step;
    if (currentStep === undefined) return { ...step, status: "pending" };
    if (i < currentStep) return { ...step, status: "completed" };
    if (i === currentStep) return { ...step, status: "active" };
    return { ...step, status: "pending" };
  });

  return (
    <div
      data-slot="stepper"
      className={cn("w-full overflow-x-auto no-scrollbar", className)}
    >
      <div className="flex min-w-max items-start">
        {resolved.map((step, i) => {
          const status = step.status ?? "pending";
          const isLast = i === steps.length - 1;
          const clickable = !!handleStepClick && status === "completed";

          return (
            <React.Fragment key={i}>
              {/* Step */}
              <div
                className={cn(
                  "flex flex-col items-center gap-1.5",
                  clickable && "cursor-pointer",
                )}
                onClick={clickable ? () => handleStepClick(i) : undefined}
              >
                <StepIndicator index={i} status={status} />
                <div className="flex flex-col items-center gap-0.5 text-center">
                  <span
                    className={cn(
                      "text-xs font-medium leading-snug whitespace-nowrap",
                      status === "active" && "text-foreground",
                      status === "completed" && "text-foreground",
                      status === "error" && "text-destructive",
                      status === "pending" && "text-muted-foreground",
                      clickable && "hover:text-primary transition-colors",
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="text-[0.6875rem] text-muted-foreground">
                      {step.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Connector */}
              {!isLast && <StepConnector filled={status === "completed"} />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
