"use client";

import { LuMaximize, LuMinimize } from "react-icons/lu";

import { cn } from "@/ascendra-ui/shadcn";
import { useCardContext } from "@/ascendra-ui/components/card/card";

export function CardHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"header">) {
  const { collapseable, collapsed, onToggle } = useCardContext();

  if (!collapseable) {
    return (
      <header
        data-slot="card-header"
        className={cn("px-6 py-4", className)}
        {...props}
      >
        {children}
      </header>
    );
  }

  return (
    <header
      data-slot="card-header"
      className={cn("px-6 py-4", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div>{children}</div>
        <button
          type="button"
          aria-label={collapsed ? "Expand section" : "Collapse section"}
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {collapsed ? (
            <LuMaximize className="size-3.5" />
          ) : (
            <LuMinimize className="size-3.5" />
          )}
        </button>
      </div>
    </header>
  );
}
