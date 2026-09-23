'use client';

import * as React from 'react';
import { LuTextSearch } from 'react-icons/lu';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/ascendra-ui/components/ui/empty';
import { EmptyBody } from '@/ascendra-ui/components/ui/table';
import { useOptionalDataTableData } from '@/ascendra-ui/providers/data-table/data-table.provider';
import { cn } from '@/ascendra-ui/shadcn';

interface DataTableEmptyBodyProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  /** Overrides the DataTableProvider's own isLoading — required when used without a DataTableProvider ancestor. */
  isLoading?: boolean;
  /** Overrides the DataTableProvider's own pagedData.length === 0 check — required when used without a DataTableProvider ancestor. */
  isEmpty?: boolean;
  /** Passed to the outer EmptyBody — set a height (e.g. "h-65") to match a fixed-height table's own cap, so swapping between this and real rows doesn't shift the surrounding layout. */
  className?: string;
}

export function DataTableEmptyBody({
  icon = <LuTextSearch strokeWidth={2} />,
  title = 'No results found',
  description = 'There are no items to display right now.',
  isLoading: isLoadingProp,
  isEmpty: isEmptyProp,
  className,
}: DataTableEmptyBodyProps = {}) {
  const ctx = useOptionalDataTableData();
  const isLoading = isLoadingProp ?? ctx?.isLoading ?? false;
  const isEmpty = isEmptyProp ?? (ctx ? ctx.pagedData.length === 0 : false);

  if (isLoading || !isEmpty) return null;

  return (
    <EmptyBody className={cn(className)}>
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">{icon}</EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </EmptyBody>
  );
}
