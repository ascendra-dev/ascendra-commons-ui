import { cn } from "@/ascendra-ui/shadcn";

/* use class "flex-nowrap" if no line wrape is required */
/* variant="dashboard" adds a bottom border + margin to separate from content */
export function PageHeader({
  className,
  children,
  variant,
  ...props
}: React.ComponentProps<"header"> & { variant?: "dashboard" }) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        "flex flex-wrap items-center justify-between gap-5 pb-6 sm:flex-nowrap",
        variant === "dashboard" && "border-b border-border mb-8",
        className,
      )}
      {...props}
    >
      {children}
    </header>
  );
}
