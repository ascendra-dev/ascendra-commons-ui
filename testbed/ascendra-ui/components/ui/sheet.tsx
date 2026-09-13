"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/ascendra-ui/shadcn";
import {
  TabsContext,
  useTabs,
} from "@/ascendra-ui/providers/tabs/tabs.provider";

/* ── Overlay ──────────────────────────────────────────────────────────────── */

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0",
        "fixed inset-0 z-200 bg-transparent duration-150",
        /* "fixed inset-0 z-200 bg-black/40 duration-300 supports-backdrop-filter:backdrop-blur-sm", */
        /* "bg-[radial-gradient(rgba(255,255,255,0.07)_2px,transparent_2px)]", */
        /* "bg-size-[20px_20px]", */
        className,
      )}
      {...props}
    />
  );
}

/* ... Root, Trigger, Close remain the same ... */

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

/* ── Content ──────────────────────────────────────────────────────────────── */

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
}) {
  return (
    <SheetPrimitive.Portal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          /* Base positioning and shape */
          "fixed z-1000 flex flex-col overflow-hidden bg-white outline-none dark:bg-(--color-gray-1500)",
          /* Animation settings */
          "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 duration-300 ease-in-out",

          /* Side-specific: sm/md flush + responsive rounding; lg floating */
          side === "right" && [
            "border-border w-full border",
            /* sm: flush to right edge, 3rem breathing space on left via max-width */
            "top-0 right-0 bottom-0 max-w-[calc(100%-3rem)]",
            "rounded-tl-xl rounded-bl-xl rounded-tr-none rounded-br-none",
            /* md: allow full max-w-md (naturally leaves space on left) */
            "md:max-w-md",
            /* lg: floating offsets + all corners rounded */
            "lg:top-3 lg:right-3 lg:bottom-3 lg:rounded-xl",
            "data-closed:slide-out-to-right data-open:slide-in-from-right",
          ],
          side === "left" && [
            "border-border w-full border",
            /* sm: flush to left edge, breathing space on right via max-width */
            "top-0 left-0 bottom-0 max-w-[calc(100%-3rem)]",
            "rounded-tr-xl rounded-br-xl rounded-tl-none rounded-bl-none",
            /* md: allow full max-w-md */
            "md:max-w-md",
            /* lg: floating offsets + all corners rounded */
            "lg:top-3 lg:left-3 lg:bottom-3 lg:rounded-xl",
            "data-closed:slide-out-to-left data-open:slide-in-from-left",
          ],
          side === "top" && [
            "border-border h-auto border",
            /* sm/md: flush to top, left, right edges; round only bottom corners */
            "top-0 right-0 left-0 rounded-bl-xl rounded-br-xl rounded-tl-none rounded-tr-none",
            /* lg: floating offsets + all corners rounded */
            "lg:top-3 lg:right-3 lg:left-3 lg:rounded-xl",
            "data-closed:slide-out-to-top data-open:slide-in-from-top",
          ],
          side === "bottom" && [
            "border-border h-auto border",
            /* sm/md: flush to bottom, left, right edges; round only top corners */
            "bottom-0 right-0 left-0 rounded-tl-xl rounded-tr-xl rounded-bl-none rounded-br-none",
            /* lg: floating offsets + all corners rounded */
            "lg:bottom-3 lg:right-3 lg:left-3 lg:rounded-xl",
            "data-closed:slide-out-to-bottom data-open:slide-in-from-bottom",
          ],
          "shadow-[0_32px_72px_-12px_rgba(25,28,33,0.2),0_16px_32px_-6px_theme(--color-black/0.2)] dark:shadow-[0_32px_72px_-12px_theme(--color-black/0.4),0_16px_32px_-6px_theme(--color-black/0.4)]",

          className,
        )}
        {...props}
      >
        {children}

        {showCloseButton && (
          <SheetPrimitive.Close className="text-muted-foreground hover:bg-accent hover:text-foreground absolute top-4 right-4 rounded-md p-1 transition-colors">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

/* ... Header, Title, Description, Body, Footer remain the same ... */

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "flex flex-col gap-1 bg-gray-50 px-6 py-5 dark:bg-(--color-gray-1500)",
        className,
      )}
      {...props}
    />
  );
}

function SheetSubHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-sub-header"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground text-sm font-medium", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-xs", className)}
      {...props}
    />
  );
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("flex-1 overflow-y-auto px-6 py-5", className)}
      {...props}
    />
  );
}

function SheetSubFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-sub-footer"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "border-border flex items-center justify-end gap-3 border-t px-6 py-4",
        className,
      )}
      {...props}
    />
  );
}

/* ── Tabs ─────────────────────────────────────────────────────────────────── */

function SheetTabs({
  defaultTab,
  children,
}: {
  defaultTab: string;
  children: React.ReactNode;
}) {
  const [active, setActive] = React.useState(defaultTab);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      {children}
    </TabsContext.Provider>
  );
}

function SheetTabList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-tab-list"
      className={cn("flex border-b border-border", className)}
      {...props}
    />
  );
}

function SheetTabTrigger({
  value,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { value: string }) {
  const { active, setActive } = useTabs();
  const isActive = active === value;
  return (
    <button
      data-slot="sheet-tab-trigger"
      data-active={isActive || undefined}
      onClick={() => setActive(value)}
      className={cn(
        "relative px-3 py-2.5 text-sm capitalize transition-colors",
        isActive
          ? "text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-foreground after:content-['']"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function SheetTabContent({
  value,
  className,
  ...props
}: React.ComponentProps<"div"> & { value: string }) {
  const { active } = useTabs();
  if (active !== value) return null;
  return (
    <div data-slot="sheet-tab-content" className={cn(className)} {...props} />
  );
}

/* ── Section ──────────────────────────────────────────────────────────────── */

function SheetSection({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-section"
      className={cn(
        "not-first:mt-5 not-first:border-t not-first:border-border not-first:pt-5",
        className,
      )}
      {...props}
    />
  );
}

function SheetSectionHeader({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="sheet-section-header"
      className={cn(
        "mb-4 text-xs tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/* ── Properties ───────────────────────────────────────────────────────────── */

function SheetProperties({
  keyWidth = "140px",
  className,
  style,
  ...props
}: React.ComponentProps<"dl"> & { keyWidth?: string }) {
  return (
    <dl
      data-slot="sheet-properties"
      className={cn("grid gap-x-4 gap-y-3", className)}
      style={{ gridTemplateColumns: `${keyWidth} 1fr`, ...style }}
      {...props}
    />
  );
}

function SheetKey({ className, ...props }: React.ComponentProps<"dt">) {
  return (
    <dt
      data-slot="sheet-key"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function SheetValue({ className, ...props }: React.ComponentProps<"dd">) {
  return (
    <dd
      data-slot="sheet-value"
      className={cn("text-sm text-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetSubHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  SheetSubFooter,
  SheetTabs,
  SheetTabList,
  SheetTabTrigger,
  SheetTabContent,
  SheetSection,
  SheetSectionHeader,
  SheetProperties,
  SheetKey,
  SheetValue,
};
