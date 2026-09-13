import { cn } from '@/ascendra-ui/shadcn';

export function AsideContent({
  dimmed = false,
  className,
  children,
  ...props
}: React.ComponentProps<'aside'> & { dimmed?: boolean }) {
  return (
    <aside
      data-slot="aside-content"
      inert={dimmed}
      className={cn(
        'relative flex w-full lg:w-fit',
        dimmed ? 'opacity-50' : '',
        className
      )}
      {...props}
    >
      <div className="group bg-muted lg:bg-background flex w-full flex-col rounded-xl py-1 lg:p-0">
        <div
          className={cn(
            '-m-2 overflow-hidden mask-[linear-gradient(to_bottom,black,black_calc(100%-8px),transparent)] p-2 transition-all duration-300 lg:m-0 lg:mask-none lg:p-0'
          )}
        >
          <div
            className={cn(
              'bg-background mx-1 rounded-lg ring-1 ring-(--color-umbra)/4 lg:m-0 lg:ring-0 dark:ring-black/20',
              'shadow-[0_1px_2px_0_rgba(25,28,33,0.06),0_0_2px_0_rgba(0,0,0,0.08)] lg:shadow-none',
              'dark:shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.01),0_1px_3px_0_rgba(0,0,0,0.4),0_0_3px_0_rgba(0,0,0,0.2)]'
            )}
          >
            <div>
              <div
                className={cn(
                  'border-border space-y-5 border border-t px-5 py-6 first:border-none lg:p-0'
                )}
              >
                {children}
                {/* {dimmed && (
                  <div className="from-background pointer-events-none absolute inset-0 bottom-0 bg-linear-to-t to-transparent" />
                )} */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
