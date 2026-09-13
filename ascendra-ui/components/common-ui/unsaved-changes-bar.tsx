"use client";

import { useState, useRef, useEffect } from "react";
import { InfoIcon, Loader2 } from "lucide-react";
import { cn } from "@/ascendra-ui/shadcn";
import { Button } from "@/ascendra-ui/components/ui/button";

interface UnsavedChangesBarProps {
  isDirty: boolean;
  onSave?: () => boolean | Promise<boolean> | void;
  onReset?: () => void;
  /** Called when Save is clicked but isValid is false — use to trigger field-level error display */
  onInvalid?: () => void;
  saveLabel?: string;
  resetLabel?: string;
  /** Shown when the bar is in its default idle state */
  message?: string;
  /** Shown after clicking Save with a dirty/invalid form */
  validationMessage?: string;
  /** Shown while isSaving is true */
  savingMessage?: string;
  /** Shown on successful save */
  successMessage?: string;
  /** Shown when onSave returns false */
  errorMessage?: string;
  /** Hides buttons and shows savingMessage */
  isSaving: boolean;
  /** Is Form Valid */
  isValid: boolean;
  /** Extra classes on the outer wrapper — use to offset centering when a sidebar is present */
  className?: string;
}

export function UnsavedChangesBar({
  isDirty,
  onSave,
  onReset,
  onInvalid,
  saveLabel = "Save",
  resetLabel = "Reset",
  message = "Unsaved changes",
  validationMessage = "Check the errors",
  savingMessage = "Saving changes…",
  successMessage = "Saved successfully",
  errorMessage = "Failed to save. Please try again.",
  isSaving = false,
  isValid = true,
  className,
}: UnsavedChangesBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(message);
  const [iconClass, setIconClass] = useState("text-white");
  const [saveButtonLabel, setSaveButtonLabel] = useState(saveLabel);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [nudgeCount, setNudgeCount] = useState(0);
  const showButtons = !(isSaving || isError || isSuccess);

  useEffect(() => {
    if (nudgeCount === 0) return;
    const el = barRef.current;
    if (!el) return;
    el.classList.add("animate-nudge-strong");
    const onEnd = () => el.classList.remove("animate-nudge-strong");
    el.addEventListener("animationend", onEnd, { once: true });
    return () => el.removeEventListener("animationend", onEnd);
  }, [nudgeCount]);

  function triggerNudge() {
    setNudgeCount((c) => c + 1);
  }

  function reset() {
    setIconClass("text-white");
    setTitle(message);
    setIsOpen(false);
    setSaveButtonLabel(saveLabel);
    setIsSuccess(false);
    setIsError(false);
  }

  return (
    <div
      className={cn(
        "fixed bottom-8 left-1/2 z-50 min-w-85 -translate-x-1/2 transition-all duration-300",
        isOpen || isDirty
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
        className ?? "lg:left-[calc(50%+7.75rem)]",
      )}
    >
      <div
        ref={barRef}
        className="flex min-h-10 items-center justify-between gap-6 rounded-md bg-[#1c1c1f] bg-linear-to-b from-white/12 to-white/0 py-2 pr-2 pl-3 shadow-[inset_0_0_0_1px_#2f3037,inset_0_2px_0_theme(--color-white/0.12),inset_0_0_2px_2px_theme(--color-white/0.06),0_16px_36px_-6px_theme(--color-black/0.36),0_6px_16px_-2px_theme(--color-black/0.2)] dark:shadow-[inset_0_0_0_1px_theme(--color-black/0.8),inset_0_2px_0_theme(--color-white/0.12),inset_0_0_2px_2px_theme(--color-white/0.06),0_16px_36px_-6px_theme(--color-black/0.36),0_6px_16px_-2px_theme(--color-black/0.2)]"
      >
        <span
          className={cn(
            "flex items-center gap-1.5 text-sm font-normal whitespace-nowrap",
            "text-white",
          )}
        >
          {isSaving && <Loader2 className="size-3.5 shrink-0 animate-spin" />}
          {!isSaving && (
            <InfoIcon className={cn("size-3.5 shrink-0 stroke-3", iconClass)} />
          )}
          {title}
        </span>

        {showButtons && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="destructive"
              size="sm"
              className="h-6"
              onClick={() => {
                reset();
                onReset?.();
              }}
            >
              {resetLabel}
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="h-6"
              onClick={async () => {
                if (isValid) {
                  setTitle(savingMessage);
                  setIconClass("text-white");
                  const isSuccess = await onSave?.();
                  if (isSuccess) {
                    setTitle(successMessage);
                    setIconClass("text-green-400");
                    setIsSuccess(true);
                    setTimeout(() => {
                      reset();
                      setIsOpen(false);
                    }, 4000);
                  } else {
                    setTitle(errorMessage);
                    setIconClass("text-red-500");
                    setIsError(true);
                    setTimeout(() => {
                      reset();
                      setIsOpen(false);
                    }, 4000);
                  }
                } else {
                  setIconClass("text-red-500");
                  setTitle(validationMessage);
                  triggerNudge();
                  onInvalid?.();
                  setTimeout(() => {
                    setSaveButtonLabel("Try again");
                  }, 200);
                }
              }}
            >
              {saveButtonLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
