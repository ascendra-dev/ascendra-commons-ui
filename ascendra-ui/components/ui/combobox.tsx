"use client";

import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react";

import { cn } from "@/ascendra-ui/shadcn";
import { ChevronDownIcon, XIcon, CheckIcon } from "lucide-react";

const ComboboxAnchorContext = React.createContext<{
  anchor: HTMLElement | null;
  setAnchor: (node: HTMLElement | null) => void;
  readOnly?: boolean;
} | null>(null);

type ComboboxRootType = {
  <Value, Multiple extends boolean | undefined = false>(
    props: ComboboxPrimitive.Root.Props<Value, Multiple> & { readOnly?: boolean }
  ): React.ReactNode;
};

function ComboboxWrapper<Value, Multiple extends boolean | undefined = false>({
  readOnly,
  open,
  onOpenChange,
  ...props
}: ComboboxPrimitive.Root.Props<Value, Multiple> & { readOnly?: boolean }) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  return (
    <ComboboxAnchorContext.Provider value={{ anchor, setAnchor, readOnly }}>
      <ComboboxPrimitive.Root
        open={readOnly ? false : open}
        onOpenChange={readOnly ? () => {} : onOpenChange}
        {...props}
      />
    </ComboboxAnchorContext.Provider>
  );
}

const Combobox = ComboboxWrapper as ComboboxRootType;

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn(
        "group focus-visible:ring-primary flex items-center justify-center rounded-sm p-0.5 outline-none hover:bg-black/5 focus-visible:ring-2 dark:hover:bg-white/10 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 transition-transform duration-150 group-aria-expanded:rotate-180" />
    </ComboboxPrimitive.Trigger>
  );
}

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      className={cn(
        "focus-visible:ring-primary flex items-center justify-center rounded-sm p-0.5 outline-none hover:bg-black/5 focus-visible:ring-2 dark:hover:bg-white/10 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <XIcon className="pointer-events-none" />
    </ComboboxPrimitive.Clear>
  );
}

function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: ComboboxPrimitive.Input.Props & {
  showTrigger?: boolean;
  showClear?: boolean;
}) {
  const [isPointer, setIsPointer] = React.useState(false);
  const ctx = React.useContext(ComboboxAnchorContext);
  const readOnly = ctx?.readOnly;

  return (
    <div
      ref={ctx?.setAnchor}
      onMouseDown={() => !readOnly && setIsPointer(true)}
      onKeyDown={(e) => { if (e.key === 'Tab') setIsPointer(false); }}
      className={cn(
        "group/input-group py-0.75",
        "group relative flex items-center px-1",
        "has-[>[data-align=inline-end]]:pr-0 has-[>[data-align=inline-start]]:pl-0",
        "has-[>[data-align=inline-end]]:*:data-[slot=input-group-control]:pr-1.5",
        "has-[>[data-align=inline-start]]:*:data-[slot=input-group-control]:pl-2.5",
        "w-auto min-w-fit overflow-hidden rounded-[0.25rem]",
        "text-foreground font-medium",
        "transition-all",
        "has-disabled:cursor-not-allowed has-disabled:opacity-40",
        /* Invalid */
        "has-aria-invalid:outline-2 has-aria-invalid:outline-destructive has-aria-invalid:outline-offset-1",
        "h-8",
        /* State-dependent: readonly vs normal */
        readOnly ? [
          "bg-gray-100 dark:bg-white/5",
          "shadow-[0_0_0_1px_#d1d5db] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]",
          "cursor-default",
        ] : [
          "bg-secondary",
          "shadow-[inset_0_1px_0.5px_0_rgba(255,255,255,0.05),0_2px_2px_-1px_rgba(0,0,0,0.06),0_4px_4px_-2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.1)]",
          "dark:shadow-[inset_0_1px_0.5px_0_rgba(255,255,255,0.05),0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24),0_0_0_1px_rgba(0,0,0,0.1)]",
          "before:pointer-events-none before:absolute before:inset-0",
          "before:bg-linear-to-b before:from-black/0 before:to-black/2 before:from-30%",
          "before:transition-opacity dark:before:to-black/12",
          "cursor-text",
          "hover:before:opacity-0",
          "hover:bg-gray-50",
          "dark:hover:bg-secondary",
          !isPointer &&
            "has-[input:focus-visible]:outline-primary! has-[input:focus-visible]:outline-2! has-[input:focus-visible]:outline-offset-1!",
        ],
        className,
      )}
    >
      {children}
      <ComboboxPrimitive.Input
        data-slot="input-group-control"
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent px-1.5 py-1 text-sm",
          "border-0 ring-0 outline-none",
          "placeholder:text-gray-500 dark:placeholder:text-gray-700",
        )}
        disabled={disabled}
        readOnly={readOnly}
        {...props}
      />
      {!readOnly && (
        <div className="group/actions flex items-center gap-1 opacity-70">
          {showClear && <ComboboxClear disabled={disabled} />}
          {showTrigger && (
            <ComboboxTrigger
              disabled={disabled}
              className={cn(
                "hover:bg-transparent",
                showClear &&
                  "group-has-[[data-slot=combobox-clear]:not([hidden])]:hidden",
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    "side" | "align" | "sideOffset" | "alignOffset" | "anchor"
  >) {
  const ctx = React.useContext(ComboboxAnchorContext);
  const finalAnchor = anchor || ctx?.anchor || undefined;

  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={finalAnchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={!!anchor}
          className={cn(
            // Group context (used by Empty)
            "group/combobox-content relative p-1",
            // Sizing
            "max-h-(--available-height) w-(--anchor-width) max-w-(--available-width)",
            "min-w-(--anchor-width)",
            "origin-(--transform-origin)",
            "data-[chips=true]:min-w-(--anchor-width)",
            // Background + shape — matches SelectContent / DropdownMenuContent
            "dark:[:where(&)]:bg-secondary [:where(&)]:bg-white",
            "overflow-hidden [:where(&)]:rounded-md",
            // Ring
            "[:where(&)]:ring-1 [:where(&)]:ring-[#191c21]/8",
            "dark:[:where(&)]:ring-[#111113]/32",
            // Dark inner ring overlay (matches SelectContent)
            "dark:after:pointer-events-none dark:after:absolute dark:after:inset-0 dark:after:z-10",
            "dark:after:size-full dark:after:rounded-[inherit] dark:after:ring-1 dark:after:ring-white/4 dark:after:ring-inset",
            // Shadow
            "shadow-[0_16px_36px_-6px_rgba(0,0,0,.07),0_6px_16px_-2px_rgba(0,0,0,.2)]",
            // Animation
            "data-open:animate-in data-closed:animate-out",
            "data-closed:fade-out-0 data-open:fade-in-0",
            "data-closed:zoom-out-95 data-open:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            "data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2",
            "duration-100",
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        "no-scrollbar overflow-y-auto overscroll-contain",
        "max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))]",
        "scroll-py-1 p-1 data-empty:p-0",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        // Layout — matches SelectItem grid approach
        "group relative grid cursor-default grid-cols-[1fr_1rem] items-center gap-2",
        "rounded-[0.375rem] px-2 py-1 text-sm outline-hidden select-none",
        // Highlight state (hover / keyboard)
        "data-highlighted:text-foreground data-highlighted:bg-[#f6f6f7]",
        "data-highlighted:ring-1 data-highlighted:ring-[#EBEBED] data-highlighted:ring-inset",
        "dark:data-highlighted:bg-border dark:data-highlighted:ring-[#1f1f23]",
        // Selected state (Base UI uses data-selected)
        "data-selected:text-foreground data-selected:bg-[#f6f6f7]",
        "data-selected:ring-1 data-selected:ring-[#EBEBED] data-selected:ring-inset",
        "dark:data-selected:bg-border dark:data-selected:ring-[#1f1f23]",
        // Clerk pattern: fade selected bg when hovering other items
        "group-hover/content:data-selected:not-data-highlighted:bg-transparent",
        "group-hover/content:data-selected:not-data-highlighted:ring-0",
        // SVG
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Disabled
        "data-disabled:pointer-events-none data-disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {children}
      <span className="flex size-4 items-center justify-center">
        <ComboboxPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </ComboboxPrimitive.ItemIndicator>
      </span>
    </ComboboxPrimitive.Item>
  );
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={cn("scroll-my-1", className)}
      {...props}
    />
  );
}

function ComboboxLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn("text-muted-foreground px-1.5 py-1 text-xs", className)}
      {...props}
    />
  );
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return (
    <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
  );
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        "text-muted-foreground hidden w-full justify-center py-1 text-center text-sm",
        "group-data-empty/combobox-content:flex",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function ComboboxChips({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> &
  ComboboxPrimitive.Chips.Props) {
  const [isPointer, setIsPointer] = React.useState(false);
  const ctx = React.useContext(ComboboxAnchorContext);
  const readOnly = ctx?.readOnly;

  return (
    <ComboboxPrimitive.Chips
      ref={ctx?.setAnchor}
      data-slot="combobox-chips"
      onMouseDown={(e) => {
        if (!readOnly) setIsPointer(true);
        props.onMouseDown?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Tab') setIsPointer(false);
        props.onKeyDown?.(e);
      }}
      className={cn(
        "group/input-group relative flex min-h-8 flex-wrap items-center gap-1.5 px-1 py-1",
        "w-full overflow-hidden rounded-[0.25rem]",
        "text-foreground font-medium",
        "transition-all",
        "has-disabled:cursor-not-allowed has-disabled:opacity-40",
        /* Invalid */
        "aria-invalid:outline-2 aria-invalid:outline-destructive aria-invalid:outline-offset-1",
        /* State-dependent: readonly vs normal */
        readOnly ? [
          "bg-gray-100 dark:bg-white/5",
          "shadow-[0_0_0_1px_#d1d5db] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]",
          "cursor-default",
        ] : [
          "bg-secondary",
          "shadow-[inset_0_1px_0.5px_0_rgba(255,255,255,0.05),0_2px_2px_-1px_rgba(0,0,0,0.06),0_4px_4px_-2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.1)]",
          "dark:shadow-[inset_0_1px_0.5px_0_rgba(255,255,255,0.05),0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24),0_0_0_1px_rgba(0,0,0,0.1)]",
          "before:pointer-events-none before:absolute before:inset-0",
          "before:bg-linear-to-b before:from-black/0 before:to-black/2 before:from-30%",
          "before:transition-opacity dark:before:to-black/12",
          "cursor-text",
          "hover:before:opacity-0",
          "hover:bg-gray-50",
          "dark:hover:bg-secondary",
          !isPointer &&
            "has-[input:focus-visible]:outline-primary! has-[input:focus-visible]:outline-2! has-[input:focus-visible]:outline-offset-1!",
        ],
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChip({
  className,
  children,
  showRemove = true,
  ...props
}: ComboboxPrimitive.Chip.Props & {
  showRemove?: boolean;
}) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        "text-foreground bg-[var(--color-gray-100)]",
        "border border-[var(--color-gray-200)]",
        "dark:border-[var(--color-gray-1100)] dark:bg-[var(--color-gray-1300)]",
        "flex h-[calc(--spacing(5.25))] w-fit items-center justify-center gap-1",
        "rounded-[0.25rem] px-1.5 text-xs font-medium whitespace-nowrap",
        "has-data-[slot=combobox-chip-remove]:pr-0",
        "has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          className="-mr-0.5 flex items-center justify-center rounded-xs p-0.5 opacity-50 hover:bg-black/5 hover:opacity-100 focus-visible:outline-1 dark:hover:bg-white/10"
          data-slot="combobox-chip-remove"
        >
          <XIcon className="pointer-events-none size-3" />
        </ComboboxPrimitive.ChipRemove>
      )}
    </ComboboxPrimitive.Chip>
  );
}

function ComboboxChipsInput({
  className,
  ...props
}: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className={cn(
        "min-w-16 flex-1 bg-transparent px-1 py-0.5 text-sm outline-none",
        "placeholder:text-gray-500 dark:placeholder:text-gray-700",
        className,
      )}
      {...props}
    />
  );
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null);
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
};
