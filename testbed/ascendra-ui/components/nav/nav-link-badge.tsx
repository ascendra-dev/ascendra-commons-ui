import { cn } from '@/ascendra-ui/shadcn';

export function NavLinkBadge({
  children,
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="nav-link-badge"
      className={cn(
        'ml-1 inline-flex items-center rounded-[0.375rem] border border-dashed border-sky-500 px-1 text-xs font-light text-sky-500',
        className
      )}
      {...props}
    >
      <span className="px-0.5">{children}</span>
    </span>
  );
}
