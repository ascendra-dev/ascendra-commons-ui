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
  /** Overrides the query context's own isError — required when used without a DataTableQueryProvider ancestor. */
  isError?: boolean;
  /** Overrides the query context's own error — used for the default description when `description` isn't given. */
  error?: Error | null;
  /** Overrides the query context's own refetch. The Retry button is omitted entirely when neither this nor a query context is available. */
  onRetry?: () => void;
}

export function DataTableErrorBody({
  title = 'Failed to load data',
  description,
  isError: isErrorProp,
  error: errorProp,
  onRetry,
}: DataTableErrorBodyProps = {}) {
  const queryCtx = useOptionalQueryContext();
  const isError = isErrorProp ?? queryCtx?.isError ?? false;
  const retry = onRetry ?? queryCtx?.refetch;

  if (!isError) return null;

  return (
    <EmptyBody>
      <Empty>
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
