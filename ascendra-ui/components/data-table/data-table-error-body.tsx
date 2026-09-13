'use client';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/ascendra-ui/components/ui/empty';
import { EmptyBody } from '@/ascendra-ui/components/ui/table';
import { Button } from '@/ascendra-ui/components/ui/button';
import { useOptionalQueryContext } from '@/ascendra-ui/providers/data-table-query/data-table-query.provider';
import { LucideAlertCircle } from 'lucide-react';

interface DataTableErrorBodyProps {
  title?: string;
  description?: string;
}

export function DataTableErrorBody({
  title = 'Failed to load data',
  description,
}: DataTableErrorBodyProps) {
  const queryCtx = useOptionalQueryContext();

  if (!queryCtx?.isError) return null;

  return (
    <EmptyBody>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LucideAlertCircle strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>
            {description ?? queryCtx.error?.message ?? 'Something went wrong.'}
          </EmptyDescription>
        </EmptyHeader>
        <Button size="sm" variant="secondary" onClick={() => queryCtx.refetch()}>
          Retry
        </Button>
      </Empty>
    </EmptyBody>
  );
}
