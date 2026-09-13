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
import { useDataTableData } from '@/ascendra-ui/providers/data-table/data-table.provider';

interface DataTableEmptyBodyProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
}

export function DataTableEmptyBody({
  icon = <LuTextSearch strokeWidth={2} />,
  title = 'No results found',
  description = 'There are no items to display right now.',
}: DataTableEmptyBodyProps) {
  const { isLoading, pagedData } = useDataTableData();

  if (isLoading || pagedData.length > 0) return null;

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
