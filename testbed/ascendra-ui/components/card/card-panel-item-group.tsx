import { cn } from "@/ascendra-ui/shadcn";

export function CardPanelItemGroup({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-panel-item-group"
      className={cn("flex flex-col space-y-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}
