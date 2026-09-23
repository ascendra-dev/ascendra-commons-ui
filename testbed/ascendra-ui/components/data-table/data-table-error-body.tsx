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
import { cn } from '@/ascendra-ui/shadcn';
import { LucideAlertCircle } from 'lucide-react';

interface DataTableErrorBodyProps {
  title?: string;
  description?: string;
  /** Overrides the query context's own isError — required when used without a DataTableQueryProvider ancestor. */
  isError?: boolean;
  /** Overrides the query context's own error — used for the default description when `description` isn't given. */
  error?: Error | null;
  /** Overrides the query context's own refetch. The Retry button is omitted entirely when neither this nor a query context is available. */
  onRetry?: () => void;
  /** Passed to the outer EmptyBody — set a height (e.g. "h-65") to match a fixed-height table's own cap, so swapping between this and real rows doesn't shift the surrounding layout. */
  className?: string;
}

export function DataTableErrorBody({
  title = 'Failed to load data',
  description,
  isError: isErrorProp,
  error: errorProp,
  onRetry,
  className,
}: DataTableErrorBodyProps = {}) {
  const queryCtx = useOptionalQueryContext();
  const isError = isErrorProp ?? queryCtx?.isError ?? false;
  const retry = onRetry ?? queryCtx?.refetch;

  if (!isError) return null;

  return (
    <EmptyBody className={cn(className)}>
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LucideAlertCircle strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>
            {description ?? errorProp?.message ?? queryCtx?.error?.message ?? 'Something went wrong.'}
          </EmptyDescription>
        </EmptyHeader>
        {retry && (
          <Button size="sm" variant="secondary" onClick={retry}>
            Retry
          </Button>
        )}
      </Empty>
    </EmptyBody>
  );
}
