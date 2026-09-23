'use client';

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
import { LuLoader } from 'react-icons/lu';

interface DataTableLoadingBodyProps {
  /** Overrides the DataTableProvider's own isLoading — required when used without a DataTableProvider ancestor. */
  isLoading?: boolean;
  /** Passed to the outer EmptyBody — set a height (e.g. "h-65") to match a fixed-height table's own cap, so swapping between this and real rows doesn't shift the surrounding layout. */
  className?: string;
}

export function DataTableLoadingBody({ isLoading: isLoadingProp, className }: DataTableLoadingBodyProps = {}) {
  const ctx = useOptionalDataTableData();
  const isLoading = isLoadingProp ?? ctx?.isLoading ?? false;

  if (!isLoading) return null;

  return (
    <EmptyBody className={cn(className)}>
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LuLoader className="animate-spin" strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>Loading ...</EmptyTitle>
          <EmptyDescription>Please wait while data is being fetched.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </EmptyBody>
  );
}
