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

interface DataTableEmptyBodyProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  /** Overrides the DataTableProvider's own isLoading — required when used without a DataTableProvider ancestor. */
  isLoading?: boolean;
  /** Overrides the DataTableProvider's own pagedData.length === 0 check — required when used without a DataTableProvider ancestor. */
  isEmpty?: boolean;
}

export function DataTableEmptyBody({
  icon = <LuTextSearch strokeWidth={2} />,
  title = 'No results found',
  description = 'There are no items to display right now.',
  isLoading: isLoadingProp,
  isEmpty: isEmptyProp,
}: DataTableEmptyBodyProps) {
  const ctx = useOptionalDataTableData();
  const isLoading = isLoadingProp ?? ctx?.isLoading ?? false;
  const isEmpty = isEmptyProp ?? (ctx ? ctx.pagedData.length === 0 : false);

  if (isLoading || !isEmpty) return null;

  return (
    <EmptyBody>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">{icon}</EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </EmptyBody>
  );
}
