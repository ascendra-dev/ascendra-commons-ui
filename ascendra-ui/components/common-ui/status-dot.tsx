import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/ascendra-ui/shadcn"

const statusDotVariants = cva(
  "block size-1.5 shrink-0 rounded-full shadow-[0_0_0_3px]",
  {
    variants: {
      variant: {
        orange: "bg-orange-500 shadow-orange-500/25",
        emerald: "bg-emerald-500 shadow-emerald-500/25",
        sky: "bg-sky-500 shadow-sky-500/25",
        violet: "bg-violet-500 shadow-violet-500/25",
        rose: "bg-rose-500 shadow-rose-500/25",
        amber: "bg-amber-500 shadow-amber-500/25",
        red: "bg-red-500 shadow-red-500/25",
        primary: "bg-primary shadow-primary/25",
        gray: "bg-gray-400 shadow-gray-400/25",
        warning: "bg-warning shadow-warning/25",
        positive: "bg-positive shadow-positive/25",
        info: "bg-info shadow-info/25"
      }
    },
    defaultVariants: {
      variant: "orange"
    }
  }
)

export function StatusDot({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof statusDotVariants>) {
  return (
    <span
      data-slot="status-dot"
      data-variant={variant}
      className={cn(statusDotVariants({ variant }), className)}
      {...props}
    />
  )
}
