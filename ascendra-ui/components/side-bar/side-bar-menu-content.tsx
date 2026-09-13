import { cn } from '@/ascendra-ui/shadcn';

export function SideBarMenuContent({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div data-slot="side-bar-menu-content"
      className={cn(
        'max-h-0 overflow-hidden p-[0.5px] opacity-0 transition-all duration-500 ease-in-out group-data-[open=true]:max-h-200 group-data-[open=true]:opacity-100',
        className
      )}
      {...props}
    >
      <div className="relative mt-0 p-0.5">
        <div className="bg-border pointer-events-none absolute top-0 bottom-0 left-5 w-px" />
        <div className="flex flex-col gap-0.5">{children}</div>
      </div>
    </div>
  );
}
