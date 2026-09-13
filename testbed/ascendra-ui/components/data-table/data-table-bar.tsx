'use client';

import { useOptionalQueryContext } from '@/ascendra-ui/providers/data-table-query/data-table-query.provider';
import { cn } from '@/ascendra-ui/shadcn';

export function DataTableBar({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  const queryCtx = useOptionalQueryContext();
  const showParamPanel = !!queryCtx?.activeQuery.params?.length && queryCtx.confirmedParams === null;
  return (
    <div
      data-slot="data-table-bar"
      className={cn(
        'flex w-full flex-col items-start justify-between gap-4 px-0.5 sm:flex-row sm:items-center',
        showParamPanel && 'hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
