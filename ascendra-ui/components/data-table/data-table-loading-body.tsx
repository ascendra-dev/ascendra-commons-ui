'use client';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/ascendra-ui/components/ui/empty';
import { EmptyBody } from '@/ascendra-ui/components/ui/table';
import { useDataTableData } from '@/ascendra-ui/providers/data-table/data-table.provider';
import { LuLoader } from 'react-icons/lu';

export function DataTableLoadingBody() {
  const { isLoading } = useDataTableData();

  if (!isLoading) return null;

  return (
    <EmptyBody>
      <Empty>
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
