import * as React from 'react';
import { LuCircleAlert, LuLoaderCircle, LuTextSearch } from 'react-icons/lu';

import { Button } from '@/ascendra-ui/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/ascendra-ui/components/ui/empty';
import { cn } from '@/ascendra-ui/shadcn';

export function WithState({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function WithLoading({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function WithError({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function NormalState({
  if: condition,
  children,
}: {
  if: boolean;
  children: React.ReactNode;
}) {
  if (!condition) return null;
  return <>{children}</>;
}

interface StateProps {
  if: boolean;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function LoadingState({
  if: condition,
  children,
  title = 'Loading…',
  description = 'Please wait while we load your data.',
  icon = <LuLoaderCircle className="animate-spin" strokeWidth={2} />,
  className,
  ...props
}: React.ComponentProps<typeof Empty> & StateProps) {
  if (!condition) return null;
  if (children) return <>{children}</>;
  return (
    <Empty className={cn('h-full', className)} {...props}>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function EmptyState({
  if: condition,
  children,
  title = 'No results found',
  description = 'There are no items to display right now.',
  icon = <LuTextSearch strokeWidth={2} />,
  className,
  ...props
}: React.ComponentProps<typeof Empty> & StateProps) {
  if (!condition) return null;
  if (children) return <>{children}</>;
  return (
    <Empty className={cn('h-full', className)} {...props}>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function ErrorState({
  if: condition,
  children,
  error,
  title = 'Failed to load data',
  description = error?.message ?? 'Something went wrong.',
  icon = <LuCircleAlert strokeWidth={2} />,
  onRetry,
  className,
  ...props
}: React.ComponentProps<typeof Empty> &
  StateProps & { error?: Error | null; onRetry?: () => void }) {
  if (!condition) return null;
  if (children) return <>{children}</>;
  return (
    <Empty className={cn('h-full', className)} {...props}>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </Empty>
  );
}
