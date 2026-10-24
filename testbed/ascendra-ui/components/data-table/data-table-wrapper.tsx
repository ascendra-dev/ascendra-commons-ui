'use client';

import * as React from 'react';
import { cn } from '@/ascendra-ui/shadcn';
import { useIsQueryParamPanelOpen } from '@/ascendra-ui/providers/data-table-query/data-table-query.provider';
import {
  buildBorderClasses,
  type BorderConfig,
} from '@/ascendra-ui/components/ui/accent-styles';

export function DataTableWrapper({
  border,
  className,
  ...props
}: React.ComponentProps<'div'> & { border?: BorderConfig }) {
  const showParamPanel = useIsQueryParamPanelOpen();

  return (
    <div
      data-slot="data-table-wrapper"
      data-param-panel-open={showParamPanel || undefined}
      className="grid transition-[grid-template-rows] duration-300 ease-in-out"
      style={{ gridTemplateRows: showParamPanel ? '0fr' : '1fr' }}
    >
      <div data-slot="data-table-clip" className="min-h-0 overflow-hidden">
        <div
          data-slot="table-container"
          className={cn(
            'bg-muted flex flex-col rounded-xl py-1',
            border && buildBorderClasses(border),
            className,
          )}
          {...props}
        />
      </div>
    </div>
  );
}
