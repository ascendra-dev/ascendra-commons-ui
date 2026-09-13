"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/ascendra-ui/shadcn";

/* ── Overlay ──────────────────────────────────────────────────────────────── */

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0",
        "fixed inset-0 z-200 bg-black/40 duration-300 supports-backdrop-filter:backdrop-blur-sm",
        // Dot-grid texture layered over the semi-transparent base
        "bg-[radial-gradient(rgba(255,255,255,0.07)_2px,transparent_2px)]",
        "bg-size-[20px_20px]",
        className,
      )}
      {...props}
    />
  );
}

/* ── Root ─────────────────────────────────────────────────────────────────── */

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

/* ── Content ──────────────────────────────────────────────────────────────── */

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  const childArray = React.Children.toArray(children);
  const isFooter = (c: React.ReactNode) =>
    React.isValidElement(c) &&
    (c.type as { displayName?: string }).displayName === "DialogFooter";

  const footerChild = childArray.find(isFooter);
  const innerChildren = childArray.filter((c) => !isFooter(c));

  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          /* positioning */
          "fixed top-18 left-1/2 z-1000 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 p-0 outline-none",
          /* enter / exit */
          "data-open:animate-in data-closed:animate-out",
          "data-closed:fade-out-0 data-open:fade-in-0",
          "data-closed:zoom-out-95 data-open:zoom-in-95",
          "duration-300",
          /* outer shell — overflow-hidden clips the inner card's top & side ring */
          "overflow-hidden rounded-xl",
          "bg-gray-50 dark:bg-(--color-gray-1500)",
          "ring-1 ring-black/8 dark:ring-black/[0.56]",
          "shadow-[0_32px_72px_-12px_rgba(25,28,33,0.20),0_16px_32px_-6px_rgba(25,28,33,0.12)]",
          "dark:shadow-[0_32px_72px_-12px_rgba(0,0,0,0.40),0_16px_32px_-6px_rgba(0,0,0,0.40)]",
          className,
        )}
        {...props}
      >
        {/*
          Inner card — flush with outer on all sides.
          The outer's overflow-hidden clips the ring on top & sides,
          so only the bottom border + rounded-b corners are visible,
          giving the "body is raised" effect.
        */}
        <div
          data-slot="dialog-inner"
          className={cn(
            "overflow-hidden rounded-b-xl",
            "bg-white dark:bg-(--color-gray-1400)",
            "ring-1 ring-black/8 dark:ring-white/8",
            "shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_2px_rgba(0,0,0,0.06)]",
          )}
        >
          {innerChildren}
        </div>

        {/* DialogFooter renders outside the raised card, flat in the gray shell */}
        {footerChild && (
          <div data-slot="dialog-footer-wrapper" className="p-4">
            {footerChild}
          </div>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/* ── Header ───────────────────────────────────────────────────────────────── */

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "border-border flex flex-col gap-0.5 border-b px-5 py-4",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-foreground text-base font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

/* ── Body ─────────────────────────────────────────────────────────────────── */

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("p-5 text-sm", className)}
      {...props}
    />
  );
}

/* ── Footer — button grid, rendered outside the raised card in the gray shell */

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "grid auto-cols-fr grid-flow-col gap-3",
        "[&_button]:justify-center",
        className,
      )}
      {...props}
    />
  );
}
DialogFooter.displayName = "DialogFooter";

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
};
