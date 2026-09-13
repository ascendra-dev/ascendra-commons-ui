"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/ascendra-ui/shadcn";
import { Button } from "@/ascendra-ui/components/ui/button";

// ─── InputGroup ────────────────────────────────────────────────────────────────
// All the ring/shadow/hover/focus styles from your Input wrapper live here now

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group relative flex w-full min-w-0 items-center",
        "has-[textarea]:h-auto",
        "has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:flex-col",
        "has-[>[data-align=inline-end]]:*:data-[slot=input-group-control]:pr-1.5",
        "has-[>[data-align=inline-start]]:*:data-[slot=input-group-control]:pl-2.5",

        // Shape + background
        "dark:bg-secondary rounded-[.375rem] bg-white",

        // Transition
        "transition",

        // BASE RING
        "ring-1 ring-(--color-umbra)/12",
        "dark:ring-(--color-gray-1000)/88 dark:ring-inset",

        // BASE SHADOW
        "shadow-[0_2px_2px_-1px_rgba(0,0,0,0.06),0_4px_4px_-2px_rgba(0,0,0,0.04)]",
        "dark:shadow-[0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24)]",

        // DISABLED
        "has-[[data-slot=input-group-control][data-disabled]]:cursor-not-allowed",
        "has-[[data-slot=input-group-control][data-disabled]]:opacity-40",

        // READ ONLY
        "has-[[data-slot=input-group-control]:read-only]:bg-gray-100",
        "dark:has-[[data-slot=input-group-control]:read-only]:bg-white/5",
        "has-[[data-slot=input-group-control]:read-only]:ring-gray-300",
        "dark:has-[[data-slot=input-group-control]:read-only]:ring-white/10",
        "has-[[data-slot=input-group-control]:read-only]:shadow-none",

        // HOVER
        "has-[[data-slot=input-group-control][data-hovered]:not(:read-only):not([data-focused]):not([data-disabled])]:ring-(--color-umbra)/24",
        "dark:has-[[data-slot=input-group-control][data-hovered]:not(:read-only):not([data-focused]):not([data-disabled])]:ring-gray-950",
        "has-[[data-slot=input-group-control][data-hovered]:not(:read-only):not([data-focused]):not([data-disabled])]:shadow-[0_2px_2px_-1px_rgba(0,0,0,0.1),0_4px_4px_-2px_rgba(0,0,0,0.06)]",
        "dark:has-[[data-slot=input-group-control][data-hovered]:not(:read-only):not([data-focused]):not([data-disabled])]:shadow-[0_2px_2px_-1px_rgba(0,0,0,0.32),0_4px_4px_-2px_rgba(0,0,0,0.32)]",

        // FOCUS (mouse/pointer — ring + shadow only)
        "has-[[data-slot=input-group-control][data-focused][data-pointer]:not(:read-only)]:ring-1",
        "has-[[data-slot=input-group-control][data-focused][data-pointer]:not(:read-only)]:ring-(--color-umbra)/12",
        "dark:has-[[data-slot=input-group-control][data-focused][data-pointer]:not(:read-only)]:ring-black/88",
        "has-[[data-slot=input-group-control][data-focused][data-pointer]:not(:read-only)]:shadow-[0_0_0_3px_rgba(0,0,0,0.08),0_4px_4px_-1px_rgba(0,0,0,0.08),0_4px_4px_-2px_rgba(0,0,0,0.04)]",
        "dark:has-[[data-slot=input-group-control][data-focused][data-pointer]:not(:read-only)]:shadow-[0_0_0_3px_rgba(61,61,74,0.4),0_4px_4px_-1px_rgba(0,0,0,0.08),0_4px_4px_-2px_rgba(0,0,0,0.16)]",

        // INVALID
        "has-[[data-slot=input-group-control][aria-invalid=true]]:outline-2",
        "has-[[data-slot=input-group-control][aria-invalid=true]]:outline-destructive",
        "has-[[data-slot=input-group-control][aria-invalid=true]]:outline-offset-1",

        // FOCUS VISIBLE (keyboard — primary outline, suppressed on pointer and on error)
        "has-[[data-slot=input-group-control]:focus-visible:not([data-pointer]):not(:read-only):not([aria-invalid=true])]:outline",
        "has-[[data-slot=input-group-control]:focus-visible:not([data-pointer]):not(:read-only):not([aria-invalid=true])]:outline-2",
        "has-[[data-slot=input-group-control]:focus-visible:not([data-pointer]):not(:read-only):not([aria-invalid=true])]:outline-primary",
        "has-[[data-slot=input-group-control]:focus-visible:not([data-pointer]):not(:read-only):not([aria-invalid=true])]:outline-offset-1",
        className,
      )}
      {...props}
    />
  );
}

// ─── InputGroupAddon ───────────────────────────────────────────────────────────

const inputGroupAddonVariants = cva(
  "text-muted-foreground h-auto gap-2 py-1 text-sm font-medium group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4 flex cursor-text items-center justify-center select-none",
  {
    variants: {
      align: {
        "inline-start":
          "pl-2.5 has-[>button]:ml-[-0.3rem] has-[>kbd]:ml-[-0.15rem] order-first",
        "inline-end":
          "pr-2 has-[>button]:mr-[-0.3rem] has-[>kbd]:mr-[-0.15rem] order-last",
        "block-start": "px-2.5 pt-2 order-first w-full justify-start",
        "block-end": "px-2.5 pb-2 order-last w-full justify-start",
      },
    },
    defaultVariants: { align: "inline-start" },
  },
);

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        e.currentTarget.parentElement?.querySelector("input")?.focus();
      }}
      {...props}
    />
  );
}

// ─── InputGroupText ────────────────────────────────────────────────────────────

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="input-group-text"
      className={cn(
        "text-muted-foreground flex items-center gap-2 text-sm [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

// ─── InputGroupButton ──────────────────────────────────────────────────────────

const inputGroupButtonVariants = cva(
  "gap-2 text-sm shadow-none flex items-center",
  {
    variants: {
      size: {
        xs: "h-6 gap-1 rounded-[calc(var(--radius)-3px)] px-1.5 [&>svg:not([class*='size-'])]:size-3.5",
        sm: "",
        "icon-xs":
          "size-6 rounded-[calc(var(--radius)-3px)] p-0 has-[>svg]:p-0",
        "icon-sm": "size-8 p-0 has-[>svg]:p-0",
      },
    },
    defaultVariants: { size: "xs" },
  },
);

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      data-slot="input-group-button"
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  );
}

// ─── InputGroupInput ───────────────────────────────────────────────────────────
// Bare <input> — no wrapper div, no ring/shadow. InputGroup handles all that.

const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(
  (
    {
      className,
      disabled,
      readOnly,
      onFocus,
      onBlur,
      onKeyDown,
      onMouseDown,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref,
  ) => {
    const [focused, setFocused] = React.useState(false);
    const [hovered, setHovered] = React.useState(false);
    const [isPointer, setIsPointer] = React.useState(false);

    return (
      <input
        ref={ref}
        data-slot="input-group-control"
        data-focused={focused || undefined}
        data-hovered={hovered || undefined}
        data-disabled={disabled || undefined}
        data-pointer={isPointer || undefined}
        disabled={disabled}
        readOnly={readOnly}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          setIsPointer(false);
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
        }}
        onMouseDown={(e) => {
          setIsPointer(true);
          onMouseDown?.(e);
        }}
        onMouseEnter={(e) => {
          setHovered(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setHovered(false);
          onMouseLeave?.(e);
        }}
        className={cn(
          "h-8 w-full flex-1 bg-transparent px-3 py-1 text-sm",
          "border-0 ring-0 outline-none",
          "placeholder:text-gray-500 dark:placeholder:text-gray-700",
          className,
        )}
        {...props}
      />
    );
  },
);
InputGroupInput.displayName = "InputGroupInput";

// ─── InputGroupTextarea ────────────────────────────────────────────────────────

const InputGroupTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(
  (
    {
      className,
      disabled,
      readOnly,
      maxLength,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      onKeyDown,
      onMouseDown,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref,
  ) => {
    const [focused, setFocused] = React.useState(false);
    const [hovered, setHovered] = React.useState(false);
    const [isPointer, setIsPointer] = React.useState(false);
    const [charCount, setCharCount] = React.useState(() => {
      if (value !== undefined) return String(value).length;
      if (defaultValue !== undefined) return String(defaultValue).length;
      return 0;
    });

    const displayCount = value !== undefined ? String(value).length : charCount;

    const textarea = (
      <textarea
        ref={ref}
        data-slot="input-group-control"
        data-focused={focused || undefined}
        data-hovered={hovered || undefined}
        data-disabled={disabled || undefined}
        data-pointer={isPointer || undefined}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => {
          setCharCount(e.target.value.length);
          onChange?.(e);
        }}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          setIsPointer(false);
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
        }}
        onMouseDown={(e) => {
          setIsPointer(true);
          onMouseDown?.(e);
        }}
        onMouseEnter={(e) => {
          setHovered(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setHovered(false);
          onMouseLeave?.(e);
        }}
        className={cn(
          "w-full flex-1 resize-none bg-transparent px-3 py-2 text-sm",
          maxLength !== undefined && "pb-6",
          "border-0 ring-0 outline-none",
          "placeholder:text-gray-500",
          className,
        )}
        {...props}
      />
    );

    if (maxLength === undefined) return textarea;

    return (
      <div className="relative min-w-0 flex-1">
        {textarea}
        <span className="pointer-events-none absolute bottom-2 left-3 select-none font-mono text-xs font-medium tabular-nums text-muted-foreground">
          {displayCount}/{maxLength}
        </span>
      </div>
    );
  },
);
InputGroupTextarea.displayName = "InputGroupTextarea";

// ─── Exports ───────────────────────────────────────────────────────────────────

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};
