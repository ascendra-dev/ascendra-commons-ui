"use client";

import { cn } from "@/ascendra-ui/shadcn";

export function CardPanelItem({
  collapsed,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { collapsed?: boolean }) {
  return (
    <div
      data-slot="card-panel-item"
      data-collapsed={collapsed ? "true" : "false"}
      inert={collapsed}
      className={cn(
        "grid transition-all duration-300 border-border border-t first:border-none",
        collapsed ? "grid-rows-[0fr] border-none" : "grid-rows-[1fr]",
        className,
      )}
      {...props}
    >
      <div className="overflow-hidden transition-all duration-300">
        <div className="space-y-5 px-5 py-6">{children}</div>
      </div>
    </div>
  );
}
