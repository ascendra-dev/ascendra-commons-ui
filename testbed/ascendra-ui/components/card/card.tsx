"use client";

import React, { createContext, useContext, useState } from "react";

import { cn } from "@/ascendra-ui/shadcn";
import {
  buildBorderClasses,
  type BorderConfig,
} from "@/ascendra-ui/components/ui/accent-styles";

type CardContextValue = {
  collapseable: boolean;
  collapsed: boolean;
  onToggle: () => void;
  step?: number;
};

const CardContext = createContext<CardContextValue>({
  collapseable: false,
  collapsed: false,
  onToggle: () => {},
  step: undefined,
});

export function useCardContext() {
  return useContext(CardContext);
}

export function Card({
  danger = false,
  collapseable,
  hasError = false,
  step,
  border,
  inverse = false,
  className,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  danger?: boolean;
  collapseable?: "expanded" | "collapsed";
  hasError?: boolean;
  step?: number;
  border?: BorderConfig;
  inverse?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(collapseable === "collapsed");

  return (
    <CardContext.Provider
      value={{
        collapseable: !!collapseable,
        collapsed,
        onToggle: () => setCollapsed((prev) => !prev),
        step,
      }}
    >
      <section
        data-slot="card"
        className={cn(
          "group bg-muted flex flex-col rounded-xl pb-1 has-data-[slot=card-header]:pt-1",
          danger && "bg-red-50 dark:bg-(--color-red-1500)",
          hasError &&
            collapsed &&
            "outline-2 -outline-offset-2 outline-destructive",
          border && buildBorderClasses(border),
          inverse && "dark",
          className,
        )}
        {...props}
      >
        {children}
      </section>
    </CardContext.Provider>
  );
}
